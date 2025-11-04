using Microsoft.AspNetCore.Mvc;
using dotnet_service.Services;
using dotnet_service.Models; 
using System.Collections.Generic;

namespace dotnet_service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly PdfService _pdfService;

        public ReportController(PdfService pdfService)
        {
            _pdfService = pdfService;
        }

        [HttpPost("yield-report")] // <-- Must be HttpPost
        public IActionResult GetYieldReport([FromBody] List<YieldReportData> reportData) // <-- Must be [FromBody]
        {
            try
            {
                byte[] pdfBytes = _pdfService.GenerateYieldReport(reportData); 
                string fileName = $"Dynamic_Yield_Report.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
}