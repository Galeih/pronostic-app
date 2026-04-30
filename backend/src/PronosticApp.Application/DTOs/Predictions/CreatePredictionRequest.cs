using PronosticApp.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace PronosticApp.Application.DTOs.Predictions;

public class CreatePredictionRequest
{
    [Required(ErrorMessage = "La question est obligatoire.")]
    [MaxLength(500, ErrorMessage = "La question ne peut pas dépasser 500 caractères.")]
    public string Question { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Le contexte ne peut pas dépasser 1000 caractères.")]
    public string? Context { get; set; }

    public string? ImageUrl { get; set; }

    [Required(ErrorMessage = "Au moins deux choix de réponse sont obligatoires.")]
    [MinLength(2, ErrorMessage = "Au moins deux choix de réponse sont obligatoires.")]
    public List<CreateOptionRequest> Options { get; set; } = new();

    [Required(ErrorMessage = "La date limite de vote est obligatoire.")]
    public DateTime VoteDeadline { get; set; }

    public DateTime? RevealDate { get; set; }

    public ResolutionMode ResolutionMode { get; set; } = ResolutionMode.CreatorDecision;

    public PredictionVisibility Visibility { get; set; } = PredictionVisibility.PrivateLink;

    public bool AllowBoosts { get; set; } = true;

    public bool AllowSabotage { get; set; } = true;

    /// <summary>Récompense de base en points fictifs (100 par défaut).</summary>
    public int BaseReward { get; set; } = 100;

    public int? MaxParticipants { get; set; }
}

public class CreateOptionRequest
{
    [Required(ErrorMessage = "Le libellé du choix est obligatoire.")]
    [MaxLength(200, ErrorMessage = "Le libellé ne peut pas dépasser 200 caractères.")]
    public string Label { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public int SortOrder { get; set; } = 0;
}
