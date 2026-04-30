using PronosticApp.Domain.Enums;

namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un pronostic créé par un utilisateur.
/// </summary>
public class Prediction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string CreatorId { get; set; } = string.Empty;
    public AppUser Creator { get; set; } = null!;

    public Guid? GroupId { get; set; }
    public Group? Group { get; set; }

    public string Question { get; set; } = string.Empty;
    public string? Context { get; set; }
    public string? ImageUrl { get; set; }

    public PredictionStatus Status { get; set; } = PredictionStatus.Draft;
    public PredictionVisibility Visibility { get; set; } = PredictionVisibility.PrivateLink;
    public ResolutionMode ResolutionMode { get; set; } = ResolutionMode.CreatorDecision;

    public DateTime VoteDeadline { get; set; }
    public DateTime? RevealDate { get; set; }

    public Guid? CorrectOptionId { get; set; }
    public PredictionOption? CorrectOption { get; set; }

    public bool AllowBoosts { get; set; } = true;
    public bool AllowSabotage { get; set; } = true;
    public int BaseReward { get; set; } = 100;
    public int? MaxParticipants { get; set; }

    // Lien de partage
    public string ShareCode { get; set; } = GenerateShareCode();
    public string ShareUrl => $"/p/{ShareCode}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    // Navigation
    public ICollection<PredictionOption> Options { get; set; } = new List<PredictionOption>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
    public ICollection<PredictionBoostUsage> BoostUsages { get; set; } = new List<PredictionBoostUsage>();

    private static string GenerateShareCode()
    {
        return Guid.NewGuid().ToString("N")[..8].ToUpper();
    }
}
