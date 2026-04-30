using PronosticApp.Domain.Enums;

namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un type de boost disponible dans le jeu.
/// </summary>
public class Boost
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public BoostType BoostType { get; set; }
    public BadgeRarity Rarity { get; set; } = BadgeRarity.Common;
    public decimal EffectValue { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<UserBoost> UserBoosts { get; set; } = new List<UserBoost>();
    public ICollection<PredictionBoostUsage> Usages { get; set; } = new List<PredictionBoostUsage>();
}
