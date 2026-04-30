using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PronosticApp.Domain.Entities;

namespace PronosticApp.Infrastructure.Data.Configurations;

public class PredictionBoostUsageConfiguration : IEntityTypeConfiguration<PredictionBoostUsage>
{
    public void Configure(EntityTypeBuilder<PredictionBoostUsage> builder)
    {
        builder.HasKey(bu => bu.Id);

        builder.HasOne(bu => bu.Prediction)
            .WithMany(p => p.BoostUsages)
            .HasForeignKey(bu => bu.PredictionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(bu => bu.User)
            .WithMany()
            .HasForeignKey(bu => bu.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(bu => bu.TargetUser)
            .WithMany()
            .HasForeignKey(bu => bu.TargetUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(bu => bu.Boost)
            .WithMany(b => b.Usages)
            .HasForeignKey(bu => bu.BoostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(bu => bu.EffectPayload).HasMaxLength(1000);
    }
}
