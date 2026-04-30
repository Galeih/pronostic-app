namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un badge débloqué par un utilisateur.
/// </summary>
public class UserBadge
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public Guid BadgeId { get; set; }
    public Badge Badge { get; set; } = null!;

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

    // Référence au pronostic qui a déclenché le badge
    public Guid? RelatedPredictionId { get; set; }
    public Prediction? RelatedPrediction { get; set; }
}
