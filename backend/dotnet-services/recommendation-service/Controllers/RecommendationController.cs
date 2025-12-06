using Microsoft.AspNetCore.Mvc;
using SmartAgri.Recommendation.Models;
using SmartAgri.Recommendation.Services;

namespace SmartAgri.Recommendation.Controllers
{
    [ApiController]
    [Route("api/recommend")]
    public class RecommendController : ControllerBase
    {
        private readonly IRecommendationEngine _engine;

        public RecommendController(IRecommendationEngine engine)
        {
            _engine = engine;
        }

        [HttpPost("crop")]
        public ActionResult<RecommendationResult> Post([FromBody] RecommendationRequest req)
        {
            // req.DatasetUrl may be "/mnt/data/enhanced_agri_dataset.csv"
            var result = _engine.GenerateRecommendation(req);
            return Ok(result);
        }
    }
}
