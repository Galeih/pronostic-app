using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;

namespace PronosticApp.Infrastructure.Data.Configurations;

public class BoostConfiguration : IEntityTypeConfiguration<Boost>
{
    public void Configure(EntityTypeBuilder<Boost> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name).IsRequired().HasMaxLength(100);
        builder.Property(b => b.Description).IsRequired().HasMaxLength(500);
        builder.Property(b => b.BoostType).HasConversion<string>();
        builder.Property(b => b.Rarity).HasConversion<string>();

        // Seed : les 4 boosts du MVP
        builder.HasData(
            new Boost
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "Correction",
                Description = "Permet de modifier son vote une fois avant la date limite.",
                BoostType = BoostType.VoteCorrection,
                Rarity = BadgeRarity.Common,
                EffectValue = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Boost
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Double Vote",
                Description = "Permet de voter sur deux réponses différentes. Les récompenses sont réduites.",
                BoostType = BoostType.SecondVote,
                Rarity = BadgeRarity.Common,
                EffectValue = 0.6m,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Boost
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Name = "Sabotage",
                Description = "Réduit les gains potentiels d'un autre joueur de 20%.",
                BoostType = BoostType.Sabotage,
                Rarity = BadgeRarity.Rare,
                EffectValue = 0.2m,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Boost
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Name = "Bouclier",
                Description = "Protège contre un sabotage entrant.",
                BoostType = BoostType.Shield,
                Rarity = BadgeRarity.Rare,
                EffectValue = 1,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
