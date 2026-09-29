using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuraApp.Data;
using AuraApp.Models;

namespace AuraApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly AuraDbContext _context;
        public ReviewsController(AuraDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetReviews() => Ok(await _context.Reviews
            .OrderByDescending(r => r.CreatedAt).Take(30).ToListAsync());

        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest(new { message = "Please write a review." });

            var review = new Review
            {
                UserId = dto.UserId,
                UserName = string.IsNullOrWhiteSpace(dto.UserName) ? "AURA Guest" : dto.UserName.Trim(),
                Content = dto.Content.Trim(),
                Rating = Math.Clamp(dto.Rating, 1, 5),
                CreatedAt = DateTime.UtcNow
            };
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return Ok(review);
        }
    }
}
