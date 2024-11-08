# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /backend

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make the startup script executable
COPY ./scripts/start.sh /start.sh
RUN chmod +x /start.sh

# Command to run the application
CMD ["/start.sh"]