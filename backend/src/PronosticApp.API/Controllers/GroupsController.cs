using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Groups;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;
using PronosticApp.Infrastructure.Data;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public GroupsController(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string UserId => _userManager.GetUserId(User)!;

    private static MessageResponse ToMessageResponse(Message m) => new()
    {
        Id                  = m.Id,
        SenderId            = m.SenderId,
        SenderName          = m.Sender?.UserName ?? "?",
        SenderLevel         = m.Sender?.Level ?? 1,
        Content             = m.Content,
        Type                = m.Type.ToString(),
        PredictionShareCode = m.PredictionShareCode,
        CreatedAt           = m.CreatedAt,
    };

    private static GroupResponse ToGroupResponse(Group g, string? lastMsgSenderId = null) => new()
    {
        Id          = g.Id,
        Name        = g.Name,
        Description = g.Description,
        InviteCode  = g.InviteCode,
        OwnerId     = g.OwnerId,
        OwnerName   = g.Owner?.UserName ?? "?",
        MemberCount = g.Members.Count,
        CreatedAt   = g.CreatedAt,
        Members     = g.Members.Select(m => new GroupMemberResponse
        {
            UserId   = m.UserId,
            UserName = m.User?.UserName ?? "?",
            Role     = m.Role.ToString(),
            Level    = m.User?.Level ?? 1,
            JoinedAt = m.JoinedAt,
        }).ToList(),
        LastMessage = g.Messages
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MessageResponse
            {
                Id                  = m.Id,
                SenderId            = m.SenderId,
                SenderName          = m.Sender?.UserName ?? "?",
                SenderLevel         = m.Sender?.Level ?? 1,
                Content             = m.Content,
                Type                = m.Type.ToString(),
                PredictionShareCode = m.PredictionShareCode,
                CreatedAt           = m.CreatedAt,
            })
            .FirstOrDefault(),
    };

    // ── POST /api/groups — Créer un groupe ────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 50)
            return BadRequest(new { message = "Le nom doit faire entre 1 et 50 caractères." });

        var group = new Group
        {
            Name        = req.Name.Trim(),
            Description = req.Description?.Trim(),
            OwnerId     = UserId,
        };

        // Le créateur est automatiquement Admin du groupe
        group.Members.Add(new GroupMember
        {
            GroupId  = group.Id,
            UserId   = UserId,
            Role     = GroupRole.Admin,
            JoinedAt = DateTime.UtcNow,
        });

        _db.Groups.Add(group);
        await _db.SaveChangesAsync();

        // Recharger avec les navigations pour la réponse
        var created = await _db.Groups
            .Include(g => g.Owner)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Messages).ThenInclude(m => m.Sender)
            .FirstAsync(g => g.Id == group.Id);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToGroupResponse(created));
    }

    // ── POST /api/groups/join — Rejoindre par code ────────────────────────────

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinGroupRequest req)
    {
        var code = req.InviteCode?.Trim().ToUpper();
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { message = "Code d'invitation manquant." });

        var group = await _db.Groups
            .Include(g => g.Owner)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Messages).ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(g => g.InviteCode == code);

        if (group == null)
            return NotFound(new { message = "Aucun cercle trouvé avec ce code." });

        // Déjà membre ?
        if (group.Members.Any(m => m.UserId == UserId))
            return Ok(ToGroupResponse(group));

        group.Members.Add(new GroupMember
        {
            GroupId  = group.Id,
            UserId   = UserId,
            Role     = GroupRole.Member,
            JoinedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();

        // Recharger pour avoir les navigations à jour
        var updated = await _db.Groups
            .Include(g => g.Owner)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Messages).ThenInclude(m => m.Sender)
            .FirstAsync(g => g.Id == group.Id);

        return Ok(ToGroupResponse(updated));
    }

    // ── GET /api/groups — Mes groupes ────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var groups = await _db.Groups
            .Include(g => g.Owner)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Messages).ThenInclude(m => m.Sender)
            .Where(g => g.Members.Any(m => m.UserId == UserId))
            .OrderByDescending(g => g.Messages
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => (DateTime?)m.CreatedAt)
                .FirstOrDefault() ?? g.CreatedAt)
            .ToListAsync();

        return Ok(groups.Select(g => ToGroupResponse(g)));
    }

    // ── GET /api/groups/{id} — Détail d'un groupe ─────────────────────────────

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var group = await _db.Groups
            .Include(g => g.Owner)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .Include(g => g.Messages).ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group == null) return NotFound();

        // Vérifier que l'utilisateur est membre
        if (!group.Members.Any(m => m.UserId == UserId))
            return Forbid();

        return Ok(ToGroupResponse(group));
    }

    // ── GET /api/groups/{id}/messages — Historique paginé ─────────────────────
    // before = cursor ISO 8601 (date du plus vieux message affiché), limit max 50

    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] DateTime? before,
        [FromQuery] int limit = 50)
    {
        limit = Math.Clamp(limit, 1, 50);

        // Vérifier membre
        var isMember = await _db.GroupMembers.AnyAsync(m => m.GroupId == id && m.UserId == UserId);
        if (!isMember) return Forbid();

        var query = _db.Messages
            .Include(m => m.Sender)
            .Where(m => m.GroupId == id);

        if (before.HasValue)
            query = query.Where(m => m.CreatedAt < before.Value);

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync();

        // Retourner du plus ancien au plus récent
        messages.Reverse();

        return Ok(messages.Select(ToMessageResponse));
    }

    // ── DELETE /api/groups/{id}/leave — Quitter un groupe ────────────────────

    [HttpDelete("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var member = await _db.GroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == id && m.UserId == UserId);

        if (member == null) return NotFound();

        // Si le propriétaire quitte, transférer à un autre membre ou supprimer
        var group = await _db.Groups
            .Include(g => g.Members)
            .FirstAsync(g => g.Id == id);

        if (group.OwnerId == UserId)
        {
            var nextAdmin = group.Members
                .Where(m => m.UserId != UserId)
                .OrderBy(m => m.JoinedAt)
                .FirstOrDefault();

            if (nextAdmin != null)
            {
                group.OwnerId       = nextAdmin.UserId;
                nextAdmin.Role      = GroupRole.Admin;
            }
            else
            {
                // Dernier membre : supprimer le groupe
                _db.Groups.Remove(group);
                await _db.SaveChangesAsync();
                return NoContent();
            }
        }

        _db.GroupMembers.Remove(member);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
