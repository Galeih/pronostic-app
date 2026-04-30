namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente une notification interne pour un utilisateur.
/// </summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    // Type de notification (ex: "VOTE_CLOSED", "RESULT_REVEALED", "BADGE_UNLOCKED", "SABOTAGE_RECEIVED")
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public Guid? RelatedPredictionId { get; set; }
    public Prediction? RelatedPrediction { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
