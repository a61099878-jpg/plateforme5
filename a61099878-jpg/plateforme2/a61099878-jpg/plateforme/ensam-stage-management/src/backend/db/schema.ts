import { sql, relations } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
});

export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password'),
  nom: text('nom').notNull(),
  telephone: text('telephone'),
  filiere: text('filiere').notNull(),
  annee: integer('annee').notNull(),
  codeApogee: text('code_apogee').notNull().unique(),
  cne: text('cne').notNull().unique(),
  cin: text('cin').notNull().unique(),
  dateNaissance: text('date_naissance').notNull(),
  isRegistered: integer('is_registered', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
});

export const conventions = sqliteTable('conventions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').references(() => students.id).notNull(),
  typeStage: text('type_stage').notNull(), // initiation, fin_annee, fin_etudes
  filePath: text('file_path'), // chemin vers le fichier signé uploadé
  fileName: text('file_name'),
  status: text('status').default('en_attente'), // en_attente, envoye, valide, rejete
  generatedAt: text('generated_at').default(sql`(datetime('now', 'localtime'))`),
  submittedAt: text('submitted_at'),
  validatedAt: text('validated_at'),
  rejectedAt: text('rejected_at'),
  adminNotes: text('admin_notes'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Convention = typeof conventions.$inferSelect;
export type Setting = typeof settings.$inferSelect;

export type NewAdmin = typeof admins.$inferInsert;
export type NewStudent = typeof students.$inferInsert;
export type NewConvention = typeof conventions.$inferInsert;
export type NewSetting = typeof settings.$inferInsert;

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  conventions: many(conventions),
}));

export const conventionsRelations = relations(conventions, ({ one }) => ({
  student: one(students, {
    fields: [conventions.studentId],
    references: [students.id],
  }),
}));