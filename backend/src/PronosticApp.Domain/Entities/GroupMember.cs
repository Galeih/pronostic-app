using PronosticApp.Domain.Enums;

namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente l'appartenance d'un utilisateur à un groupe.
/// </summary>
public class GroupMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public GroupRole Role { get; set; } = GroupRole.Member;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
