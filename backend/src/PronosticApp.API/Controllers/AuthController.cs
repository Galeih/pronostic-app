using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Auth;
using PronosticApp.Application.Interfaces;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;
using PronosticApp.Infrastructure.Data;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser>    _userManager;
    private readonly SignInManager<AppUser>  _signInManager;
    private readonly ITokenService           _tokenService;
    private readonly AppDbContext            _db;

    // Stockage en mémoire des tokens de réinitialisation (token → (email, expiry))
    // Note : non persistant entre redémarrages — convient pour une appli entre amis.
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Email, DateTime Expiry)>
        _resetTokens = new();

    public AuthController(
        UserManager<AppUser>   userManager,
        SignInManager<AppUser> signInManager,
        ITokenService          tokenService,
        AppDbContext           db)
    {
        _userManager   = userManager;
        _signInManager = signInManager;
        _tokenService  = tokenService;
        _db            = db;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) ||
            string.IsNullOrWhiteSpace(request.Email)    ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Tous les champs sont obligatoires." });
        }

        var user = new AppUser
        {
            UserName  = request.UserName.Trim(),
            Email     = request.Email.Trim().ToLower(),
            CreatedAt = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
            return BadRequest(new { message = "Inscription echouee.", errors });
        }

        await _userManager.AddToRoleAsync(user, "Player");

        // Boosts de depart
        await GrantStarterBoostsAsync(user.Id);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(BuildAuthResponse(user, token));
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email et mot de passe obligatoires." });

        var user = await _userManager.FindByEmailAsync(request.Email.Trim().ToLower());
        if (user == null)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return Unauthorized(new { message = "Compte temporairement bloque. Reessaie dans quelques minutes." });

        if (!result.Succeeded)
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(BuildAuthResponse(user, token));
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        return Ok(new { message = "Deconnecte avec succes." });
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(MapToUserDto(user));
    }

    // POST /api/auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        // Toujours retourner 200 pour ne pas révéler si l'email existe
        if (string.IsNullOrWhiteSpace(request.Email))
            return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été généré." });

        var user = await _userManager.FindByEmailAsync(request.Email.Trim().ToLower());
        if (user == null)
            return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été généré." });

        // Générer un token sécurisé
        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        var expiry = DateTime.UtcNow.AddHours(1);
        _resetTokens[token] = (user.Email!, expiry);

        // Nettoyer les tokens expirés
        var expired = _resetTokens.Where(kv => kv.Value.Expiry < DateTime.UtcNow).Select(kv => kv.Key).ToList();
        foreach (var k in expired) _resetTokens.TryRemove(k, out _);

        // Retourner le token dans la réponse (pas d'email — appli entre amis)
        return Ok(new
        {
            message = "Lien de réinitialisation généré. Partage-le manuellement avec l'utilisateur.",
            resetToken = token,
            expiresAt  = expiry,
        });
    }

    // POST /api/auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { message = "Token et nouveau mot de passe obligatoires." });

        if (request.NewPassword.Length < 8)
            return BadRequest(new { message = "Le mot de passe doit faire au moins 8 caractères." });

        if (!_resetTokens.TryGetValue(request.Token, out var entry))
            return BadRequest(new { message = "Lien de réinitialisation invalide ou expiré." });

        if (entry.Expiry < DateTime.UtcNow)
        {
            _resetTokens.TryRemove(request.Token, out _);
            return BadRequest(new { message = "Lien de réinitialisation expiré. Demande-en un nouveau." });
        }

        var user = await _userManager.FindByEmailAsync(entry.Email);
        if (user == null)
            return BadRequest(new { message = "Utilisateur introuvable." });

        // Générer un token Identity pour la réinitialisation
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);

        if (!result.Succeeded)
        {
            var msg = result.Errors.FirstOrDefault()?.Description ?? "Erreur lors de la réinitialisation.";
            return BadRequest(new { message = msg });
        }

        // Invalider le token utilisé
        _resetTokens.TryRemove(request.Token, out _);

        return Ok(new { message = "Mot de passe réinitialisé avec succès. Tu peux te connecter." });
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /// <summary>
    /// Kit de boosts offert a chaque nouvel inscrit :
    ///   2x Correction  1x Double Vote  1x Sabotage  1x Bouclier
    /// </summary>
    private async Task GrantStarterBoostsAsync(string userId)
    {
        var starterKit = new[]
        {
            (BoostType.VoteCorrection, 2),
            (BoostType.SecondVote,     1),
            (BoostType.Sabotage,       1),
            (BoostType.Shield,         1),
        };

        var boosts = await _db.Boosts
            .Where(b => b.IsActive)
            .ToListAsync();

        foreach (var (boostType, qty) in starterKit)
        {
            var boost = boosts.FirstOrDefault(b => b.BoostType == boostType);
            if (boost == null) continue;

            _db.UserBoosts.Add(new UserBoost
            {
                UserId     = userId,
                BoostId    = boost.Id,
                Quantity   = qty,
                AcquiredAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
    }

    private AuthResponse BuildAuthResponse(AppUser user, string token) => new()
    {
        Token     = token,
        ExpiresAt = _tokenService.GetExpiryDate(),
        User      = MapToUserDto(user),
    };

    private static UserDto MapToUserDto(AppUser user) => new()
    {
        Id          = user.Id,
        UserName    = user.UserName!,
        Email       = user.Email!,
        AvatarUrl   = user.AvatarUrl,
        Level       = user.Level,
        Experience  = user.Experience,
        TotalPoints = user.TotalPoints,
        IsGuest     = user.IsGuest,
        CreatedAt   = user.CreatedAt,
    };
}
