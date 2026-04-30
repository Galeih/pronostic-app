using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Votes;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;
using PronosticApp.Infrastructure.Data;
using System.Security.Claims;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/predictions/{predictionId:guid}")]
public class VotesController : ControllerBase
{
    private readonly AppDbContext _db;

    public VotesController(AppDbContext db) => _db = db;

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ─── POST /api/predictions/{predictionId}/vote ─────────────────────────
    /// <summary>Enregistre le vote d'un participant.</summary>
    [HttpPost("vote")]
    [Authorize]
    public async Task<ActionResult<VoteResponse>> Vote(
        Guid predictionId, [FromBody] VoteRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // ── Charger le pronostic avec ses options et votes ─────────────────
        var prediction = await _db.Predictions
            .Include(p => p.Options)
            .Include(p => p.Votes)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null)
            return NotFound(new { message = "Pronostic introuvable." });

        // ── Règles métier ──────────────────────────────────────────────────

        // Fermeture automatique si deadline dépassée
        if (prediction.Status == PredictionStatus.Open &&
            prediction.VoteDeadline <= DateTime.UtcNow)
        {
            prediction.Status = PredictionStatus.AwaitingResolution;
            await _db.SaveChangesAsync();
            return BadRequest(new { message = "Les votes sont désormais fermés." });
        }

        if (prediction.Status != PredictionStatus.Open)
            return BadRequest(new { message = "Ce pronostic n'accepte plus de votes." });

        if (prediction.VoteDeadline <= DateTime.UtcNow)
            return BadRequest(new { message = "La date limite de vote est dépassée." });

        // Vérifier que l'option appartient bien à ce pronostic
        var option = prediction.Options.FirstOrDefault(o => o.Id == req.OptionId);
        if (option == null)
            return BadRequest(new { message = "Ce choix n'existe pas dans ce pronostic." });

        // Un seul vote par utilisateur
        var existingVote = prediction.Votes.FirstOrDefault(v => v.UserId == CurrentUserId);
        if (existingVote != null)
            return Conflict(new { message = "Tu as déjà voté sur ce pronostic." });

        // Nombre max de participants
        if (prediction.MaxParticipants.HasValue &&
            prediction.Votes.Count >= prediction.MaxParticipants.Value)
            return BadRequest(new { message = "Ce pronostic a atteint le nombre maximum de participants." });

        // ── Double vote (boost SecondVote) ─────────────────────────────────
        PredictionOption? secondOption = null;
        if (req.SecondOptionId.HasValue)
        {
            if (!prediction.AllowBoosts)
                return BadRequest(new { message = "Les boosts sont désactivés sur ce pronostic." });

            if (req.SecondOptionId == req.OptionId)
                return BadRequest(new { message = "Le second choix doit être différent du premier." });

            secondOption = prediction.Options.FirstOrDefault(o => o.Id == req.SecondOptionId);
            if (secondOption == null)
                return BadRequest(new { message = "Le second choix n'existe pas dans ce pronostic." });

            // Vérifier que l'utilisateur possède le boost Double Vote
            var hasDoubleVoteBoost = await _db.UserBoosts
                .Include(ub => ub.Boost)
                .AnyAsync(ub =>
                    ub.UserId == CurrentUserId &&
                    ub.Boost.BoostType == BoostType.SecondVote &&
                    ub.Quantity > 0 &&
                    (ub.ExpiresAt == null || ub.ExpiresAt > DateTime.UtcNow));

            if (!hasDoubleVoteBoost)
                return BadRequest(new { message = "Tu ne possèdes pas le boost Double Vote." });

            // Consommer le boost
            var userBoost = await _db.UserBoosts
                .Include(ub => ub.Boost)
                .FirstAsync(ub =>
                    ub.UserId == CurrentUserId &&
                    ub.Boost.BoostType == BoostType.SecondVote &&
                    ub.Quantity > 0);

            userBoost.Quantity--;
        }

        // ── Créer le vote ──────────────────────────────────────────────────
        var vote = new Vote
        {
            PredictionId   = predictionId,
            UserId         = CurrentUserId!,
            OptionId       = req.OptionId,
            SecondOptionId = req.SecondOptionId,
            IsSecondVote   = req.SecondOptionId.HasValue,
            CreatedAt      = DateTime.UtcNow,
        };

        _db.Votes.Add(vote);
        await _db.SaveChangesAsync();

        return Ok(new VoteResponse
        {
            VoteId            = vote.Id,
            PredictionId      = predictionId,
            OptionId          = vote.OptionId,
            OptionLabel       = option.Label,
            SecondOptionId    = vote.SecondOptionId,
            SecondOptionLabel = secondOption?.Label,
            CreatedAt         = vote.CreatedAt,
            Message           = req.SecondOptionId.HasValue
                ? $"Double vote enregistré : \"{option.Label}\" et \"{secondOption!.Label}\"."
                : $"Vote enregistré : \"{option.Label}\".",
        });
    }

    // ─── GET /api/predictions/{predictionId}/votes ─────────────────────────
    /// <summary>Retourne les votes publics (uniquement après résolution).</summary>
    [HttpGet("votes")]
    public async Task<ActionResult> GetVotes(Guid predictionId)
    {
        var prediction = await _db.Predictions
            .Include(p => p.Votes)
                .ThenInclude(v => v.User)
            .Include(p => p.Votes)
                .ThenInclude(v => v.Option)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null) return NotFound();

        // Les votes détaillés ne sont visibles qu'après résolution
        if (prediction.Status != PredictionStatus.Resolved &&
            prediction.Status != PredictionStatus.Archived)
        {
            return Ok(new { total = prediction.Votes.Count });
        }

        var result = prediction.Votes.Select(v => new
        {
            userId       = v.UserId,
            userName     = v.User.UserName,
            optionId     = v.OptionId,
            optionLabel  = v.Option.Label,
            isCorrect    = v.IsCorrect,
            rewardPoints = v.RewardPoints,
        });

        return Ok(result);
    }
}
