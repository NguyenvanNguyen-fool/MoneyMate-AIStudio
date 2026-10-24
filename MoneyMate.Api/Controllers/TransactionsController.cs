
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMate.Api.Data;
using MoneyMate.Api.Models;

namespace MoneyMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private static readonly HashSet<string> AllowedCategories = new(
        StringComparer.Ordinal)
    {
        "Ăn uống",
        "Đi lại",
        "Hóa đơn",
        "Mua sắm",
        "Giải trí",
        "Sức khỏe",
        "Giáo dục",
        "Lương",
        "Thưởng",
        "Khác"
    };

    private readonly MoneyMateDbContext _context;

    public TransactionsController(MoneyMateDbContext context)
    {
        _context = context;
    }

    // Validate dữ liệu trước khi thêm hoặc sửa
    private string? ValidateTransaction(Transaction transaction)
    {
        if (string.IsNullOrWhiteSpace(transaction.Title))
        {
            return "Tiêu đề không được để trống.";
        }

        if (transaction.Title.Trim().Length > 200)
        {
            return "Tiêu đề không được vượt quá 200 ký tự.";
        }

        if (transaction.Amount <= 0)
        {
            return "Số tiền phải lớn hơn 0.";
        }

        if (!string.Equals(transaction.Type, "Income",
                StringComparison.OrdinalIgnoreCase)
            && !string.Equals(transaction.Type, "Expense",
                StringComparison.OrdinalIgnoreCase))
        {
            return "Loại giao dịch chỉ được là Income hoặc Expense.";
        }

        if (!AllowedCategories.Contains(transaction.Category))
        {
            return "Danh mục giao dịch không hợp lệ.";
        }

        if (transaction.TransactionDate == default)
        {
            return "Ngày giao dịch không hợp lệ.";
        }

        return null;
    }

    // GET: api/transactions
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var transactions = await _context.Transactions
            .AsNoTracking()
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .ToListAsync();

        return Ok(transactions);
    }

    // GET: api/transactions/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "ID không hợp lệ." });
        }

        var transaction = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
        {
            return NotFound(new { message = "Không tìm thấy giao dịch." });
        }

        return Ok(transaction);
    }

    // POST: api/transactions
    [HttpPost]
    public async Task<IActionResult> Create(Transaction transaction)
    {
        var error = ValidateTransaction(transaction);

        if (error != null)
        {
            return BadRequest(new { message = error });
        }

        transaction.Title = transaction.Title.Trim();
        transaction.Type = transaction.Type.Equals(
            "Income", StringComparison.OrdinalIgnoreCase)
            ? "Income"
            : "Expense";
        transaction.Category = transaction.Category.Trim();

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = transaction.Id },
            transaction
        );
    }

    // PUT: api/transactions/1
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        Transaction updatedTransaction)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "ID không hợp lệ." });
        }

        var error = ValidateTransaction(updatedTransaction);

        if (error != null)
        {
            return BadRequest(new { message = error });
        }

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
        {
            return NotFound(new { message = "Không tìm thấy giao dịch." });
        }

        transaction.Title = updatedTransaction.Title.Trim();
        transaction.Amount = updatedTransaction.Amount;
        transaction.Type = updatedTransaction.Type.Equals(
            "Income", StringComparison.OrdinalIgnoreCase)
            ? "Income"
            : "Expense";
        transaction.Category = updatedTransaction.Category.Trim();
        transaction.TransactionDate = updatedTransaction.TransactionDate;

        await _context.SaveChangesAsync();

        return Ok(transaction);
    }

    // DELETE: api/transactions/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "ID không hợp lệ." });
        }

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
        {
            return NotFound(new { message = "Không tìm thấy giao dịch." });
        }

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa giao dịch thành công." });
    }
}
