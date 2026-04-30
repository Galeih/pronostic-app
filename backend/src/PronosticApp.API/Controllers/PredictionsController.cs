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

    // ─── Helpers ──────────────────────────────────────────────────────────

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ─── POST /api/predictions ────────────────────────────────────────────
    /// <summary>Crée un pronostic en statut Brouillon.</summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Create(
        [FromBody] CreatePredictionRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // ── Règles métier ──────────────────────────────────────────────────
        if (req.Options.Count < 2)
            return BadRequest(new { message = "Un pronostic nécessite au moins 2 choix de réponse." });

        if (req.Options.Count > 10)
            return BadRequest(new { message = "Un pronostic ne peut pas avoir plus de 10 choix." });

        if (req.VoteDeadline <= DateTime.UtcNow)
            return BadRequest(new { message = "La date limite de vote doit être dans le futur." });

        if (req.RevealDate.HasValue && req.RevealDate <= req.VoteDeadline)
            return BadRequest(new { message = "La date de révélation doit être après la date limite de vote." });

        // ── Création ───────────────────────────────────────────────────────
        var prediction = new Prediction
        {
            CreatorId      = CurrentUserId!,
            Question       = req.Question.Trim(),
            Context        = req.Context?.Trim(),
            ImageUrl       = req.ImageUrl,
            Status         = PredictionStatus.Draft,
            Visibility     = req.Visibility,
            ResolutionMode = req.ResolutionMode,
            VoteDeadline   = req.VoteDeadline.ToUniversalTime(),
            RevealDate     = req.RevealDate?.ToUniversalTime(),
            AllowBoosts    = req.AllowBoosts,
            AllowSabotage  = req.AllowSabotage,
            IsAnonymous    = req.IsAnonymous,
            BaseReward     = Math.Clamp(req.BaseReward, 50, 1000),
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
    /// <summary>Récupère un pronostic par son ID (créateur uniquement pour les brouillons).</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PredictionResponse>> GetById(Guid id)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        // Seul le créateur peut voir un brouillon
        if (prediction.Status == PredictionStatus.Draft &&
            prediction.CreatorId != CurrentUserId)
            return NotFound();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        var myVote  = GetMyVote(prediction);

        return Ok(MapToResponse(prediction, creator!, myVote));
    }

    // ─── GET /api/predictions/share/{code} ───────────────────────────────
    /// <summary>Accès public par code de partage (lien envoyé aux amis).</summary>
    [HttpGet("share/{code}")]
    public async Task<ActionResult<PredictionResponse>> GetByShareCode(string code)
    {
        var prediction = await LoadPrediction(p => p.ShareCode == code.ToUpper());
        if (prediction == null) return NotFound();

        if (prediction.Status == PredictionStatus.Draft &&
            prediction.CreatorId != CurrentUserId)
            return NotFound(new { message = "Ce pronostic n'est pas encore publié." });

        if (prediction.Status == PredictionStatus.Cancelled)
            return NotFound(new { message = "Ce pronostic a été annulé." });

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        var myVote  = GetMyVote(prediction);

        return Ok(MapToResponse(prediction, creator!, myVote));
    }

    // ─── GET /api/predictions/me ──────────────────────────────────────────
    /// <summary>Liste les pronostics créés par l'utilisateur connecté.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<List<PredictionResponse>>> GetMine()
    {
        var predictions = await _db.Predictions
            .Include(p => p.Options)
            .Include(p => p.Votes)
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
    /// <summary>Publie un pronostic (brouillon → ouvert aux votes).</summary>
    [HttpPost("{id:guid}/publish")]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Publish(Guid id)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        if (prediction.CreatorId != CurrentUserId)
            return Forbid();

        if (prediction.Status != PredictionStatus.Draft)
            return BadRequest(new { message = "Seul un brouillon peut être publié." });

        if (prediction.Options.Count < 2)
            return BadRequest(new { message = "Au moins 2 choix sont nécessaires pour publier." });

        if (prediction.VoteDeadline <= DateTime.UtcNow)
            return BadRequest(new { message = "La date limite de vote est dépassée. Modifie-la avant de publier." });

        prediction.Status      = PredictionStatus.Open;
        prediction.PublishedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        return Ok(MapToResponse(prediction, creator!, null));
    }

    // ─── POST /api/predictions/{id}/cancel ───────────────────────────────
    /// <summary>Annule un pronostic (uniquement avant le premier vote).</summary>
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<ActionResult<PredictionResponse>> Cancel(Guid id)
    {
        var prediction = await LoadPrediction(p => p.Id == id);
        if (prediction == null) return NotFound();

        if (prediction.CreatorId != CurrentUserId)
            return Forbid();

        if (prediction.Votes.Any())
            return BadRequest(new { message = "Impossible d'annuler un pronostic qui a déjà reçu des votes." });

        if (prediction.Status == PredictionStatus.Resolved ||
            prediction.Status == PredictionStatus.Archived)
            return BadRequest(new { message = "Ce pronostic ne peut plus être annulé." });

        prediction.Status = PredictionStatus.Cancelled;
        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        return Ok(MapToResponse(prediction, creator!, null));
    }

    // ─── POST /api/predictions/{id}/resolve ──────────────────────────────
    /// <summary>Résout le pronostic en choisissant la bonne réponse.</summary>
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
            return BadRequest(new { message = "Les votes doivent être fermés avant de résoudre le pronostic." });

        var option = prediction.Options.FirstOrDefault(o => o.Id == req.CorrectOptionId);
        if (option == null)
            return BadRequest(new { message = "Le choix sélectionné n'appartient pas à ce pronostic." });

        // ── Appliquer les résultats ──────────────────────────────────────
        prediction.CorrectOptionId = req.CorrectOptionId;
        prediction.Status          = PredictionStatus.Resolved;
        prediction.ResolvedAt      = DateTime.UtcNow;

        // Marquer les votes et calculer les récompenses
        foreach (var vote in prediction.Votes)
        {
            vote.IsCorrect = vote.OptionId == req.CorrectOptionId ||
                             vote.SecondOptionId == req.CorrectOptionId;

            vote.RewardPoints = vote.IsCorrect == true
                ? CalculateReward(prediction, vote)
                : 0;

            // Mettre à jour les points du joueur
            var player = await _userManager.FindByIdAsync(vote.UserId);
            if (player != null && vote.RewardPoints > 0)
            {
                player.TotalPoints += vote.RewardPoints;
                player.Experience  += 50; // +50 XP pour une victoire
                await _userManager.UpdateAsync(player);
            }
            else if (player != null)
            {
                player.Experience += 10; // +10 XP pour participation
                await _userManager.UpdateAsync(player);
            }
        }

        await _db.SaveChangesAsync();

        var creator = await _userManager.FindByIdAsync(prediction.CreatorId);
        // +30 XP au créateur si au moins 3 participants
        if (prediction.Votes.Count >= 3)
        {
            creator!.Experience += 30;
            await _userManager.UpdateAsync(creator);
        }

        return Ok(MapToResponse(prediction, creator!, GetMyVote(prediction)));
    }

    // ─── Fermeture automatique (appelée par un job ou au GET si dépassée) ──
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

    // ─── Calcul de récompense ──────────────────────────────────────────────
    private static int CalculateReward(Prediction prediction, Vote vote)
    {
        var baseReward = prediction.BaseReward;

        // Réduction si double vote
        if (vote.IsSecondVote) return (int)(baseReward * 0.6);

        // TODO Phase 3 : appliquer multiplicateurs et sabotages

        return baseReward;
    }

    // ─── Chargement avec includes ─────────────────────────────────────────
    private async Task<Prediction?> LoadPrediction(
        System.Linq.Expressions.Expression<Func<Prediction, bool>> predicate)
    {
        var prediction = await _db.Predictions
            .Include(p => p.Options)
            .Include(p => p.Votes)
            .FirstOrDefaultAsync(predicate);

        if (prediction != null) CheckAndCloseVotes(prediction);

        return prediction;
    }

    // ─── Vote de l'utilisateur connecté ──────────────────────────────────
    private MyVoteResponse? GetMyVote(Prediction prediction)
    {
        if (CurrentUserId == null) return null;
        var vote = prediction.Votes.FirstOrDefault(v => v.UserId == CurrentUserId);
        if (vote == null) return null;

        return new MyVoteResponse
        {
            VoteId        = vote.Id,
            OptionId      = vote.OptionId,
            SecondOptionId = vote.SecondOptionId,
            IsCorrect     = vote.IsCorrect,
            RewardPoints  = vote.RewardPoints,
            CreatedAt     = vote.CreatedAt,
        };
    }

    // ─── Mapping entité → DTO ─────────────────────────────────────────────
    private PredictionResponse MapToResponse(
        Prediction prediction, AppUser creator, MyVoteResponse? myVote)
    {
        var isResolved  = prediction.Status == PredictionStatus.Resolved;
        var isCreator   = prediction.CreatorId == CurrentUserId;
        var totalVotes  = prediction.Votes.Count;

        // Stats visibles si :
        //   - pronostic résolu (tout le monde voit), ou
        //   - pronostic non-anonyme ET l'utilisateur est le créateur (live preview)
        var showStats = isResolved || (!prediction.IsAnonymous && isCreator);

        return new PredictionResponse
        {
            Id              = prediction.Id,
            CreatorId       = prediction.CreatorId,
            CreatorName     = creator.UserName ?? "Inconnu",
            Question        = prediction.Question,
            Context         = prediction.Context,
            ImageUrl        = prediction.ImageUrl,
            Status          = prediction.Status,
            Visibility      = prediction.Visibility,
            ResolutionMode  = prediction.ResolutionMode,
            VoteDeadline    = prediction.VoteDeadline,
            RevealDate      = prediction.RevealDate,
            CorrectOptionId = prediction.CorrectOptionId,
            AllowBoosts     = prediction.AllowBoosts,
            AllowSabotage   = prediction.AllowSabotage,
            IsAnonymous     = prediction.IsAnonymous,
            BaseReward      = prediction.BaseReward,
            MaxParticipants = prediction.MaxParticipants,
            ShareCode       = prediction.ShareCode,
            ShareUrl        = $"/p/{prediction.ShareCode}",
            CreatedAt       = prediction.CreatedAt,
            PublishedAt     = prediction.PublishedAt,
            ResolvedAt      = prediction.ResolvedAt,
            ParticipantCount = totalVotes,
            MyVote          = myVote,
            IsCreator       = isCreator,
            Options         = prediction.Options
                .OrderBy(o => o.SortOrder)
                .Select(o => new OptionResponse
                {
                    Id          = o.Id,
                    Label       = o.Label,
                    Description = o.Description,
                    ImageUrl    = o.ImageUrl,
                    SortOrder   = o.SortOrder,
                    // Stats visibles selon showStats
                    VoteCount      = showStats ? o.Votes.Count : null,
                    VotePercentage = showStats && totalVotes > 0
                        ? Math.Round((double)o.Votes.Count / totalVotes * 100, 1)
                        : null,
                })
                .ToList(),
        };
    }
}
