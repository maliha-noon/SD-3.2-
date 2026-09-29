# Multi-stage Dockerfile for ASP.NET Core 8.0 Application (AuraApp)

# Base stage: ASP.NET Core 8.0 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Build stage: .NET 8.0 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project file and restore dependencies
COPY ["AuraApp.csproj", "./"]
RUN dotnet restore "AuraApp.csproj"

# Copy remaining source code and build project
COPY . .
WORKDIR "/src"
RUN dotnet build "AuraApp.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish stage: produce production binaries
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AuraApp.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final production stage: run application
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuraApp.dll"]
