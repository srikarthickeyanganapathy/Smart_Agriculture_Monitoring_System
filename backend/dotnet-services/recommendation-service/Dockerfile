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
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy the build artifacts
COPY --from=build /app/publish .

# Configure for Render (Render maps external ports to 80, but the container uses 8080)
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "recommendation-service.dll"]