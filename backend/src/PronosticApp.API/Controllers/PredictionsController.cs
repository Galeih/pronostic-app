using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PronosticApp.Application.DTOs.Predictions;
using PronosticApp.Domain.Entities;
using PronosticApp.Domain.Enums;
using PronosticApp.Infrastructure.Data;
using System.Security.Claims;

namespace PronosticApp.API.Controllers;

[ApiController]
[Route("api/predictions")]
public class PredictionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public PredictionsController(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db          = db;
        _userManager = userManager;
    }

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ─── POST /api/predictions ────────────────────────────────────────────
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Create(
        [FromBody] CreatePredictionRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (req.Options.Count < 2)
            return BadRequest(new { message = "Un pronostic necessite au moins 2 choix de reponse." });

        if (req.Options.Count > 10)
            return BadRequest(new { message = "Un pronostic ne peut pas avoir plus de 10 choix." });

        if (req.VoteDeadline <= DateTime.UtcNow)
            return BadRequest(new { message = "La date limite de vote doit etre dans le futur." });

        if (req.RevealDate.HasValue && req.RevealDate <= req.VoteDeadline)
            return BadRequest(new { message = "La date de revelation doit etre apres la date limite de vote." });

        var prediction = new Prediction
        {
            CreatorId       = CurrentUserId!,
            Question        = req.Question.Trim(),
            Context         = req.Context?.Trim(),
            ImageUrl        = req.ImageUrl,
            Status          = PredictionStatus.Draft,
            Visibility      = req.Visibility,
            ResolutionMode  = req.ResolutionMode,
            VoteDeadline    = req.VoteDeadline.ToUniversalTime(),
            RevealDate      = req.RevealDate?.ToUniversalTime(),
            AllowBoosts     = req.AllowBoosts,
            AllowSabotage   = req.AllowSabotage,
            IsAnonymous     = req.IsAnonymous,
            BaseReward      = Math.Clamp(req.BaseReward, 50, 1000),
            MaxParticipants = req.MaxParticipants,
        };

        for (int i = 0; i < req.Options.Count; i++)
        {
            var opt = req.Options[i];
            prediction.Options.Add(new PredictionOption
            {
                Label       = opt.Label.Trim(),
                Description = opt.Description?.Trim(),
                ImageUrl    = opt.ImageUrl,
                SortOrder   = opt.SortOrder > 0 ? opt.SortOrder : i,
            });
        }

        _db.Predictions.Add(prediction);
        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(CurrentUserId!);
        return CreatedAtAction(nameof(GetById),
            new { id = prediction.Id },
            MapToResponse(prediction, creator!, null));
    }

    // ─── GET /api/predictions/{id} ────────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PredictionResponse>> GetById(Guid id)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        if (prediction.Status == PredictionStatus.Draft &&
            prediction.CreatorId != CurrentUserId)
            return NotFound();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        var myVote  = GetMyVote(prediction);

        return Ok(MapToResponse(prediction, creator!, myVote));
    }

    // ─── GET /api/predictions/share/{code} ───────────────────────────────
    [HttpGet("share/{code}")]
    public async Task<ActionResult<PredictionResponse>> GetByShareCode(string code)
    {
        var prediction = await LoadPrediction(p => p.ShareCode == code.ToUpper());
        if (prediction == null) return NotFound();

        if (prediction.Status == PredictionStatus.Draft &&
            prediction.CreatorId != CurrentUserId)
            return NotFound(new { message = "Ce pronostic n'est pas encore publie." });

        if (prediction.Status == PredictionStatus.Cancelled)
            return NotFound(new { message = "Ce pronostic a ete annule." });

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        var myVote  = GetMyVote(prediction);

        return Ok(MapToResponse(prediction, creator!, myVote));
    }

    // ─── GET /api/predictions/me ──────────────────────────────────────────
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<List<PredictionResponse>>> GetMine()
    {
        var predictions = await _db.Predictions
            .Include(p => p.Options)
                .ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.Boost)
            .Where(p => p.CreatorId == CurrentUserId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var creator = await _userManager.FindByIdAsync(CurrentUserId!);
        var result  = predictions
            .Select(p => MapToResponse(p, creator!, GetMyVote(p)))
            .ToList();

        return Ok(result);
    }

    // ─── POST /api/predictions/{id}/publish ───────────────────────────────
    [HttpPost("{id:guid}/publish")]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Publish(Guid id)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        if (prediction.CreatorId != CurrentUserId)
            return Forbid();

        if (prediction.Status != PredictionStatus.Draft)
            return BadRequest(new { message = "Seul un brouillon peut etre publie." });

        if (prediction.Options.Count < 2)
            return BadRequest(new { message = "Au moins 2 choix sont necessaires pour publier." });

        if (prediction.VoteDeadline <= DateTime.UtcNow)
            return BadRequest(new { message = "La date limite de vote est depassee. Modifie-la avant de publier." });

        prediction.Status      = PredictionStatus.Open;
        prediction.PublishedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        return Ok(MapToResponse(prediction, creator!, null));
    }

    // ─── POST /api/predictions/{id}/cancel ───────────────────────────────
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Cancel(Guid id)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        if (prediction.CreatorId != CurrentUserId)
            return Forbid();

        if (prediction.Votes.Any())
            return BadRequest(new { message = "Impossible d'annuler un pronostic qui a deja recu des votes." });

        if (prediction.Status == PredictionStatus.Resolved ||
            prediction.Status == PredictionStatus.Archived)
            return BadRequest(new { message = "Ce pronostic ne peut plus etre annule." });

        prediction.Status = PredictionStatus.Cancelled;
        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        return Ok(MapToResponse(prediction, creator!, null));
    }

    // ─── POST /api/predictions/{id}/resolve ──────────────────────────────
    [HttpPost("{id:guid}/resolve")]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Resolve(
        Guid id, [FromBody] ResolvePredictionRequest req)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        if (prediction.CreatorId != CurrentUserId)
            return Forbid();

        if (prediction.Status != PredictionStatus.VoteClosed &&
            prediction.Status != PredictionStatus.AwaitingResolution)
            return BadRequest(new { message = "Les votes doivent etre fermes avant de resoudre le pronostic." });

        var option = prediction.Options.FirstOrDefault(o => o.Id == req.CorrectOptionId);
        if (option == null)
            return BadRequest(new { message = "Le choix selectionne n'appartient pas a ce pronostic." });

        prediction.CorrectOptionId = req.CorrectOptionId;
        prediction.Status          = PredictionStatus.Resolved;
        prediction.ResolvedAt      = DateTime.UtcNow;

        // Reveler tous les boosts apres resolution
        foreach (var bu in prediction.BoostUsages)
            bu.IsRevealed = true;

        var boostUsages = prediction.BoostUsages.ToList();

        foreach (var vote in prediction.Votes)
        {
            vote.IsCorrect = vote.OptionId == req.CorrectOptionId ||
                             vote.SecondOptionId == req.CorrectOptionId;

            vote.RewardPoints = vote.IsCorrect == true
                ? CalculateReward(prediction, vote, boostUsages)
                : 0;

            var player = await _userManager.FindByIdAsync(vote.UserId);
            if (player != null && vote.RewardPoints > 0)
            {
                player.TotalPoints += vote.RewardPoints;
                player.Experience  += 50;
                await _userManager.UpdateAsync(player);
            }
            else if (player != null)
            {
                player.Experience += 10;
                await _userManager.UpdateAsync(player);
            }
        }

        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        if (prediction.Votes.Count >= 3)
        {
            creator!.Experience += 30;
            await _userManager.UpdateAsync(creator);
        }

        return Ok(MapToResponse(prediction, creator!, GetMyVote(prediction)));
    }

    // ─── Fermeture automatique ────────────────────────────────────────────
    private static void CheckAndCloseVotes(Prediction prediction)
    {
        if (prediction.Status == PredictionStatus.Open &&
            prediction.VoteDeadline <= DateTime.UtcNow)
        {
            prediction.Status = prediction.ResolutionMode == ResolutionMode.CreatorDecision
                ? PredictionStatus.AwaitingResolution
                : PredictionStatus.VoteClosed;
        }
    }

    // ─── Calcul de recompense (avec effets boosts) ────────────────────────
    private static int CalculateReward(
        Prediction prediction,
        Vote       vote,
        IReadOnlyList<PredictionBoostUsage> boostUsages)
    {
        var reward = prediction.BaseReward;

        // Double vote : 60 % de la mise de base
        if (vote.IsSecondVote)
            reward = (int)(reward * 0.6);

        // Sabotages actifs ciblant cet utilisateur
        var sabotages = boostUsages
            .Where(bu =>
                bu.TargetUserId    == vote.UserId &&
                bu.Boost.BoostType == BoostType.Sabotage &&
                !bu.WasBlocked)
            .ToList();

        if (sabotages.Count > 0)
        {
            // Verifier si un bouclier non consomme protege cet utilisateur
            var shield = boostUsages.FirstOrDefault(bu =>
                bu.UserId          == vote.UserId &&
                bu.Boost.BoostType == BoostType.Shield &&
                !bu.WasBlocked);

            if (shield != null)
            {
                // Bouclier absorbe le premier sabotage
                sabotages[0].WasBlocked = true;
                shield.WasBlocked       = true;
            }
            else
            {
                // Appliquer -20 % par sabotage
                foreach (var sab in sabotages)
                    reward = (int)(reward * (1.0 - (double)sab.Boost.EffectValue));
            }
        }

        return Math.Max(0, reward);
    }

    // ─── Chargement avec includes ─────────────────────────────────────────
    private async Task<Prediction?> LoadPrediction(
        System.Linq.Expressions.Expression<Func<Prediction, bool>> predicate)
    {
        var prediction = await _db.Predictions
            .Include(p => p.Options)
                .ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .Include(p => p.BoostUsages)
                .ThenInclude(bu => bu.Boost)
            .FirstOrDefaultAsync(predicate);

        if (prediction != null) CheckAndCloseVotes(prediction);

        return prediction;
    }

    // ─── Vote de l'utilisateur connecte ──────────────────────────────────
    private MyVoteResponse? GetMyVote(Prediction prediction)
    {
        if (CurrentUserId == null) return null;
        var vote = prediction.Votes.FirstOrDefault(v => v.UserId == CurrentUserId);
        if (vote == null) return null;

        return new MyVoteResponse
        {
            VoteId         = vote.Id,
            OptionId       = vote.OptionId,
            SecondOptionId = vote.SecondOptionId,
            IsCorrect      = vote.IsCorrect,
            RewardPoints   = vote.RewardPoints,
            CreatedAt      = vote.CreatedAt,
        };
    }

    // ─── Mapping entite -> DTO ────────────────────────────────────────────
    private PredictionResponse MapToResponse(
        Prediction prediction, AppUser creator, MyVoteResponse? myVote)
    {
        var isResolved = prediction.Status == PredictionStatus.Resolved;
        var isCreator  = prediction.CreatorId == CurrentUserId;
        var totalVotes = prediction.Votes.Count;

        // Stats visibles si resolu, ou si createur et pronostic non-anonyme
        var showStats = isResolved || (!prediction.IsAnonymous && isCreator);

        return new PredictionResponse
        {
            Id               = prediction.Id,
            CreatorId        = prediction.CreatorId,
            CreatorName      = creator.UserName ?? "Inconnu",
            Question         = prediction.Question,
            Context          = prediction.Context,
            ImageUrl         = prediction.ImageUrl,
            Status           = prediction.Status,
            Visibility       = prediction.Visibility,
            ResolutionMode   = prediction.ResolutionMode,
            VoteDeadline     = prediction.VoteDeadline,
            RevealDate       = prediction.RevealDate,
            CorrectOptionId  = prediction.CorrectOptionId,
            AllowBoosts      = prediction.AllowBoosts,
            AllowSabotage    = prediction.AllowSabotage,
            IsAnonymous      = prediction.IsAnonymous,
            BaseReward       = prediction.BaseReward,
            MaxParticipants  = prediction.MaxParticipants,
            ShareCode        = prediction.ShareCode,
            ShareUrl         = $"/p/{prediction.ShareCode}",
            CreatedAt        = prediction.CreatedAt,
            PublishedAt      = prediction.PublishedAt,
            ResolvedAt       = prediction.ResolvedAt,
            ParticipantCount = totalVotes,
            MyVote           = myVote,
            IsCreator        = isCreator,
            Options          = prediction.Options
                .OrderBy(o => o.SortOrder)
                .Select(o => new OptionResponse
                {
                    Id             = o.Id,
                    Label          = o.Label,
                    Description    = o.Description,
                    ImageUrl       = o.ImageUrl,
                    SortOrder      = o.SortOrder,
                    VoteCount      = showStats ? o.Votes.Count : null,
                    VotePercentage = showStats && totalVotes > 0
                        ? Math.Round((double)o.Votes.Count / totalVotes * 100, 1)
                        : null,
                })
                .ToList(),
        };
    }
}
