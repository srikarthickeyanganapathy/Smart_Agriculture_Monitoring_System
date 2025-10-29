using System;
using System.IO;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using OrchestratorService.Models;

[ApiController]
[Route("api/[controller]")]
public class OrchestratorController : ControllerBase
{
    private readonly IMongoDatabase _db;
    private readonly IHttpClientFactory _http;

    public OrchestratorController(IMongoDatabase db, IHttpClientFactory http)
    {
        _db = db;
        _http = http;
    }

    [HttpPost("predict/crop")]
    public async Task<IActionResult> PredictCrop([FromBody] PredictCropRequest req)
    {
        var images = _db.GetCollection<HyperspectralImage>("hyperspectral_images");
        var img = await images.Find(i => i.Id == req.ImageId).FirstOrDefaultAsync();
        Console.WriteLine(img);
        if (img == null) return NotFound("image not found");

        var client = _http.CreateClient("ml");
        var fullPath = Path.GetFullPath(img.FilePath).Replace("\\", "/");
        if (!fullPath.StartsWith("/")) fullPath = "/" + fullPath;
        var fileUri = $"file://{fullPath}";
        var payload = new { file_uri = fileUri, fieldId = img.FieldId };
        // var payload = new { file_uri = img.FilePath, fieldId = img.FieldId };
        var resp = await client.PostAsJsonAsync("/predict/crop", payload);
        if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, await resp.Content.ReadAsStringAsync());

        var mlResult = await resp.Content.ReadFromJsonAsync<CropPredictionResult>();

        var preds = _db.GetCollection<Prediction>("predictions");
        var p = new Prediction
        {
            Id = ObjectId.GenerateNewId().ToString(),
            SourceId = img.Id,
            Task = "crop_classification",
            Model = mlResult?.Model ?? "unknown",
            Result = mlResult?.Result ?? new { },
            SpatialMapUri = mlResult?.SpatialMapUri,
            CreatedAt = DateTime.UtcNow
        };
        await preds.InsertOneAsync(p);

        // update image record as processed and store prediction
        img.Processed = true;
        img.Metadata = img.Metadata ?? new object();
        img.CropPrediction = mlResult?.Result;
        await images.ReplaceOneAsync(i => i.Id == img.Id, img);

        return Ok(p);
    }

    [HttpGet("predictions")]
    public async Task<IActionResult> GetPredictions()
    {
        var preds = _db.GetCollection<Prediction>("predictions");
        var list = await preds.Find(_ => true).Limit(100).ToListAsync();
        return Ok(list);
    }
}

public record PredictCropRequest(string ImageId);

public class CropPredictionResult
{
    public object Result { get; set; } = null!;
    public string Model { get; set; } = "crop-v1";
    public string? SpatialMapUri { get; set; }
}

public class Prediction
{
    public string Id { get; set; } = null!;
    public string SourceId { get; set; } = null!;
    public string Task { get; set; } = null!;
    public string Model { get; set; } = null!;
    public object Result { get; set; } = null!;
    public string? SpatialMapUri { get; set; }
    public DateTime CreatedAt { get; set; }
}
