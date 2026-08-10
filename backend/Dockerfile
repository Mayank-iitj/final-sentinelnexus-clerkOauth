FROM python:3.12-slim

# Prevent bytecode generation and enable unbuffered stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for psycopg2 and reportlab
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080

# Expose port
EXPOSE ${PORT}

# Copy and permission the entrypoint script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Run migrations then start gunicorn
CMD ["/start.sh"]
