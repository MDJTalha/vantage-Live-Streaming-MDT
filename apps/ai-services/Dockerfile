# VANTAGE AI Services
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY apps/ai-services/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY apps/ai-services/src ./src

# Production image
FROM python:3.11-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libssl-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install only runtime dependencies
RUN pip install --no-cache-dir openai transformers torch

COPY --from=base --chown=root:root /app/src ./src

RUN adduser -D -u 1001 appuser
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["python", "-m", "uvicorn", "src.index:app", "--host", "0.0.0.0", "--port", "5000"]
