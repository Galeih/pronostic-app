using System.ComponentModel.DataAnnotations;

namespace PronosticApp.Application.DTOs.Boosts;

/// <summary>Requete pour utiliser le boost Correction (modifier son vote).</summary>
public class UseCorrectionRequest
{
    [Required(ErrorMessage = "Le nouvel identifiant de choix est obligatoire.")]
    public Guid NewOptionId { get; set; }
}
