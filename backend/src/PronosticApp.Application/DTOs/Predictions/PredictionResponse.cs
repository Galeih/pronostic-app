using PronosticApp.Domain.Enums;

namespace PronosticApp.Application.DTOs.Predictions;

public class PredictionResponse
{
    public Guid Id { get; set; }
    public string CreatorId { get; set; } = string.Empty;
    public string CreatorName { get; set; } = string.Empty;

    public string Question { get; set; } = string.Empty;
    public string? Context { get; set; }
    public string? ImageUrl { get; set; }

    public PredictionStatus Status { get; set; }
    public PredictionVisibility Visibility { get; set; }
    public ResolutionMode ResolutionMode { get; set; }

    public DateTime VoteDeadline { get; set; }
    public DateTime? RevealDate { get; set; }

    public Guid? CorrectOptionId { get; set; }

    public bool AllowBoosts { get; set; }
    public bool AllowSabotage { get; set; }

    /// <summary>Prophétie Aveugle : stats masquées pour tout le monde jusqu'à la résolution.</summary>
    public bool IsAnonymous { get; set; }

    public int BaseReward { get; set; }
    public int? MaxParticipants { get; set; }

    public string ShareCode { get; set; } = string.Empty;
    public string ShareUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public List<OptionResponse> Options { get; set; } = new();
    public int ParticipantCount { get; set; }

    /// <summary>Vote de l'utilisateur connecté (null si pas encore voté).</summary>
    public MyVoteResponse? MyVote { get; set; }

    /// <summary>Indique si l'utilisateur connecté est le créateur.</summary>
    public bool IsCreator { get; set; }

    /// <summary>
    /// Nombre de participants avec IsCorrect = true (vote principal OU second vote).
    /// Disponible uniquement après résolution.
    /// </summary>
    public int? WinnerCount { get; set; }

    /// <summary>
    /// Somme des RewardPoints de tous les votes après résolution.
    /// Tient compte des réductions (double vote -40 %, sabotages, etc.).
    /// </summary>
    public int? TotalPointsDistributed { get; set; }
}

public class OptionResponse
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }

    /// <summary>Nombre de votes — masqué tant que le pronostic n'est pas résolu (selon la config).</summary>
    public int? VoteCount { get; set; }

    /// <summary>Pourcentage des votes — affiché seulement après résolution.</summary>
    public double? VotePercentage { get; set; }
}

public class MyVoteResponse
{
    public Guid VoteId { get; set; }
    public Guid OptionId { get; set; }
    public Guid? SecondOptionId { get; set; }
    public bool? IsCorrect { get; set; }
    public int RewardPoints { get; set; }
    public DateTime CreatedAt { get; set; }
}
