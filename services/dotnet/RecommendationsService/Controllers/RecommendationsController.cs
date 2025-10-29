using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _http;

    public RecommendationsController(IConfiguration config, IHttpClientFactory httpFactory)
    {
        _config = config;
        _http = httpFactory;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] double lat, [FromQuery] double lon, [FromQuery] string crop)
    {
        var key = _config.GetValue<string>("OPENWEATHER_API_KEY");
        if (string.IsNullOrEmpty(key))
        {
            return Ok(new { recommendations = new[] { "Default: check moisture and N-levels." } });
        }

        var client = _http.CreateClient();
        var url = $"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric";
        var weather = await client.GetFromJsonAsync<object>(url);
        return Ok(new { weather, recommendations = new[] { $"Check irrigation for {crop} if low rainfall expected." } });
    }
}
