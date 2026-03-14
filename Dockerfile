FROM python:3.12-slim

WORKDIR /app

# Install system deps for Pillow and audio encoding
RUN apt-get update && \
    apt-get install -y --no-install-recommends libjpeg62-turbo-dev zlib1g-dev ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt ./
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r server/requirements.txt

# Copy application code
COPY pysstv/ ./pysstv/
COPY server/ ./server/

# Non-root user for security
RUN useradd --create-home appuser && \
    mkdir -p /app/data && chown appuser:appuser /app/data
USER appuser

EXPOSE 8000

# Production WSGI server
CMD ["gunicorn", "server.wsgi:app", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
