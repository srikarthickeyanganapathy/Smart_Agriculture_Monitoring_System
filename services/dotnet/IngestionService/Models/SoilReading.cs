// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;
// using System;

// namespace IngestionService.Models
// {
//     public class SoilReading
//     {
//         [BsonId]
//         [BsonRepresentation(BsonType.ObjectId)]
//         public string Id { get; set; }
//         public string FieldId { get; set; }
//         public float Temperature { get; set; }
//         public float Moisture { get; set; }
//         public float PH { get; set; }
//         public DateTime Timestamp { get; set; }
//     }
// }


using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class SoilReading
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;
    public string FieldId { get; set; } = string.Empty;
    public string SensorId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public double Ph { get; set; }
    public double Moisture { get; set; }
    public double Ec { get; set; }
    public double Temperature { get; set; }
    public object? Raw { get; set; }
}
