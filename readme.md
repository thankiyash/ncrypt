# Database Directory

This directory contains the PostgreSQL data files for local development.

## Structure

- `data/` - Contains PostgreSQL data files (gitignored)

## Notes

- The `data` directory is automatically created when running `docker-compose up` for the first time
- This directory is excluded from Git to avoid committing database files
- Each developer will have their own local copy of the database

## First Time Setup

1. Create the data directory if it doesn't exist:

   ```bash
   mkdir -p data
   ```

2. Start the database using docker-compose:
   ```bash
   docker-compose up
   ```

## Backup and Restore

To backup your database:

```bash
docker exec -t your-db-container pg_dumpall -c -U user > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
```

To restore from a backup:

```bash
cat your_dump.sql | docker exec -i your-db-container psql -U user -d password_manager
```
