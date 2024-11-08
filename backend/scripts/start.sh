#!/bin/bash
# backend/scripts/start.sh

# Wait for Postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h db -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
do
  echo "Waiting for database connection..."
  sleep 2
done

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the FastAPI application
echo "Starting FastAPI application..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload