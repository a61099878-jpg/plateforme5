# 📝 Guide de Personnalisation Avancée - Plateforme ENSAM

## 📊 1. IMPORT DE FICHIERS - Formats et Colonnes Personnalisés

### 🔧 Ajouter Support de Nouveaux Formats (JSON, XML, TXT)

#### Fichier à modifier : `backend-node.cjs`

**Localisation :** Ligne ~241 - Route `/api/admin/import`

```javascript
// ÉTAPE 1: Modifier l'acceptation des types de fichiers
app.post('/api/admin/import', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');
  
  // AJOUTER: Détecter le type de fichier
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  
  let parsedData = [];
  
  if (fileExtension === 'csv') {
    // Code CSV existant
    const text = await file.text();
    parsedData = parseCSV(text);
  } 
  else if (fileExtension === 'json') {
    // NOUVEAU: Support JSON
    const text = await file.text();
    parsedData = parseJSON(text);
  } 
  else if (fileExtension === 'xml') {
    // NOUVEAU: Support XML
    const text = await file.text();
    parsedData = parseXML(text);
  } 
  else if (fileExtension === 'txt') {
    // NOUVEAU: Support TXT (délimité par tabulations)
    const text = await file.text();
    parsedData = parseTXT(text);
  } 
  else {
    return c.json({ error: 'Format non supporté. Utilisez CSV, JSON, XML ou TXT' }, 400);
  }
  
  // Suite du code d'import...
});

// AJOUTER: Fonctions de parsing
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  return { headers, data };
}

function parseJSON(text) {
  try {
    const jsonData = JSON.parse(text);
    
    // Si c'est un tableau d'objets
    if (Array.isArray(jsonData) && jsonData.length > 0) {
      const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
      return { headers, data: jsonData };
    }
    
    // Si c'est un objet avec propriété "students" ou "data"
    if (jsonData.students || jsonData.data) {
      const studentsArray = jsonData.students || jsonData.data;
      const headers = Object.keys(studentsArray[0]).map(h => h.toLowerCase());
      return { headers, data: studentsArray };
    }
    
    throw new Error('Format JSON invalide');
  } catch (error) {
    throw new Error(`Erreur parsing JSON: ${error.message}`);
  }
}

function parseXML(text) {
  // Pour XML simple, vous devrez installer xml2js
  // npm install xml2js
  const xml2js = require('xml2js');
  
  return new Promise((resolve, reject) => {
    xml2js.parseString(text, (err, result) => {
      if (err) {
        reject(new Error(`Erreur parsing XML: ${err.message}`));
        return;
      }
      
      // Exemple pour <students><student><nom>...</nom></student></students>
      const students = result.students.student || [];
      const headers = students.length > 0 ? Object.keys(students[0]).map(h => h.toLowerCase()) : [];
      
      resolve({ headers, data: students });
    });
  });
}

function parseTXT(text) {
  // Pour fichiers délimités par tabulations
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.trim());
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  return { headers, data };
}
```

#### Fichier à modifier : `src/pages/admin/StudentsManagement.tsx`

**Localisation :** Ligne ~310 - Input file accept

```typescript
// CHANGER:
<input
  type="file"
  ref={fileInputRef}
  onChange={handleFileImport}
  accept=".csv,.xlsx,.xls,.json,.xml,.txt"  // AJOUTER LES NOUVEAUX FORMATS
  className="hidden"
/>
```

### 🗂️ Adapter le Mapping des Colonnes

#### Fichier à modifier : `backend-node.cjs`

**Localisation :** Ligne ~274 - Section mapping des headers

```javascript
// ÉTAPE 2: Personnaliser le mapping des colonnes
// REMPLACER la section de mapping existante par :

// MAPPING FLEXIBLE - Ajoutez vos correspondances ici
const columnMapping = {
  // Noms possibles pour "nom"
  nom: ['nom', 'name', 'prenom', 'prénom', 'fullname', 'full_name', 'student_name', 'etudiant'],
  
  // Noms possibles pour "email"
  email: ['email', 'mail', 'adresse_email', 'e_mail', 'student_email', 'contact_email'],
  
  // Noms possibles pour "filiere"
  filiere: ['filiere', 'filière', 'specialite', 'spécialité', 'branch', 'department', 'study_field'],
  
  // Noms possibles pour "annee"
  annee: ['annee', 'année', 'level', 'niveau', 'year', 'study_year', 'academic_year'],
  
  // Noms possibles pour "code_apogee"
  code_apogee: ['code_apogee', 'code apogée', 'apogee', 'code', 'student_id', 'student_code'],
  
  // Noms possibles pour "cne"
  cne: ['cne', 'numero_etudiant', 'num_etudiant', 'student_number', 'registration_number'],
  
  // Noms possibles pour "cin"
  cin: ['cin', 'carte_identite', 'id_number', 'national_id', 'identity_card'],
  
  // Noms possibles pour "date_naissance"
  date_naissance: ['date_naissance', 'date naissance', 'birth_date', 'birthday', 'naissance'],
  
  // Noms possibles pour "telephone"
  telephone: ['telephone', 'téléphone', 'phone', 'tel', 'mobile', 'contact_number']
};

// FONCTION DE MAPPING INTELLIGENTE
function mapHeaders(headers, data) {
  const mappedData = [];
  
  for (const row of data) {
    const mappedRow = {};
    
    // Pour chaque champ requis, chercher la correspondance
    for (const [standardField, possibleNames] of Object.entries(columnMapping)) {
      let value = '';
      
      // Chercher la première correspondance dans les headers
      for (const possibleName of possibleNames) {
        const header = headers.find(h => h.includes(possibleName));
        if (header && row[header]) {
          value = row[header];
          break;
        }
      }
      
      mappedRow[standardField] = value;
    }
    
    mappedData.push(mappedRow);
  }
  
  return mappedData;
}

// UTILISER dans la boucle d'import :
const { headers, data } = parsedData;
const mappedData = mapHeaders(headers, data);

for (const studentData of mappedData) {
  // Utiliser studentData.nom, studentData.email, etc.
  const nom = studentData.nom || '';
  const email = studentData.email || '';
  // ... reste du code
}
```

### 📋 Ajouter de Nouvelles Colonnes

#### Pour ajouter une nouvelle colonne (ex: "date_inscription")

**1. Modifier la base de données :**

```javascript
// AJOUTER dans backend-node.cjs après la création des tables (ligne ~16)
db.exec(`
  ALTER TABLE students ADD COLUMN date_inscription TEXT;
`);
```

**2. Modifier l'interface TypeScript :**

```typescript
// Fichier: src/lib/api.ts - ligne ~10
export interface Student {
  id: number;
  email: string;
  nom: string;
  telephone?: string;
  filiere: string;
  annee: number;
  codeApogee: string;
  cne: string;
  cin: string;
  dateNaissance: string;
  dateInscription?: string;  // AJOUTER
  isRegistered: boolean;
  createdAt?: string;
}
```

**3. Modifier le mapping :**

```javascript
// Dans backend-node.cjs - fonction mapStudentFromDB
function mapStudentFromDB(student) {
  return {
    // ... champs existants
    dateInscription: student.date_inscription,  // AJOUTER
  };
}

// Dans columnMapping
const columnMapping = {
  // ... mappings existants
  date_inscription: ['date_inscription', 'inscription_date', 'enrollment_date', 'registration_date'],
};
```

**4. Modifier l'interface utilisateur :**

```typescript
// Fichier: src/pages/admin/StudentsManagement.tsx
// Ajouter dans le formulaire d'ajout (ligne ~283) :
<div className="space-y-2">
  <Label htmlFor="dateInscription">Date d'inscription</Label>
  <Input
    id="dateInscription"
    type="date"
    value={newStudent.dateInscription}
    onChange={(e) => setNewStudent({ ...newStudent, dateInscription: e.target.value })}
  />
</div>

// Ajouter dans le tableau (ligne ~384) :
<TableHead>Date d'inscription</TableHead>

// Et dans le corps du tableau :
<TableCell>{student.dateInscription || '-'}</TableCell>
```

---

## 🎨 2. PERSONNALISATION DU TEMPLATE DE CONVENTION

### 📍 Localisation du Template

**Fichier principal :** `backend-node.cjs`
**Localisation :** Ligne ~394 - Fonction `/api/student/convention/generate`

### 🎯 Structure du Template Actuel

```javascript
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Convention de Stage - ${student.nom}</title>
    <style>
        /* SECTION CSS - MODIFIER ICI POUR LE STYLE */
    </style>
    <script>
        /* SECTION JAVASCRIPT - FONCTIONNALITÉS */
    </script>
</head>
<body>
    <!-- SECTION HTML - CONTENU DE LA CONVENTION -->
</body>
</html>
`;
```

### 🎨 Modifier le Style Visual

#### Changer les Couleurs et Fonts

```css
/* REMPLACER dans la section <style> (ligne ~400) */

/* COULEURS PERSONNALISÉES */
:root {
  --primary-color: #1e40af;      /* Bleu par défaut */
  --secondary-color: #059669;    /* Vert */
  --accent-color: #dc2626;       /* Rouge */
  --text-color: #1f2937;         /* Gris foncé */
  --bg-color: #f9fafb;           /* Gris clair */
}

/* CHANGER POUR VOS COULEURS : */
:root {
  --primary-color: #7c3aed;      /* Violet */
  --secondary-color: #f59e0b;    /* Orange */
  --accent-color: #ef4444;       /* Rouge */
  --text-color: #111827;         /* Noir */
  --bg-color: #f3f4f6;           /* Gris */
}

body { 
    font-family: 'Georgia', 'Times New Roman', serif;  /* CHANGER LA POLICE */
    background-color: var(--bg-color);
    color: var(--text-color);
}

.header {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    /* AJOUTER VOS STYLES */
}

.logo { 
    font-family: 'Montserrat', sans-serif;  /* POLICE MODERNE */
    font-weight: 800;
    color: var(--primary-color);
}
```

#### Ajouter Votre Logo

```javascript
// REMPLACER la section header (ligne ~545)
<div class="header">
    <!-- AJOUTER VOTRE LOGO -->
    <img src="data:image/png;base64,VOTRE_LOGO_BASE64" alt="Logo École" style="height: 60px; margin-bottom: 10px;">
    
    <div class="logo">VOTRE ÉCOLE - NOM PERSONNALISÉ</div>
    <div class="logo">VOTRE CAMPUS - VILLE</div>
    <div class="title">Convention de Stage ${typeStage === 'initiation' ? 'd\\'Initiation' : typeStage === 'fin_annee' ? 'de Fin d\\'Année' : 'de Fin d\\'Études'}</div>
</div>
```

### 📝 Modifier le Contenu

#### Changer les Informations de l'École

```javascript
// LOCALISATION: Ligne ~545 - Section header
// REMPLACER :
<div class="logo">ÉCOLE NATIONALE SUPÉRIEURE DES ARTS ET MÉTIERS</div>
<div class="logo">ENSAM - RABAT</div>

// PAR :
<div class="logo">VOTRE ÉCOLE SUPÉRIEURE</div>
<div class="logo">VOTRE SIGLE - VOTRE VILLE</div>
```

#### Personnaliser les Sections

```javascript
// LOCALISATION: Ligne ~552 - Informations Étudiant
// AJOUTER DES CHAMPS :
<div class="section">
    <h3>Informations Étudiant</h3>
    <div class="field"><strong>Nom complet :</strong> ${student.nom}</div>
    <div class="field"><strong>Email :</strong> ${student.email}</div>
    <div class="field"><strong>Filière :</strong> ${student.filiere}</div>
    
    <!-- AJOUTER VOS CHAMPS PERSONNALISÉS -->
    <div class="field"><strong>Spécialisation :</strong> ${student.specialisation || 'Non définie'}</div>
    <div class="field"><strong>Mention :</strong> ${student.mention || 'Non définie'}</div>
    <div class="field"><strong>Tuteur pédagogique :</strong> ${student.tuteur || 'À définir'}</div>
</div>
```

#### Modifier les Objectifs de Stage

```javascript
// LOCALISATION: Ligne ~572 - Section objectifs
// REMPLACER par vos objectifs personnalisés :
<div class="info-box">
    <h4 style="margin-top: 0; color: var(--primary-color);">Objectifs du stage :</h4>
    <p style="margin: 5px 0;">
        ${typeStage === 'initiation' ? 
          'VOS OBJECTIFS POUR STAGE INITIATION - Découverte du milieu professionnel...' :
          typeStage === 'fin_annee' ?
          'VOS OBJECTIFS POUR STAGE FIN ANNÉE - Mise en application des compétences...' :
          'VOS OBJECTIFS POUR STAGE FIN ÉTUDES - Projet de fin d\\'études...'}
    </p>
    
    <!-- AJOUTER UNE LISTE D'OBJECTIFS SPÉCIFIQUES -->
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Objectif technique 1</li>
        <li>Objectif personnel 2</li>
        <li>Objectif professionnel 3</li>
    </ul>
</div>
```

#### Personnaliser le Footer

```javascript
// LOCALISATION: Ligne ~626 - Footer
// REMPLACER :
<div class="footer">
    <p>VOTRE ÉCOLE - VOTRE ADRESSE COMPLÈTE</p>
    <p>Tél. : VOTRE TÉLÉPHONE | Email : VOTRE EMAIL | Web : VOTRE SITE</p>
</div>
```

### 🏗️ Structure Modulaire Avancée

#### Créer un Template Externe

**1. Créer un fichier template :** `src/templates/convention-template.html`

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Convention de Stage - {{STUDENT_NAME}}</title>
    <style>
        {{CUSTOM_CSS}}
    </style>
</head>
<body>
    <div class="header">
        {{SCHOOL_HEADER}}
    </div>
    
    <div class="content">
        {{STUDENT_INFO}}
        {{STAGE_DETAILS}}
        {{COMPANY_INFO}}
        {{SIGNATURES}}
    </div>
    
    <div class="footer">
        {{SCHOOL_FOOTER}}
    </div>
</body>
</html>
```

**2. Modifier le backend pour utiliser le template :**

```javascript
// AJOUTER au début de backend-node.cjs
const fs = require('fs');
const path = require('path');

// FONCTION DE GÉNÉRATION AVEC TEMPLATE
function generateConventionFromTemplate(student, typeStage) {
  // Lire le template
  const templatePath = path.join(__dirname, 'src/templates/convention-template.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Définir les remplacements
  const replacements = {
    '{{STUDENT_NAME}}': student.nom,
    '{{CUSTOM_CSS}}': getCustomCSS(),
    '{{SCHOOL_HEADER}}': getSchoolHeader(),
    '{{STUDENT_INFO}}': getStudentInfo(student),
    '{{STAGE_DETAILS}}': getStageDetails(typeStage),
    '{{COMPANY_INFO}}': getCompanySection(),
    '{{SIGNATURES}}': getSignatureSection(),
    '{{SCHOOL_FOOTER}}': getSchoolFooter()
  };
  
  // Appliquer les remplacements
  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return template;
}

// FONCTIONS HELPER
function getCustomCSS() {
  return fs.readFileSync(path.join(__dirname, 'src/templates/convention-styles.css'), 'utf8');
}

function getSchoolHeader() {
  return `
    <div class="logo">VOTRE ÉCOLE</div>
    <div class="subtitle">VOTRE CAMPUS</div>
  `;
}

// ... autres fonctions helper
```

### ⚙️ Configuration Dynamique

#### Créer un fichier de configuration

**Créer :** `src/config/convention-config.json`

```json
{
  "school": {
    "name": "VOTRE ÉCOLE SUPÉRIEURE",
    "abbreviation": "VES",
    "city": "VOTRE VILLE",
    "address": "Votre adresse complète",
    "phone": "+212 X XX XX XX XX",
    "email": "contact@votre-ecole.ac.ma",
    "website": "www.votre-ecole.ac.ma",
    "logo_base64": "data:image/png;base64,..."
  },
  "stages": {
    "initiation": {
      "duration": "4 semaines",
      "objectives": "Découverte du milieu professionnel..."
    },
    "fin_annee": {
      "duration": "8 semaines", 
      "objectives": "Approfondissement des compétences..."
    },
    "fin_etudes": {
      "duration": "12 semaines",
      "objectives": "Projet de fin d'études..."
    }
  },
  "styles": {
    "primary_color": "#1e40af",
    "secondary_color": "#059669",
    "font_family": "Arial, sans-serif",
    "header_bg": "linear-gradient(135deg, #1e40af, #059669)"
  }
}
```

**Utiliser la configuration :**

```javascript
// Dans backend-node.cjs
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/config/convention-config.json'), 'utf8'));

// Dans la génération
const htmlContent = `
  <style>
    :root {
      --primary-color: ${config.styles.primary_color};
      --secondary-color: ${config.styles.secondary_color};
    }
    body { font-family: ${config.styles.font_family}; }
  </style>
  
  <div class="header">
    <div class="logo">${config.school.name}</div>
    <div class="logo">${config.school.abbreviation} - ${config.school.city}</div>
  </div>
`;
```

### 🎯 Résumé des Fichiers à Modifier

| Modification | Fichier | Ligne approx. |
|-------------|---------|---------------|
| **Import - Nouveaux formats** | `backend-node.cjs` | 241-324 |
| **Import - Accept types** | `StudentsManagement.tsx` | 310 |
| **Import - Mapping colonnes** | `backend-node.cjs` | 274-290 |
| **Template - Style CSS** | `backend-node.cjs` | 400-519 |
| **Template - Contenu HTML** | `backend-node.cjs` | 537-631 |
| **Template - Configuration** | `backend-node.cjs` | 372-644 |
| **Interface - Nouveaux champs** | `api.ts` | 10-23 |
| **Interface - Formulaires** | `StudentsManagement.tsx` | 199-434 |

### 🚀 Démarrage Rapide Personnalisation

1. **Pour changer le style :** Modifier les couleurs dans `backend-node.cjs` ligne 400
2. **Pour changer le contenu :** Modifier le HTML dans `backend-node.cjs` ligne 537
3. **Pour ajouter colonnes import :** Modifier `columnMapping` ligne 274
4. **Pour nouveaux formats :** Ajouter parseurs ligne 241
5. **Pour configuration externe :** Créer `convention-config.json` et modifier la logique de génération

Tous les changements prennent effet immédiatement après redémarrage du serveur ! 🎉