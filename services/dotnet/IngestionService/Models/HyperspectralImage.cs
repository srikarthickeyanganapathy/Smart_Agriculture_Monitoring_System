// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;
// using System;

// namespace IngestionService.Models
// {
//     public class HyperspectralImage
//     {
//         [BsonId]
//         [BsonRepresentation(BsonType.ObjectId)]
//         public string Id { get; set; }
//         public string FieldId { get; set; }
//         public string FilePath { get; set; }
//         public string FileName { get; set; }
//         public DateTime CaptureDate { get; set; }
//         public bool Processed { get; set; }
//         public string CropPrediction { get; set; }
//     }
// }

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class HyperspectralImage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;
    public string FieldId { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public int Bands { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public DateTime CaptureDate { get; set; }
    public bool Processed { get; set; }
    public object? Metadata { get; set; }
    public object? CropPrediction { get; set; }
}

