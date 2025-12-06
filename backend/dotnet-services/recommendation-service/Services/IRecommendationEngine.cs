using SmartAgri.Recommendation.Models;

namespace SmartAgri.Recommendation.Services
{
    public interface IRecommendationEngine
    {
        RecommendationResult GenerateRecommendation(RecommendationRequest req);
    }
}