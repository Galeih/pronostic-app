using System.ComponentModel.DataAnnotations;

namespace PronosticApp.Application.DTOs.Predictions;

public class ResolvePredictionRequest
{
    [Required(ErrorMessage = "L'identifiant de la bonne réponse est obligatoire.")]
    public Guid CorrectOptionId { get; set; }
}
