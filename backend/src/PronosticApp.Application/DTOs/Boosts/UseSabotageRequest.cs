using System.ComponentModel.DataAnnotations;

namespace PronosticApp.Application.DTOs.Boosts;

/// <summary>Requete pour utiliser le boost Sabotage contre un adversaire.</summary>
public class UseSabotageRequest
{
    [Required(ErrorMessage = "L'identifiant de la cible est obligatoire.")]
    public string TargetUserId { get; set; } = string.Empty;
}
