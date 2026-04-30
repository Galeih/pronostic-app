namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente le vote d'un participant sur un pronostic.
/// </summary>
public class Vote
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PredictionId { get; set; }
    public Prediction Prediction { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public Guid OptionId { get; set; }
    public PredictionOption Option { get; set; } = null!;

    // Vote secondaire (boost Double vote)
    public Guid? SecondOptionId { get; set; }
    public bool IsSecondVote { get; set; } = false;

    // Résultat
    public bool? IsCorrect { get; set; }
    public int RewardPoints { get; set; } = 0;

    // Boosts utilisés sur ce vote
    public bool UsedCorrectionBoost { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
