# Aedes Carrière Nieuws Monitor - Docker Image
# =============================================
# Bouw: docker build -t carriere-nieuws ./carriere_nieuws
# Run:  docker run -d --name carriere-nieuws \
#         -e SMTP_SERVER=smtp.gmail.com \
#         -e SMTP_PORT=587 \
#         -e SMTP_USERNAME=jouw@email.com \
#         -e SMTP_PASSWORD=app-wachtwoord \
#         -e SENDER_EMAIL=jouw@email.com \
#         -e RECIPIENTS=ontvanger1@email.com,ontvanger2@email.com \
#         -e CHECK_INTERVAL_MINUTES=60 \
#         -v carriere-nieuws-cache:/app/cache \
#         carriere-nieuws

FROM python:3.11-slim

LABEL maintainer="Finance Ideas"
LABEL description="Aedes Carrière Nieuws Monitor - Automatische email alerts"

# Werk directory
WORKDIR /app

# Installeer dependencies eerst (voor caching)
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopieer applicatie code
COPY . /app/carriere_nieuws/
COPY ../pyproject.toml /app/

# Installeer de applicatie
RUN pip install --no-cache-dir -e .

# Maak cache directory
RUN mkdir -p /app/cache

# Environment variabelen
ENV CACHE_FILE=/app/cache/cache.json
ENV LOG_LEVEL=INFO
ENV CHECK_INTERVAL_MINUTES=60

# Health check
HEALTHCHECK --interval=5m --timeout=30s --start-period=10s --retries=3 \
    CMD python -c "import carriere_nieuws; print('OK')" || exit 1

# Start de monitor in watch mode
CMD ["python", "-m", "carriere_nieuws.cli", "watch"]
