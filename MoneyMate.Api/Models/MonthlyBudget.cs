namespace MoneyMate.Api.Models;

public class MonthlyBudget
{
    public int Id { get; set; }

    public DateTime BudgetMonth { get; set; }

    public decimal LimitAmount { get; set; }

    public DateTime CreatedAt { get; set; }
}
