using System.ComponentModel.DataAnnotations;

namespace PronosticApp.Application.DTOs.Votes;

public class VoteRequest
{
    [Required(ErrorMessage = "L'identifiant du choix est obligatoire.")]
    public Guid OptionId { get; set; }

    /// <summary>
    /// Second choix (boost Double Vote uniquement).
    /// Doit être différent de OptionId.
    /// </summary>
    public Guid? SecondOptionId { get; set; }
}
