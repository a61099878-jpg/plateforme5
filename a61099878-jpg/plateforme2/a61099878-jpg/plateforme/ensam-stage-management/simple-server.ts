import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use('*', cors());

// Test endpoint
app.get('/api', (c) => {
  return c.json({ message: 'ENSAM Stage Management API', version: '1.0.0' });
});

// Mock auth endpoint for testing
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    
    // Mock authentication - replace with real logic later
    if (email === 'admin@ensam.ac.ma' && password === 'AdminENSAM2024!' && role === 'admin') {
      return c.json({ 
        token: 'mock-token-admin',
        user: {
          id: 1,
          email: 'admin@ensam.ac.ma',
          name: 'Administrateur ENSAM',
          role: 'admin'
        }
      });
    }
    
    if (email === 'test@ensam.ac.ma' && password === 'test123' && role === 'student') {
      return c.json({ 
        token: 'mock-token-student',
        user: {
          id: 2,
          email: 'test@ensam.ac.ma',
          name: 'Étudiant Test',
          role: 'student'
        }
      });
    }
    
    return c.json({ error: 'Identifiants incorrects' }, 401);
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// Mock token verification
app.post('/api/auth/verify', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token === 'mock-token-admin') {
    return c.json({
      user: {
        id: 1,
        email: 'admin@ensam.ac.ma',
        name: 'Administrateur ENSAM',
        role: 'admin'
      }
    });
  }
  
  if (token === 'mock-token-student') {
    return c.json({
      user: {
        id: 2,
        email: 'test@ensam.ac.ma',
        name: 'Étudiant Test',
        role: 'student'
      }
    });
  }
  
  return c.json({ error: 'Token invalide' }, 401);
});

console.log('🚀 Backend API running on http://localhost:3001');
console.log('👤 Test Admin: admin@ensam.ac.ma / AdminENSAM2024!');
console.log('👤 Test Student: test@ensam.ac.ma / test123');

export default app;