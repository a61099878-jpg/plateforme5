import app from './simple-server';

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log(`🚀 Simple backend running on http://localhost:${server.port}`);