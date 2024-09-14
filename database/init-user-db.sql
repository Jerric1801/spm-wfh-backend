
-- Create User
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
        CREATE USER admin WITH PASSWORD 'admin';
    END IF;
END
$$;

-- Create the database
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'AIO_WFH') THEN
      CREATE DATABASE AIO_WFH;
      GRANT ALL PRIVILEGES ON DATABASE AIO_WFH TO admin;
   END IF;
END $$;
