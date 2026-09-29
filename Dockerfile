# ============================================================
# AURA++ — Multi-Stage Dockerfile
# ASP.NET Core 8 + SQLite (default) / MySQL (optional)
# ============================================================

# ── Stage 1: Restore dependencies ────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS restore
WORKDIR /src

# Copy only project file first (layer-cache friendly)
COPY AuraApp.csproj ./
RUN dotnet restore AuraApp.csproj --no-cache

# ── Stage 2: Build ───────────────────────────────────────────
FROM restore AS build
WORKDIR /src

# Copy entire source after restore cache hit
COPY . .

ARG BUILD_CONFIGURATION=Release
RUN dotnet build AuraApp.csproj \
        -c ${BUILD_CONFIGURATION} \
        --no-restore \
        -o /app/build

# ── Stage 3: Publish ─────────────────────────────────────────
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish AuraApp.csproj \
        -c ${BUILD_CONFIGURATION} \
        --no-build \
        -o /app/publish \
        /p:UseAppHost=false

# ── Stage 4: Final runtime image ─────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

# Label metadata
LABEL maintainer="AURA++ Team"
LABEL org.opencontainers.image.title="AuraApp"
LABEL org.opencontainers.image.description="AURA++ Event Ticketing Platform"
LABEL org.opencontainers.image.version="3.2"

# Create non-root user for security
RUN addgroup --system aura && adduser --system --ingroup aura aura

WORKDIR /app

# Copy published output
COPY --from=publish /app/publish .

# Create writable directory for SQLite DB
RUN mkdir -p /app/data && chown -R aura:aura /app

# Switch to non-root user
USER aura

# Expose HTTP port
EXPOSE 8080

# Environment defaults (can be overridden at runtime)
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__SqliteConnection="Data Source=/app/data/aura.db"

# Health check — hits the admin summary endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/api/admin/summary || exit 1

ENTRYPOINT ["dotnet", "AuraApp.dll"]
