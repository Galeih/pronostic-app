namespace PronosticApp.Application.DTOs.Boosts;

/// <summary>Historique d'utilisation d'un boost sur un pronostic.</summary>
public class BoostUsageResponse
{
    public Guid    Id             { get; set; }
    public string  BoostName      { get; set; } = string.Empty;
    public string  BoostType      { get; set; } = string.Empty;
    public string  UserId         { get; set; } = string.Empty;
    public string  UserName       { get; set; } = string.Empty;
    public string? TargetUserId   { get; set; }
    public string? TargetUserName { get; set; }
    public DateTime UsedAt        { get; set; }
    public bool    WasBlocked     { get; set; }
    public bool    IsRevealed     { get; set; }
}
