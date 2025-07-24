import app from './src/backend/api';

const port = process.env.PORT || 3001;

const server = Bun.serve({
  port: port,
  fetch: app.fetch,
});

console.log(`🚀 Backend API running on http://localhost:${server.port}`);
console.log(`📊 Database: SQLite (ensam_stages.db)`);
console.log(`👤 Admin login: admin@ensam.ac.ma / AdminENSAM2024!`);