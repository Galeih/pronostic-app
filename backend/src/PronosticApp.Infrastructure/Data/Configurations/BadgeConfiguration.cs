using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;

namespace PronosticApp.Infrastructure.Data.Configurations;

public class BadgeConfiguration : IEntityTypeConfiguration<Badge>
{
    public void Configure(EntityTypeBuilder<Badge> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name).IsRequired().HasMaxLength(100);
        builder.Property(b => b.Description).IsRequired().HasMaxLength(500);
        builder.Property(b => b.ConditionType).IsRequired().HasMaxLength(100);
        builder.Property(b => b.Rarity).HasConversion<string>();

        // Seed : les badges initiaux
        builder.HasData(
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Le Visionnaire", Description = "Tu avais tout prévu.", Rarity = BadgeRarity.Rare, ConditionType = "WIN_STREAK", ConditionValue = 5, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "Le Maudit", Description = "Même une pièce ferait mieux.", Rarity = BadgeRarity.Common, ConditionType = "LOSS_STREAK", ConditionValue = 10, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "Le Sniper", Description = "Personne n'y croyait. Sauf toi.", Rarity = BadgeRarity.Epic, ConditionType = "SNIPE_WIN", ConditionValue = 1, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "Le Traître", Description = "L'amitié, c'est surfait.", Rarity = BadgeRarity.Rare, ConditionType = "SABOTAGE_SUCCESS", ConditionValue = 1, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Name = "Le Survivant", Description = "Ils ont essayé. Ils ont échoué.", Rarity = BadgeRarity.Rare, ConditionType = "WIN_DESPITE_SABOTAGE", ConditionValue = 1, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Name = "Le Miraculé", Description = "Un retournement de veste parfaitement exécuté.", Rarity = BadgeRarity.Epic, ConditionType = "WIN_WITH_CORRECTION", ConditionValue = 1, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Name = "Le Créateur Fou", Description = "Toute question devient une compétition.", Rarity = BadgeRarity.Legendary, ConditionType = "PREDICTIONS_CREATED", ConditionValue = 50, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), Name = "Le Roi du Chaos", Description = "Là où tu passes, les classements trépassent.", Rarity = BadgeRarity.Legendary, ConditionType = "OFFENSIVE_BOOSTS_USED", ConditionValue = 10, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Name = "Le Fidèle", Description = "Toujours présent quand il faut voter.", Rarity = BadgeRarity.Common, ConditionType = "DAILY_PARTICIPATION_STREAK", ConditionValue = 7, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), Name = "Le Dernier Moment", Description = "Pourquoi faire simple quand on peut stresser tout le monde ?", Rarity = BadgeRarity.Common, ConditionType = "LAST_MINUTE_VOTE", ConditionValue = 1, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000011"), Name = "L'Imposteur", Description = "Deux chances, une victoire.", Rarity = BadgeRarity.Rare, ConditionType = "WIN_WITH_DOUBLE_VOTE", ConditionValue = 1, IsActive = true },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0000-000000000012"), Name = "Le Patron", Description = "Cette semaine, c'était ton royaume.", Rarity = BadgeRarity.Epic, ConditionType = "WEEKLY_LEADERBOARD_FIRST", ConditionValue = 1, IsActive = true }
        );
    }
}
