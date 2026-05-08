using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PronosticApp.Domain.Entities;

namespace PronosticApp.Infrastructure.Data.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Content).IsRequired().HasMaxLength(2000);
        builder.Property(m => m.Type).HasConversion<string>();
        builder.Property(m => m.PredictionShareCode).HasMaxLength(20);

        builder.HasOne(m => m.Group)
            .WithMany(g => g.Messages)
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index pour récupérer les messages d'un groupe triés par date (pagination)
        builder.HasIndex(m => new { m.GroupId, m.CreatedAt });
    }
}
