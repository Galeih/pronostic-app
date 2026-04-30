# ─── Étape 1 : build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copier les .csproj et restaurer les dépendances (cache layer)
COPY src/PronosticApp.API/PronosticApp.API.csproj                         src/PronosticApp.API/
COPY src/PronosticApp.Application/PronosticApp.Application.csproj         src/PronosticApp.Application/
COPY src/PronosticApp.Domain/PronosticApp.Domain.csproj                   src/PronosticApp.Domain/
COPY src/PronosticApp.Infrastructure/PronosticApp.Infrastructure.csproj   src/PronosticApp.Infrastructure/
RUN dotnet restore src/PronosticApp.API/PronosticApp.API.csproj

# Copier le reste et publier
COPY . .
RUN dotnet publish src/PronosticApp.API/PronosticApp.API.csproj \
    -c Release -o /app/publish --no-restore

# ─── Étape 2 : runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Créer le dossier logs
RUN mkdir -p logs

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PronosticApp.API.dll"]
