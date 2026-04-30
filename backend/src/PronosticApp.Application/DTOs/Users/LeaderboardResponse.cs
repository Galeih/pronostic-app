namespace PronosticApp.Application.DTOs.Users;

public class LeaderboardResponse
{
    public List<LeaderboardEntry> Entries { get; set; } = new();
    public int? MyRank { get; set; }
}

public class LeaderboardEntry
{
    public int Rank { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int TotalPoints { get; set; }
    public int Level { get; set; }
    public int PredictionsWon { get; set; }
    public double WinRate { get; set; }
    public bool IsCurrentUser { get; set; }
}
