// jest.setup.ts
import pool from './src/config/db'; // Path to your db config

// Optionally, you can mock the pool globally here if you need to mock it for all tests:
jest.mock('./src/config/db', () => ({
  query: jest.fn(), // Mock query method globally
}));
