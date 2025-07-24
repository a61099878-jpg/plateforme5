import * as XLSX from 'xlsx';
import { parse } from 'papaparse';
import { db, schema } from '../db';

export interface StudentImportData {
  nom: string;
  email: string;
  telephone?: string;
  filiere: string;
  annee: number;
  codeApogee: string;
  cne: string;
  cin: string;
  dateNaissance: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: string[];
  duplicates: string[];
}

export function parseCSVFile(fileContent: string): StudentImportData[] {
  const result = parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Normaliser les noms de colonnes
      const normalizedHeaders: { [key: string]: string } = {
        'nom': 'nom',
        'name': 'nom',
        'prénom': 'nom',
        'prenom': 'nom',
        'nom complet': 'nom',
        'nom_complet': 'nom',
        'email': 'email',
        'e-mail': 'email',
        'mail': 'email',
        'téléphone': 'telephone',
        'telephone': 'telephone',
        'tel': 'telephone',
        'phone': 'telephone',
        'filière': 'filiere',
        'filiere': 'filiere',
        'branch': 'filiere',
        'année': 'annee',
        'annee': 'annee',
        'year': 'annee',
        'niveau': 'annee',
        'code apogée': 'codeApogee',
        'code_apogee': 'codeApogee',
        'apogee': 'codeApogee',
        'cne': 'cne',
        'cin': 'cin',
        'date naissance': 'dateNaissance',
        'date_naissance': 'dateNaissance',
        'birth_date': 'dateNaissance',
        'birthday': 'dateNaissance'
      };
      
      const cleanHeader = header.toLowerCase().trim();
      return normalizedHeaders[cleanHeader] || cleanHeader;
    }
  });

  if (result.errors.length > 0) {
    console.error('Erreurs CSV:', result.errors);
    throw new Error('Erreur lors du parsing CSV');
  }

  return result.data.map((row: any) => ({
    nom: row.nom?.trim(),
    email: row.email?.trim().toLowerCase(),
    telephone: row.telephone?.trim(),
    filiere: row.filiere?.trim(),
    annee: parseInt(row.annee) || 1,
    codeApogee: row.codeApogee?.trim(),
    cne: row.cne?.trim(),
    cin: row.cin?.trim(),
    dateNaissance: row.dateNaissance?.trim()
  })).filter(student => 
    student.nom && 
    student.email && 
    student.filiere && 
    student.codeApogee && 
    student.cne && 
    student.cin
  );
}

export function parseExcelFile(fileBuffer: Buffer): StudentImportData[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  if (jsonData.length < 2) {
    throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données');
  }

  const headers = (jsonData[0] as string[]).map(h => h.toLowerCase().trim());
  const data = jsonData.slice(1) as any[][];

  // Mapping des colonnes similaire au CSV
  const columnMapping: { [key: string]: number } = {};
  headers.forEach((header, index) => {
    const normalizedHeaders: { [key: string]: string } = {
      'nom': 'nom',
      'name': 'nom',
      'prénom': 'nom',
      'prenom': 'nom',
      'nom complet': 'nom',
      'nom_complet': 'nom',
      'email': 'email',
      'e-mail': 'email',
      'mail': 'email',
      'téléphone': 'telephone',
      'telephone': 'telephone',
      'tel': 'telephone',
      'phone': 'telephone',
      'filière': 'filiere',
      'filiere': 'filiere',
      'branch': 'filiere',
      'année': 'annee',
      'annee': 'annee',
      'year': 'annee',
      'niveau': 'annee',
      'code apogée': 'codeApogee',
      'code_apogee': 'codeApogee',
      'apogee': 'codeApogee',
      'cne': 'cne',
      'cin': 'cin',
      'date naissance': 'dateNaissance',
      'date_naissance': 'dateNaissance',
      'birth_date': 'dateNaissance',
      'birthday': 'dateNaissance'
    };
    
    const mappedField = normalizedHeaders[header];
    if (mappedField) {
      columnMapping[mappedField] = index;
    }
  });

  return data.map(row => {
    if (!row || row.length === 0) return null;
    
    const student = {
      nom: row[columnMapping.nom]?.toString().trim(),
      email: row[columnMapping.email]?.toString().trim().toLowerCase(),
      telephone: row[columnMapping.telephone]?.toString().trim(),
      filiere: row[columnMapping.filiere]?.toString().trim(),
      annee: parseInt(row[columnMapping.annee]) || 1,
      codeApogee: row[columnMapping.codeApogee]?.toString().trim(),
      cne: row[columnMapping.cne]?.toString().trim(),
      cin: row[columnMapping.cin]?.toString().trim(),
      dateNaissance: row[columnMapping.dateNaissance]?.toString().trim()
    };
    
    // Valider les champs requis
    if (!student.nom || !student.email || !student.filiere || 
        !student.codeApogee || !student.cne || !student.cin) {
      return null;
    }
    
    return student as StudentImportData;
  }).filter((student): student is StudentImportData => student !== null);
}

export async function importStudents(students: StudentImportData[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: students.length,
    importedRows: 0,
    errors: [],
    duplicates: []
  };

  try {
    for (const student of students) {
      try {
        // Vérifier les doublons par email, CNE, CIN ou Code Apogée
        const existing = await db.query.students.findFirst({
          where: (students, { or, eq }) => or(
            eq(students.email, student.email),
            eq(students.cne, student.cne),
            eq(students.cin, student.cin),
            eq(students.codeApogee, student.codeApogee)
          )
        });

        if (existing) {
          result.duplicates.push(`${student.nom} (${student.email}) - déjà existant`);
          continue;
        }

        // Valider l'email institutionnel
        if (!student.email.endsWith('@ensam.ac.ma') && !student.email.endsWith('@eleve.ensam.ac.ma')) {
          result.errors.push(`${student.nom}: Email non institutionnel (${student.email})`);
          continue;
        }

        // Insérer l'étudiant
        await db.insert(schema.students).values({
          nom: student.nom,
          email: student.email,
          telephone: student.telephone,
          filiere: student.filiere,
          annee: student.annee,
          codeApogee: student.codeApogee,
          cne: student.cne,
          cin: student.cin,
          dateNaissance: student.dateNaissance,
          isRegistered: false
        });

        result.importedRows++;
      } catch (error) {
        result.errors.push(`${student.nom}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    result.success = result.importedRows > 0;
    return result;
  } catch (error) {
    result.errors.push(`Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return result;
  }
}

export async function exportStudents(): Promise<Buffer> {
  try {
    const allStudents = await db.query.students.findMany({
      orderBy: (students, { asc }) => [asc(students.filiere), asc(students.annee), asc(students.nom)]
    });

    const exportData = allStudents.map(student => ({
      'Nom': student.nom,
      'Email': student.email,
      'Téléphone': student.telephone || '',
      'Filière': student.filiere,
      'Année': student.annee,
      'Code Apogée': student.codeApogee,
      'CNE': student.cne,
      'CIN': student.cin,
      'Date de naissance': student.dateNaissance,
      'Compte créé': student.isRegistered ? 'Oui' : 'Non',
      'Date d\'ajout': student.createdAt || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Étudiants');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  } catch (error) {
    console.error('Erreur export étudiants:', error);
    throw new Error('Impossible d\'exporter les étudiants');
  }
}