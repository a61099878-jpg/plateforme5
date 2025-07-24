import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'ensam-stage-secret-key-2024';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'student';
}

export async function authenticateAdmin(email: string, password: string): Promise<AuthUser | null> {
  try {
    const admin = await db.query.admins.findFirst({
      where: eq(schema.admins.email, email)
    });

    if (!admin) return null;

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) return null;

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin'
    };
  } catch (error) {
    console.error('Erreur authentification admin:', error);
    return null;
  }
}

export async function authenticateStudent(email: string, password: string): Promise<AuthUser | null> {
  try {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.email, email)
    });

    if (!student || !student.isRegistered || !student.password) return null;

    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) return null;

    return {
      id: student.id,
      email: student.email,
      name: student.nom,
      role: 'student'
    };
  } catch (error) {
    console.error('Erreur authentification étudiant:', error);
    return null;
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}

export async function registerStudent(email: string, password: string): Promise<boolean> {
  try {
    // Vérifier que l'étudiant existe dans la base importée
    const student = await db.query.students.findFirst({
      where: eq(schema.students.email, email)
    });

    if (!student) {
      return false; // Étudiant non trouvé dans la base
    }

    if (student.isRegistered) {
      return false; // Déjà enregistré
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.update(schema.students)
      .set({
        password: hashedPassword,
        isRegistered: true
      })
      .where(eq(schema.students.id, student.id));

    return true;
  } catch (error) {
    console.error('Erreur enregistrement étudiant:', error);
    return false;
  }
}