namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente l'utilisation d'un boost sur un pronostic donné.
/// </summary>
public class PredictionBoostUsage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PredictionId { get; set; }
    public Prediction Prediction { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    // Joueur ciblé (pour les boosts offensifs)
    public string? TargetUserId { get; set; }
    public AppUser? TargetUser { get; set; }

    public Guid BoostId { get; set; }
    public Boost Boost { get; set; } = null!;

    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    // Payload JSON pour stocker les paramètres spécifiques de l'effet
    public string? EffectPayload { get; set; }

    public bool IsRevealed { get; set; } = false;
    public bool WasBlocked { get; set; } = false;
}
