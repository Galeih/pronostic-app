using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Domain.Entities;
using PronosticApp.Infrastructure.Data;

namespace PronosticApp.API.Hubs;

/// <summary>
/// Hub SignalR pour le chat en temps réel des channels (Cercles).
/// Méthodes client-serveur : JoinChannel, LeaveChannel, SendMessage, SharePrediction.
/// Événements server-client : MessageReceived, MemberJoined, MemberLeft.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public ChatHub(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    private string UserId => _userManager.GetUserId(Context.User!)!;

    // ── JoinChannel ───────────────────────────────────────────────────────────
    // Le client appelle cette méthode pour s'abonner aux messages d'un channel.

    public async Task JoinChannel(Guid groupId)
    {
        var isMember = await _db.GroupMembers
            .AnyAsync(m => m.GroupId == groupId && m.UserId == UserId);

        if (!isMember) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, groupId.ToString());

        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return;

        // Notifier les autres membres
        await Clients.OthersInGroup(groupId.ToString()).SendAsync("MemberJoined", new
        {
            userId   = UserId,
            userName = user.UserName,
            level    = user.Level,
        });
    }

    // ── LeaveChannel ──────────────────────────────────────────────────────────

    public async Task LeaveChannel(Guid groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId.ToString());

        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return;

        await Clients.OthersInGroup(groupId.ToString()).SendAsync("MemberLeft", new
        {
            userId   = UserId,
            userName = user.UserName,
        });
    }

    // ── SendMessage ───────────────────────────────────────────────────────────
    // Envoi d'un message texte ordinaire.

    public async Task SendMessage(Guid groupId, string content)
    {
        content = content?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(content) || content.Length > 2000) return;

        var isMember = await _db.GroupMembers
            .AnyAsync(m => m.GroupId == groupId && m.UserId == UserId);
        if (!isMember) return;

        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return;

        var message = new Message
        {
            GroupId   = groupId,
            SenderId  = UserId,
            Content   = content,
            Type      = MessageType.Text,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var payload = new
        {
            id                  = message.Id,
            senderId            = UserId,
            senderName          = user.UserName,
            senderLevel         = user.Level,
            content             = message.Content,
            type                = "Text",
            predictionShareCode = (string?)null,
            createdAt           = message.CreatedAt,
        };

        await Clients.Group(groupId.ToString()).SendAsync("MessageReceived", payload);
    }

    // ── SharePrediction ───────────────────────────────────────────────────────
    // Partage d'un pronostic dans un channel (carte cliquable).

    public async Task SharePrediction(Guid groupId, string shareCode)
    {
        if (string.IsNullOrWhiteSpace(shareCode)) return;

        var isMember = await _db.GroupMembers
            .AnyAsync(m => m.GroupId == groupId && m.UserId == UserId);
        if (!isMember) return;

        // Vérifier que le pronostic existe
        var prediction = await _db.Predictions
            .FirstOrDefaultAsync(p => p.ShareCode == shareCode);
        if (prediction == null) return;

        var user = await _db.Users.FindAsync(UserId);
        if (user == null) return;

        var message = new Message
        {
            GroupId             = groupId,
            SenderId            = UserId,
            Content             = prediction.Question,
            Type                = MessageType.PredictionShare,
            PredictionShareCode = shareCode,
            CreatedAt           = DateTime.UtcNow,
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var payload = new
        {
            id                  = message.Id,
            senderId            = UserId,
            senderName          = user.UserName,
            senderLevel         = user.Level,
            content             = message.Content,
            type                = "PredictionShare",
            predictionShareCode = shareCode,
            createdAt           = message.CreatedAt,
        };

        await Clients.Group(groupId.ToString()).SendAsync("MessageReceived", payload);
    }

    // ── Déconnexion ───────────────────────────────────────────────────────────

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // SignalR retire automatiquement la connexion de tous les groupes
        await base.OnDisconnectedAsync(exception);
    }
}
