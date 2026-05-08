namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un groupe d'amis ou une communauté.
/// </summary>
public class Group
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string OwnerId { get; set; } = string.Empty;
    public AppUser Owner { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsPrivate { get; set; } = true;

    // Code d'invitation
    public string InviteCode { get; set; } = Guid.NewGuid().ToString("N")[..6].ToUpper();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<Prediction> Predictions { get; set; } = new List<Prediction>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
