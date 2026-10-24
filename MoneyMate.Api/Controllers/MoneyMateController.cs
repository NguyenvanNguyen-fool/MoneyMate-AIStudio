
using Microsoft.AspNetCore.Mvc;

namespace MoneyMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoneyMateController : ControllerBase
{
    [HttpGet("hello")]
    public IActionResult Hello()
    {
        return Ok(new
        {
            message = "Welcome to MoneyMate!",
            status = "API is running"
        });
    }
}
