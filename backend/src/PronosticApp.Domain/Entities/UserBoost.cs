namespace PronosticApp.Domain.Entities;

/// <summary>
/// Représente un boost possédé par un utilisateur (inventaire).
/// </summary>
public class UserBoost
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public Guid BoostId { get; set; }
    public Boost Boost { get; set; } = null!;

    public int Quantity { get; set; } = 1;

    public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}
