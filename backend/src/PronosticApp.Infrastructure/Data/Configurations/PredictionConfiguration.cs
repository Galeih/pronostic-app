using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PronosticApp.Domain.Entities;

namespace PronosticApp.Infrastructure.Data.Configurations;

public class PredictionConfiguration : IEntityTypeConfiguration<Prediction>
{
    public void Configure(EntityTypeBuilder<Prediction> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Question)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.Context)
            .HasMaxLength(1000);

        builder.Property(p => p.ShareCode)
            .IsRequired()
            .HasMaxLength(8);

        builder.HasIndex(p => p.ShareCode).IsUnique();

        builder.Property(p => p.Status)
            .HasConversion<string>();

        builder.Property(p => p.Visibility)
            .HasConversion<string>();

        builder.Property(p => p.ResolutionMode)
            .HasConversion<string>();

        // Relation avec le créateur
        builder.HasOne(p => p.Creator)
            .WithMany(u => u.CreatedPredictions)
            .HasForeignKey(p => p.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relation avec le groupe (facultatif)
        builder.HasOne(p => p.Group)
            .WithMany(g => g.Predictions)
            .HasForeignKey(p => p.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        // La bonne réponse est une FK optionnelle vers PredictionOption
        builder.HasOne(p => p.CorrectOption)
            .WithMany()
            .HasForeignKey(p => p.CorrectOptionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Ignorer la propriété calculée ShareUrl
        builder.Ignore(p => p.ShareUrl);
    }
}
