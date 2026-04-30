namespace PronosticApp.Application.DTOs.Users;

public class ProfileResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // Progression
    public int Level { get; set; }
    public int Experience { get; set; }
    public int ExperienceForNextLevel { get; set; }
    public int TotalPoints { get; set; }

    // Statistiques
    public int PredictionsPlayed { get; set; }
    public int PredictionsWon { get; set; }
    public int PredictionsCreated { get; set; }
    public double WinRate { get; set; }

    // Collection
    public List<BadgeSummary> Badges { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class BadgeSummary
{
    public Guid BadgeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public DateTime UnlockedAt { get; set; }
}
