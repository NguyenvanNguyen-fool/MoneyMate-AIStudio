
namespace MoneyMate.Api.Models;

public class Transaction
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Category { get; set; } = "Khác";

    public DateTime TransactionDate { get; set; }
}
