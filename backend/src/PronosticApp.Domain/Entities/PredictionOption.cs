namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un choix de réponse pour un pronostic.
/// </summary>
public class PredictionOption
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PredictionId { get; set; }
    public Prediction Prediction { get; set; } = null!;

    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}
