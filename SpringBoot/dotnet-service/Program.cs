using dotnet_service.Services; // Import our PDF service

var builder = WebApplication.CreateBuilder(args);

// --- Add services to the container ---

// 1. Tell .NET we are using the Controller pattern
builder.Services.AddControllers();

// 2. Register our PdfService for dependency injection
builder.Services.AddScoped<PdfService>();

// 3. Add Swagger/OpenAPI for documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Configure the HTTP request pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Commented out for simple http testing
app.UseAuthorization();

// 4. Tell .NET to map requests to our Controllers
app.MapControllers();

app.Run();