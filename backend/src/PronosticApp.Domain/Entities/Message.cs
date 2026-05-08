namespace PronosticApp.Domain.Entities;

/// <summary>
/// Type de message dans un channel.
/// </summary>
public enum MessageType
{
    Text,
    PredictionShare,
}

/// <summary>
/// Message envoyé dans un channel (Group).
/// </summary>
public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public string SenderId { get; set; } = string.Empty;
    public AppUser Sender { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public MessageType Type { get; set; } = MessageType.Text;

    /// <summary>
    /// Renseigné uniquement quand Type == PredictionShare.
    /// Contient le shareCode du pronostic partagé.
    /// </summary>
    public string? PredictionShareCode { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
