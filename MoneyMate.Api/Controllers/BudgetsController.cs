using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMate.Api.Data;
using MoneyMate.Api.Models;

namespace MoneyMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetsController : ControllerBase
{
    private readonly MoneyMateDbContext _context;

    public BudgetsController(MoneyMateDbContext context)
    {
        _context = context;
    }

    [HttpGet("{year:int}/{month:int}")]
    public async Task<IActionResult> GetByMonth(int year, int month)
    {
        if (!TryGetBudgetMonth(year, month, out var budgetMonth))
        {
            return BadRequest(new { message = "Tháng hoặc năm không hợp lệ." });
        }

        var summary = await GetSummaryAsync(budgetMonth);
        return Ok(summary);
    }

    [HttpPut("{year:int}/{month:int}")]
    public async Task<IActionResult> Save(int year, int month, BudgetRequest request)
    {
        if (!TryGetBudgetMonth(year, month, out var budgetMonth))
        {
            return BadRequest(new { message = "Tháng hoặc năm không hợp lệ." });
        }

        if (request.LimitAmount <= 0)
        {
            return BadRequest(new { message = "Ngân sách phải lớn hơn 0." });
        }

        var budget = await _context.MonthlyBudgets
            .FirstOrDefaultAsync(b => b.BudgetMonth == budgetMonth);

        if (budget == null)
        {
            budget = new MonthlyBudget
            {
                BudgetMonth = budgetMonth,
                LimitAmount = request.LimitAmount
            };
            _context.MonthlyBudgets.Add(budget);
        }
        else
        {
            budget.LimitAmount = request.LimitAmount;
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "Ngân sách của tháng này vừa được thay đổi. Hãy tải lại và thử lại."
            });
        }

        var summary = await GetSummaryAsync(budgetMonth);
        return Ok(summary);
    }

    private static bool TryGetBudgetMonth(int year, int month, out DateTime budgetMonth)
    {
        budgetMonth = default;

        if (year is < 1 or > 9999 || month is < 1 or > 12)
        {
            return false;
        }

        budgetMonth = new DateTime(year, month, 1);
        return true;
    }

    private async Task<object> GetSummaryAsync(DateTime budgetMonth)
    {
        var nextMonth = budgetMonth.AddMonths(1);
        var budget = await _context.MonthlyBudgets
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.BudgetMonth == budgetMonth);

        var actualExpense = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Type == "Expense"
                && t.TransactionDate >= budgetMonth
                && t.TransactionDate < nextMonth)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;

        if (budget == null)
        {
            return new
            {
                hasBudget = false,
                budgetMonth,
                limitAmount = (decimal?)null,
                actualExpense,
                remainingAmount = (decimal?)null,
                usagePercentage = (decimal?)null
            };
        }

        var remainingAmount = budget.LimitAmount - actualExpense;
        var usagePercentage = actualExpense / budget.LimitAmount * 100;

        return new
        {
            hasBudget = true,
            budgetMonth,
            limitAmount = budget.LimitAmount,
            actualExpense,
            remainingAmount,
            usagePercentage
        };
    }

    public class BudgetRequest
    {
        public decimal LimitAmount { get; set; }
    }
}
