using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Users;
using PronosticApp.Domain.Entities;
using PronosticApp.Infrastructure.Data;
using System.Security.Claims;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public UsersController(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db          = db;
        _userManager = userManager;
    }

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ─── Calcul du niveau ─────────────────────────────────────────────────
    private static int ExperienceForLevel(int level) => level * level * 100;

    // ─── GET /api/users/me/profile ─────────────────────────────────────────
    /// <summary>Profil complet de l'utilisateur connecté.</summary>
    [HttpGet("me/profile")]
    public async Task<ActionResult<ProfileResponse>> GetMyProfile()
    {
        var user = await _db.Users
            .Include(u => u.Badges)
                .ThenInclude(ub => ub.Badge)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId);

        if (user == null) return NotFound();

        // Statistiques calculées depuis les votes
        var votes = await _db.Votes
            .Where(v => v.UserId == CurrentUserId && v.IsCorrect.HasValue)
            .ToListAsync();

        var played = votes.Count;
        var won    = votes.Count(v => v.IsCorrect == true);
        var created = await _db.Predictions
            .CountAsync(p => p.CreatorId == CurrentUserId);

        var winRate = played > 0 ? Math.Round((double)won / played * 100, 1) : 0;

        return Ok(new ProfileResponse
        {
            Id            = user.Id,
            UserName      = user.UserName!,
            Email         = user.Email!,
            AvatarUrl     = user.AvatarUrl,
            Level         = user.Level,
            Experience    = user.Experience,
            ExperienceForNextLevel = ExperienceForLevel(user.Level + 1),
            TotalPoints   = user.TotalPoints,
            PredictionsPlayed   = played,
            PredictionsWon      = won,
            PredictionsCreated  = created,
            WinRate       = winRate,
            Badges        = user.Badges.Select(ub => new BadgeSummary
            {
                BadgeId    = ub.BadgeId,
                Name       = ub.Badge.Name,
                Description= ub.Badge.Description,
                Rarity     = ub.Badge.Rarity.ToString(),
                IconUrl    = ub.Badge.IconUrl,
                UnlockedAt = ub.UnlockedAt,
            }).OrderByDescending(b => b.UnlockedAt).ToList(),
            CreatedAt   = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
        });
    }

    // ─── GET /api/users/me/history ─────────────────────────────────────────
    /// <summary>Historique des pronostics de l'utilisateur (votés + créés).</summary>
    [HttpGet("me/history")]
    public async Task<ActionResult> GetMyHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page     = Math.Max(1, page);

        // Pronostics où l'utilisateur a voté
        var votedIds = await _db.Votes
            .Where(v => v.UserId == CurrentUserId)
            .Select(v => v.PredictionId)
            .ToListAsync();

        // Pronostics créés ou auxquels l'utilisateur a participé
        var query = _db.Predictions
            .Include(p => p.Options)
            .Include(p => p.Votes.Where(v => v.UserId == CurrentUserId))
            .Where(p => p.CreatorId == CurrentUserId || votedIds.Contains(p.Id))
            .OrderByDescending(p => p.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = items.Select(p =>
        {
            var myVote  = p.Votes.FirstOrDefault();
            var isCreator = p.CreatorId == CurrentUserId;

            return new
            {
                id           = p.Id,
                question     = p.Question,
                status       = p.Status.ToString(),
                shareCode    = p.ShareCode,
                createdAt    = p.CreatedAt,
                resolvedAt   = p.ResolvedAt,
                participantCount = p.Votes.Count,
                baseReward   = p.BaseReward,
                isCreator,
                myVote = myVote == null ? null : new
                {
                    optionId     = myVote.OptionId,
                    optionLabel  = p.Options.FirstOrDefault(o => o.Id == myVote.OptionId)?.Label,
                    isCorrect    = myVote.IsCorrect,
                    rewardPoints = myVote.RewardPoints,
                },
            };
        });

        return Ok(new { total, page, pageSize, items = result });
    }

    // ─── GET /api/leaderboard ──────────────────────────────────────────────
    /// <summary>Classement global par points.</summary>
    [HttpGet("/api/leaderboard")]
    [AllowAnonymous]
    public async Task<ActionResult<LeaderboardResponse>> GetLeaderboard([FromQuery] int top = 50)
    {
        top = Math.Clamp(top, 10, 100);

        var users = await _db.Users
            .Where(u => !u.IsGuest && u.TotalPoints > 0)
            .OrderByDescending(u => u.TotalPoints)
            .Take(top)
            .ToListAsync();

        // Calculer les stats de victoire pour chaque joueur
        var userIds    = users.Select(u => u.Id).ToList();
        var voteStats  = await _db.Votes
            .Where(v => userIds.Contains(v.UserId) && v.IsCorrect.HasValue)
            .GroupBy(v => v.UserId)
            .Select(g => new
            {
                UserId  = g.Key,
                Played  = g.Count(),
                Won     = g.Count(v => v.IsCorrect == true),
            })
            .ToDictionaryAsync(x => x.UserId);

        var entries = users.Select((u, i) =>
        {
            voteStats.TryGetValue(u.Id, out var stats);
            var played  = stats?.Played ?? 0;
            var won     = stats?.Won    ?? 0;
            var winRate = played > 0 ? Math.Round((double)won / played * 100, 1) : 0;

            return new LeaderboardEntry
            {
                Rank           = i + 1,
                UserId         = u.Id,
                UserName       = u.UserName!,
                AvatarUrl      = u.AvatarUrl,
                TotalPoints    = u.TotalPoints,
                Level          = u.Level,
                PredictionsWon = won,
                WinRate        = winRate,
                IsCurrentUser  = u.Id == CurrentUserId,
            };
        }).ToList();

        // Rang du joueur connecté s'il n'est pas dans le top
        int? myRank = null;
        if (!entries.Any(e => e.IsCurrentUser) && CurrentUserId != null)
        {
            var myPoints = (await _userManager.FindByIdAsync(CurrentUserId))?.TotalPoints ?? 0;
            myRank = await _db.Users
                .CountAsync(u => !u.IsGuest && u.TotalPoints > myPoints) + 1;
        }

        return Ok(new LeaderboardResponse { Entries = entries, MyRank = myRank });
    }
}
