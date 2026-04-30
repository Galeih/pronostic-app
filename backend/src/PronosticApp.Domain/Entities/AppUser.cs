using Microsoft.AspNetCore.Identity;

namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un utilisateur de l'application (joueur ou invité).
/// </summary>
public class AppUser : IdentityUser
{
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Progression
    public int Level { get; set; } = 1;
    public int Experience { get; set; } = 0;
    public int TotalPoints { get; set; } = 0;

    // Mode invité
    public bool IsGuest { get; set; } = false;
    public string? GuestToken { get; set; }

    // Navigation
    public ICollection<Prediction> CreatedPredictions { get; set; } = new List<Prediction>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
    public ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
    public ICollection<UserBoost> Boosts { get; set; } = new List<UserBoost>();
    public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
