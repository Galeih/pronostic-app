using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Domain.Entities;

namespace PronosticApp.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Prediction> Predictions => Set<Prediction>();
    public DbSet<PredictionOption> PredictionOptions => Set<PredictionOption>();
    public DbSet<Vote> Votes => Set<Vote>();
    public DbSet<Boost> Boosts => Set<Boost>();
    public DbSet<UserBoost> UserBoosts => Set<UserBoost>();
    public DbSet<PredictionBoostUsage> PredictionBoostUsages => Set<PredictionBoostUsage>();
    public DbSet<Badge> Badges => Set<Badge>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Appliquer toutes les configurations du dossier Configurations/
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
