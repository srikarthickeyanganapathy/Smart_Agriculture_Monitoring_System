// using Microsoft.AspNetCore.Mvc;
// using MongoDB.Driver;
// using IngestionService.Models;
// using System.IO;
// using System.Threading.Tasks;
// using System;

// namespace IngestionService.Controllers
// {
//     [ApiController]
//     [Route("api/[controller]")]
//     public class IngestionController : ControllerBase
//     {
//         private readonly IMongoCollection<HyperspectralImage> _images;
//         private readonly string _storagePath;

//         public IngestionController(IMongoDatabase db, IConfiguration config)
//         {
//             _images = db.GetCollection<HyperspectralImage>("hyperspectral_images");
//             _storagePath = config.GetValue<string>("StoragePath") ?? "./storage/hyperspectral";
//             Directory.CreateDirectory(_storagePath);
//         }

//         [HttpPost("upload")]
//         [RequestSizeLimit(1073741824)] // 1GB
//         public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string fieldId)
//         {
//             if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

//             var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
//             var savePath = Path.Combine(_storagePath, fileName);

//             await using (var stream = System.IO.File.Create(savePath))
//             {
//                 await file.CopyToAsync(stream);
//             }

//             var record = new HyperspectralImage
//             {
//                 FieldId = fieldId,
//                 FilePath = savePath,
//                 FileName = file.FileName,
//                 CaptureDate = DateTime.UtcNow,
//                 Processed = false
//             };

//             await _images.InsertOneAsync(record);

//             return Ok(new { id = record.Id, filePath = savePath });
//         }
//     }
// }


using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;

[ApiController]
[Route("api/[controller]")]
public class IngestionController : ControllerBase
{
    private readonly IMongoCollection<HyperspectralImage> _images;
    private readonly IMongoCollection<SoilReading> _soil;
    private readonly string _storagePath;
    private readonly string _pythonExe;

    public IngestionController(IMongoDatabase db, IConfiguration config)
    {
        _images = db.GetCollection<HyperspectralImage>("hyperspectral_images");
        _soil = db.GetCollection<SoilReading>("soil_readings");
        _storagePath = config.GetValue<string>("StoragePath") ?? "./storage/hyperspectral";
        Directory.CreateDirectory(_storagePath);

        // Optionally set python path (if you want to use a specific python)
        _pythonExe = config.GetValue<string>("Python:Path") ?? "python";
    }

    [HttpPost("upload")]
    [RequestSizeLimit(1073741824)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string fieldId)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");
        var allowed = new[] { ".npy", ".npz", ".tif", ".tiff" };
        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || Array.IndexOf(allowed, ext) < 0)
            return BadRequest("Unsupported file type.");

        var fileName = $"{Guid.NewGuid():N}_{Path.GetFileName(file.FileName)}";
        var savePath = Path.Combine(_storagePath, fileName);

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(savePath)!);
            await using var stream = System.IO.File.Create(savePath);
            await file.CopyToAsync(stream);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Failed to save file: {ex.Message}");
        }

        var record = new HyperspectralImage
        {
            FieldId = fieldId ?? string.Empty,
            FilePath = Path.GetFullPath(savePath),
            FileName = file.FileName,
            CaptureDate = DateTime.UtcNow,
            Processed = false
        };

        await _images.InsertOneAsync(record);

        return Ok(new { id = record.Id, filePath = record.FilePath });
    }

    [HttpPost("ingest-soil")]
    public async Task<IActionResult> IngestSoil([FromBody] SoilReading reading)
    {
        if (reading == null) return BadRequest("Invalid payload.");
        reading.Id = ObjectId.GenerateNewId().ToString();
        reading.Timestamp = reading.Timestamp == default ? DateTime.UtcNow : reading.Timestamp;
        await _soil.InsertOneAsync(reading);
        return Ok(new { id = reading.Id });
    }
}
