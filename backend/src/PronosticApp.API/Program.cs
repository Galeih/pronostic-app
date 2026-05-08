using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PronosticApp.API.Hubs;
using PronosticApp.API.Json;
using PronosticApp.Application.Interfaces;
using PronosticApp.Domain.Entities;
using PronosticApp.Infrastructure.Data;
using PronosticApp.Infrastructure.Services;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ───────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/pronosticapp-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// ─── Base de données (SQLite en dev, PostgreSQL en prod) ───────────────────
var dbProvider = builder.Configuration["DbProvider"] ?? "sqlite";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionString manquante.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbProvider == "postgresql")
        options.UseNpgsql(connectionString);
    else
        options.UseSqlite(connectionString);
});

// ─── Identity ──────────────────────────────────────────────────────────────
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ─── JWT ───────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key manquante dans la configuration.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // SignalR transmet le token JWT via query string (?access_token=...)
    // car les WebSockets ne supportent pas les en-têtes Authorization.
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// ─── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ─── Services applicatifs ──────────────────────────────────────────────────
builder.Services.AddScoped<ITokenService, JwtTokenService>();

// ─── SignalR ───────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── Controllers + Swagger ─────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Sérialise les enums en string ("Open", "Draft"…) au lieu de nombres (0, 1…)
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        );
        // Force DateTime/DateTime? à être sérialisés avec suffixe 'Z' (UTC).
        // SQLite + EF Core renvoie DateTimeKind.Unspecified, ce qui ferait
        // interpréter les dates comme heure locale côté navigateur.
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new UtcNullableDateTimeConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PronosticApp API",
        Version = "v1",
        Description = "API du jeu de pronostics sociaux entre amis"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Entrez votre token JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ─── Initialisation DB + Seed ──────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // EnsureCreated crée le schéma si inexistant.
    // Pour SQLite (dev) : si le schéma est obsolète (colonnes manquantes ajoutées
    // au modèle après la création initiale), on recrée la base proprement.
    db.Database.EnsureCreated();

    if (dbProvider != "postgresql")
    {
        var schemaOk = await IsSqliteSchemaUpToDateAsync(db);
        if (!schemaOk)
        {
            Log.Warning("Schéma SQLite obsolète détecté — recréation de la base de données...");
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            Log.Warning("Base de données recréée avec succès.");
        }
    }

    // ── Seed des rôles de base ─────────────────────────────────────────────
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var role in new[] { "Admin", "Player" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    // Note : les Boosts et Badges sont seedés via HasData dans leurs configurations EF
    // (BoostConfiguration.cs et BadgeConfiguration.cs) — EnsureCreated() les applique.

    // ── Backfill boosts pour les comptes existants ─────────────────────────
    // Attribue le kit de départ à tout utilisateur qui n'a encore aucun boost.
    // Idempotent : ne fait rien si l'utilisateur a déjà au moins un UserBoost.
    await BackfillStarterBoostsAsync(db);
}

// ─── Pipeline HTTP ─────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "PronosticApp API v1"));
}
else
{
    // Swagger accessible en prod aussi (pratique pour debug VPS)
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "PronosticApp API v1"));
}

app.UseSerilogRequestLogging();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

// ─── Vérification du schéma SQLite ────────────────────────────────────────────
// Vérifie que toutes les colonnes attendues du modèle actuel existent en base.
// Retourne false si au moins une colonne est manquante → la base sera recréée.
static async Task<bool> IsSqliteSchemaUpToDateAsync(AppDbContext db)
{
    var conn = db.Database.GetDbConnection();
    var needClose = conn.State != System.Data.ConnectionState.Open;
    if (needClose) await conn.OpenAsync();

    try
    {
        async Task<bool> HasColumn(string table, string column)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText =
                $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name='{column}'";
            return (long)(await cmd.ExecuteScalarAsync())! > 0;
        }

        async Task<bool> TableExists(string table)
        {
            using var cmd2 = conn.CreateCommand();
            cmd2.CommandText = $"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{table}'";
            return (long)(await cmd2.ExecuteScalarAsync())! > 0;
        }

        // Colonnes ajoutées au modèle après la création initiale de la base
        var checks = new[]
        {
            await HasColumn("Predictions", "IsAnonymous"),
            await HasColumn("Votes",       "SecondOptionId"),
            await HasColumn("Votes",       "IsSecondVote"),
            await HasColumn("Votes",       "UsedCorrectionBoost"),
            // Channels (SignalR)
            await TableExists("Messages"),
        };

        return checks.All(ok => ok);
    }
    finally
    {
        if (needClose) await conn.CloseAsync();
    }
}

// ─── Backfill kit de boosts pour les utilisateurs existants ───────────────────
// Pour chaque utilisateur sans aucun boost, attribue le kit de départ.
// Ne tourne qu'une fois par compte : si l'utilisateur a déjà ≥1 UserBoost, on saute.
static async Task BackfillStarterBoostsAsync(AppDbContext db)
{
    var starterKit = new[]
    {
        (PronosticApp.Domain.Enums.BoostType.VoteCorrection, 2),
        (PronosticApp.Domain.Enums.BoostType.SecondVote,     1),
        (PronosticApp.Domain.Enums.BoostType.Sabotage,       1),
        (PronosticApp.Domain.Enums.BoostType.Shield,         1),
    };

    // Utilisateurs qui n'ont aucun boost
    var usersWithoutBoosts = await db.Users
        .Where(u => !u.IsGuest && !db.UserBoosts.Any(ub => ub.UserId == u.Id))
        .Select(u => u.Id)
        .ToListAsync();

    if (usersWithoutBoosts.Count == 0) return;

    var boosts = await db.Boosts.Where(b => b.IsActive).ToListAsync();

    foreach (var userId in usersWithoutBoosts)
    {
        foreach (var (boostType, qty) in starterKit)
        {
            var boost = boosts.FirstOrDefault(b => b.BoostType == boostType);
            if (boost == null) continue;

            db.UserBoosts.Add(new PronosticApp.Domain.Entities.UserBoost
            {
                UserId     = userId,
                BoostId    = boost.Id,
                Quantity   = qty,
                AcquiredAt = DateTime.UtcNow,
            });
        }
    }

    await db.SaveChangesAsync();
    Log.Information("Backfill boosts : kit attribué à {Count} utilisateur(s) existant(s).", usersWithoutBoosts.Count);
}
