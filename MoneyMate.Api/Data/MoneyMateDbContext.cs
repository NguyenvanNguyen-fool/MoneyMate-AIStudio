
using Microsoft.EntityFrameworkCore;
using MoneyMate.Api.Models;

namespace MoneyMate.Api.Data;

public class MoneyMateDbContext : DbContext
{
    public MoneyMateDbContext(DbContextOptions<MoneyMateDbContext> options)
        : base(options)
    {
    }

    public DbSet<Transaction> Transactions => Set<Transaction>();

    public DbSet<MonthlyBudget> MonthlyBudgets => Set<MonthlyBudget>();

    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.Property(t => t.Title)
                .HasMaxLength(200);

            entity.Property(t => t.Type)
                .HasMaxLength(20);

            entity.Property(t => t.Amount)
                .HasPrecision(18, 2);

            entity.Property(t => t.Category)
                .HasMaxLength(50)
                .HasDefaultValue("Khác");
        });

        modelBuilder.Entity<MonthlyBudget>(entity =>
        {
            entity.ToTable("MonthlyBudgets");
            entity.HasIndex(b => b.BudgetMonth).IsUnique();
            entity.Property(b => b.BudgetMonth).HasColumnType("date");
            entity.Property(b => b.LimitAmount).HasPrecision(18, 2);
            entity.Property(b => b.CreatedAt)
                .HasDefaultValueSql("SYSDATETIME()")
                .ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.ToTable("SavingsGoals");
            entity.Property(g => g.Name).HasMaxLength(200);
            entity.Property(g => g.TargetAmount).HasPrecision(18, 2);
            entity.Property(g => g.SavedAmount).HasPrecision(18, 2);
            entity.Property(g => g.TargetDate).HasColumnType("date");
            entity.Property(g => g.CreatedAt)
                .HasDefaultValueSql("SYSDATETIME()")
                .ValueGeneratedOnAdd();
        });
    }
}
