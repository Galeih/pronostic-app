namespace PronosticApp.Application.DTOs.Groups;

public class GroupMemberResponse
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int Level { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class GroupResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<GroupMemberResponse> Members { get; set; } = new();
    public MessageResponse? LastMessage { get; set; }
}

public class MessageResponse
{
    public Guid Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public int SenderLevel { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "Text";
    public string? PredictionShareCode { get; set; }
    public DateTime CreatedAt { get; set; }
}
