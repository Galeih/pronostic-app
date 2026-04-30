using PronosticApp.Domain.Enums;

namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un badge à collectionner dans le jeu.
/// </summary>
public class Badge
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }

    public BadgeRarity Rarity { get; set; } = BadgeRarity.Common;

    // Condition de débloquage (ex: "WIN_STREAK_5", "SNIPE_WIN")
    public string ConditionType { get; set; } = string.Empty;
    public int ConditionValue { get; set; } = 1;

    public bool IsSecret { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}
