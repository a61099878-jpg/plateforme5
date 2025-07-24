import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const sqlite = new Database(path.join(process.cwd(), 'ensam_stages.db'));
export const db = drizzle(sqlite, { schema });

export async function initDatabase() {
  try {
    // Check if migrations directory exists
    const migrationsPath = path.join(process.cwd(), 'drizzle');
    if (fs.existsSync(migrationsPath)) {
      migrate(db, { migrationsFolder: migrationsPath });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Répertoire uploads créé');
    }
    
    // Create default admin if doesn't exist
    const existingAdmin = await db.query.admins.findFirst({
      where: (admins, { eq }) => eq(admins.email, 'admin@ensam.ac.ma')
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('AdminENSAM2024!', 10);
      await db.insert(schema.admins).values({
        email: 'admin@ensam.ac.ma',
        password: hashedPassword,
        name: 'Administrateur ENSAM',
      });
      console.log('Admin par défaut créé: admin@ensam.ac.ma / AdminENSAM2024!');
    }

    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

export { schema };