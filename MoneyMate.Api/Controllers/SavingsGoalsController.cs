using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoneyMate.Api.Data;
using MoneyMate.Api.Models;

namespace MoneyMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SavingsGoalsController : ControllerBase
{
    private readonly MoneyMateDbContext _context;

    public SavingsGoalsController(MoneyMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var goals = await _context.SavingsGoals
            .AsNoTracking()
            .OrderBy(g => g.TargetDate == null)
            .ThenBy(g => g.TargetDate)
            .ThenByDescending(g => g.CreatedAt)
            .ToListAsync();

        return Ok(goals);
    }

    [HttpPost]
    public async Task<IActionResult> Create(SavingsGoalRequest request)
    {
        var error = Validate(request);
        if (error != null)
        {
            return BadRequest(new { message = error });
        }

        var goal = new SavingsGoal
        {
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            SavedAmount = request.SavedAmount,
            TargetDate = request.TargetDate?.Date
        };

        _context.SavingsGoals.Add(goal);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = goal.Id }, goal);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, SavingsGoalRequest request)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "ID mục tiêu không hợp lệ." });
        }

        var error = Validate(request);
        if (error != null)
        {
            return BadRequest(new { message = error });
        }

        var goal = await _context.SavingsGoals.FindAsync(id);
        if (goal == null)
        {
            return NotFound(new { message = "Không tìm thấy mục tiêu tiết kiệm." });
        }

        goal.Name = request.Name.Trim();
        goal.TargetAmount = request.TargetAmount;
        goal.SavedAmount = request.SavedAmount;
        goal.TargetDate = request.TargetDate?.Date;

        await _context.SaveChangesAsync();
        return Ok(goal);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new { message = "ID mục tiêu không hợp lệ." });
        }

        var goal = await _context.SavingsGoals.FindAsync(id);
        if (goal == null)
        {
            return NotFound(new { message = "Không tìm thấy mục tiêu tiết kiệm." });
        }

        _context.SavingsGoals.Remove(goal);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã xóa mục tiêu tiết kiệm." });
    }

    private static string? Validate(SavingsGoalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Tên mục tiêu không được để trống.";
        }

        if (request.Name.Trim().Length > 200)
        {
            return "Tên mục tiêu không được vượt quá 200 ký tự.";
        }

        if (request.TargetAmount <= 0)
        {
            return "Số tiền mục tiêu phải lớn hơn 0.";
        }

        if (request.SavedAmount < 0)
        {
            return "Số tiền đã tiết kiệm không được âm.";
        }

        return null;
    }

    public class SavingsGoalRequest
    {
        public string Name { get; set; } = string.Empty;

        public decimal TargetAmount { get; set; }

        public decimal SavedAmount { get; set; }

        public DateTime? TargetDate { get; set; }
    }
}
