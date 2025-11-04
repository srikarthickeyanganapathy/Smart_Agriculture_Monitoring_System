using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using dotnet_service.Models; // Import your model
using System.Collections.Generic;

namespace dotnet_service.Services 
{
    public class PdfService
    {
        public byte[] GenerateYieldReport(List<YieldReportData> data)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.Header()
                        .Text("Smart Agriculture Yield Report")
                        .SemiBold().FontSize(20).FontColor(Colors.Blue.Medium);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Table(table => 
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                            });
                            
                            // Define the table header
                            table.Header(header =>
                            {
                                header.Cell().Text("Data ID");
                                header.Cell().Text("Yield (t/ha)");
                                header.Cell().Text("Moisture (%)");
                                header.Cell().Text("Temp (°C)");
                                header.Cell().Text("Timestamp");
                            });
                            
                            // Loop over the data from the Java service
                            foreach (var item in data)
                            {
                                table.Cell().Text(item.UniqueDataId);
                                table.Cell().Text(item.PredictedYield.ToString("F2"));
                                table.Cell().Text(item.SoilMoisture.ToString("F1"));
                                table.Cell().Text(item.Temperature.ToString("F1"));
                                table.Cell().Text(item.Timestamp.ToString("g"));
                            }
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x => x.CurrentPageNumber());
                });
            }).GeneratePdf();
        }
    }
}