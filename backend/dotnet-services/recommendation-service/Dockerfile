# ----------------------------
# Stage 1: Build the App
# ----------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the rest of the source code
COPY . .

# Build and Publish
RUN dotnet publish -c Release -o /app/publish

# ----------------------------
# Stage 2: Run the App
# ----------------------------
# NOTE: We use the standard image, but we MUST install libgomp1 for ML.NET
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# 🔴 CRITICAL FIX: Install dependencies for LightGBM and ML.NET Native
# This prevents the "Connection reset" / Crash on Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

# Copy the build artifacts
COPY --from=build /app/publish .

# Configure for Render
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "recommendation-service.dll"]