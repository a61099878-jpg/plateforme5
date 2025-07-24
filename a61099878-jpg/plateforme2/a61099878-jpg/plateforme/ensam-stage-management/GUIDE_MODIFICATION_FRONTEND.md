# 🎨 Guide Complet - Modification du Frontend (Interface Utilisateur)

## 📋 Structure des Pages Frontend

```
src/
├── pages/
│   ├── LoginPage.tsx           # Page de connexion
│   ├── admin/
│   │   ├── AdminDashboard.tsx      # Tableau de bord admin
│   │   ├── StudentsManagement.tsx  # Gestion étudiants
│   │   └── ConventionsManagement.tsx # Gestion conventions
│   └── student/
│       ├── StudentDashboard.tsx     # Tableau de bord étudiant
│       └── ConventionManagement.tsx # Gestion convention étudiant
├── components/
│   ├── Header.tsx              # En-tête navigation
│   └── ui/                     # Composants interface
└── App.tsx                     # Configuration routes
```

---

## 🔐 1. PAGE DE CONNEXION

### Fichier : `src/pages/LoginPage.tsx`

#### Modifier les Titres et Textes

```typescript
// LOCALISATION: Ligne 85-95
// CHANGER LE TITRE PRINCIPAL
<h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
  VOTRE PLATEFORME PERSONNALISÉE  {/* REMPLACER */}
</h1>
<p className="text-center text-gray-600 mb-8">
  Votre slogan ou description personnalisée  {/* REMPLACER */}
</p>

// LOCALISATION: Ligne 120-125
// CHANGER LES LABELS DES CHAMPS
<Label htmlFor="email">Votre Email Institutionnel</Label>  {/* PERSONNALISER */}
<Label htmlFor="password">Votre Mot de Passe</Label>       {/* PERSONNALISER */}

// LOCALISATION: Ligne 140-145
// CHANGER LES TEXTES DES BOUTONS
<Button type="submit" className="w-full" disabled={loginMutation.isPending}>
  {loginMutation.isPending ? 'Connexion...' : 'Se Connecter à la Plateforme'}  {/* PERSONNALISER */}
</Button>

// LOCALISATION: Ligne 165-170
// CHANGER LE TEXTE DE CRÉATION DE COMPTE
<p className="text-center text-sm text-gray-600">
  Pas encore de compte ? {' '}
  <button onClick={() => setIsRegisterMode(true)} className="text-primary hover:underline">
    Créer mon compte étudiant  {/* PERSONNALISER */}
  </button>
</p>
```

#### Modifier les Rôles Affichés

```typescript
// LOCALISATION: Ligne 105-115
// CHANGER LES OPTIONS DE RÔLE
<Select value={role} onValueChange={setRole}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner votre statut" />  {/* PERSONNALISER */}
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">👨‍💼 Administration Académique</SelectItem>     {/* PERSONNALISER */}
    <SelectItem value="student">🎓 Étudiant(e) de l'École</SelectItem>      {/* PERSONNALISER */}
  </SelectContent>
</Select>
```

#### Ajouter Votre Logo

```typescript
// LOCALISATION: Ligne 80 - AJOUTER AVANT LE TITRE
<div className="flex justify-center mb-6">
  <img 
    src="/path/to/your/logo.png" 
    alt="Logo École" 
    className="h-16 w-auto"
  />
</div>
```

---

## 👨‍💼 2. TABLEAU DE BORD ADMIN

### Fichier : `src/pages/admin/AdminDashboard.tsx`

#### Modifier le Titre et Description

```typescript
// LOCALISATION: Ligne 45-50
<div>
  <h1 className="text-3xl font-bold text-gray-900">
    Tableau de Bord Administratif  {/* PERSONNALISER */}
  </h1>
  <p className="text-gray-600">
    Gestion centralisée de votre établissement  {/* PERSONNALISER */}
  </p>
</div>
```

#### Personnaliser les Cartes Statistiques

```typescript
// LOCALISATION: Ligne 60-85
// CARTE ÉTUDIANTS
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Total Apprenants  {/* CHANGER "Étudiants" */}
    </CardTitle>
    <Users className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{stats.totalStudents}</div>
    <p className="text-xs text-muted-foreground">
      Dans votre établissement  {/* PERSONNALISER */}
    </p>
  </CardContent>
</Card>

// CARTE INSCRITS
<CardTitle className="text-sm font-medium">
  Comptes Actifs  {/* CHANGER "Inscrits" */}
</CardTitle>

// CARTE CONVENTIONS
<CardTitle className="text-sm font-medium">
  Stages en Cours  {/* CHANGER "Conventions" */}
</CardTitle>
```

#### Modifier les Actions Rapides

```typescript
// LOCALISATION: Ligne 120-140
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="cursor-pointer hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold">Gérer les Apprenants</h3>  {/* PERSONNALISER */}
          <p className="text-sm text-gray-600">
            Ajouter, modifier ou importer la base d'apprenants  {/* PERSONNALISER */}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>

  <Card className="cursor-pointer hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <FileText className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold">Valider les Stages</h3>     {/* PERSONNALISER */}
          <p className="text-sm text-gray-600">
            Examiner et approuver les conventions de stage  {/* PERSONNALISER */}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 🎓 3. GESTION DES ÉTUDIANTS (ADMIN)

### Fichier : `src/pages/admin/StudentsManagement.tsx`

#### Modifier les Titres

```typescript
// LOCALISATION: Ligne 172-175
<h1 className="text-3xl font-bold text-gray-900">
  Gestion des Apprenants  {/* CHANGER */}
</h1>
<p className="text-gray-600">
  Base de données des étudiants de votre établissement  {/* PERSONNALISER */}
</p>
```

#### Personnaliser les Boutons d'Action

```typescript
// LOCALISATION: Ligne 177-190
<Button onClick={handleExport} variant="outline">
  <Download className="h-4 w-4 mr-2" />
  Exporter la Base  {/* PERSONNALISER */}
</Button>
<Button onClick={() => fileInputRef.current?.click()} variant="outline">
  <Upload className="h-4 w-4 mr-2" />
  Importer des Apprenants  {/* PERSONNALISER */}
</Button>
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Nouvel Apprenant  {/* PERSONNALISER */}
</Button>
```

#### Modifier les Labels des Cartes

```typescript
// LOCALISATION: Ligne 317-342
<CardTitle className="text-sm font-medium">
  Total Apprenants  {/* CHANGER */}
</CardTitle>

<CardTitle className="text-sm font-medium">
  Comptes Activés  {/* CHANGER "Comptes Créés" */}
</CardTitle>

<CardTitle className="text-sm font-medium">
  En Attente d'Activation  {/* CHANGER "Non Inscrits" */}
</CardTitle>
```

#### Personnaliser le Formulaire d'Ajout

```typescript
// LOCALISATION: Ligne 192-210
<DialogTitle>Ajouter un Nouvel Apprenant</DialogTitle>  {/* PERSONNALISER */}
<DialogDescription>
  Saisissez les informations de l'apprenant dans votre système  {/* PERSONNALISER */}
</DialogDescription>

// LOCALISATION: Ligne 200-265 - LABELS DES CHAMPS
<Label htmlFor="nom">Nom et Prénom</Label>                    {/* PERSONNALISER */}
<Label htmlFor="email">Adresse Email Institutionnelle</Label>  {/* PERSONNALISER */}
<Label htmlFor="telephone">Numéro de Téléphone</Label>        {/* PERSONNALISER */}
<Label htmlFor="filiere">Filière d'Études</Label>             {/* PERSONNALISER */}
<Label htmlFor="annee">Niveau d'Études</Label>                {/* PERSONNALISER */}
<Label htmlFor="codeApogee">Code Apogée</Label>               {/* PERSONNALISER */}
<Label htmlFor="cne">CNE (Code National Étudiant)</Label>     {/* PERSONNALISER */}
<Label htmlFor="cin">CIN (Carte d'Identité)</Label>          {/* PERSONNALISER */}
<Label htmlFor="dateNaissance">Date de Naissance</Label>      {/* PERSONNALISER */}
```

#### Modifier les Options de Filières

```typescript
// LOCALISATION: Ligne 234-242
<SelectContent>
  <SelectItem value="Génie Informatique">Informatique et Réseaux</SelectItem>      {/* PERSONNALISER */}
  <SelectItem value="Génie Mécanique">Mécanique et Automatisation</SelectItem>     {/* PERSONNALISER */}
  <SelectItem value="Génie Électrique">Électronique et Électrotechnique</SelectItem> {/* PERSONNALISER */}
  <SelectItem value="Génie Civil">Bâtiment et Travaux Publics</SelectItem>         {/* PERSONNALISER */}
  <SelectItem value="Génie Industriel">Management et Qualité</SelectItem>          {/* PERSONNALISER */}
  <SelectItem value="Commerce International">Commerce et Marketing</SelectItem>     {/* AJOUTER */}
</SelectContent>
```

#### Personnaliser les En-têtes de Tableau

```typescript
// LOCALISATION: Ligne 384-392
<TableHeader>
  <TableRow>
    <TableHead>Identité</TableHead>           {/* CHANGER "Nom" */}
    <TableHead>Contact</TableHead>            {/* CHANGER "Email" */}
    <TableHead>Formation</TableHead>          {/* CHANGER "Filière" */}
    <TableHead>Niveau</TableHead>             {/* CHANGER "Année" */}
    <TableHead>Référence</TableHead>          {/* CHANGER "Code Apogée" */}
    <TableHead>Statut Compte</TableHead>      {/* CHANGER "Statut" */}
    <TableHead>Actions</TableHead>
  </TableRow>
</TableHeader>
```

---

## 📄 4. GESTION DES CONVENTIONS (ADMIN)

### Fichier : `src/pages/admin/ConventionsManagement.tsx`

#### Modifier les Titres

```typescript
// LOCALISATION: Ligne 154-157
<h1 className="text-3xl font-bold text-gray-900">
  Validation des Stages  {/* CHANGER */}
</h1>
<p className="text-gray-600">
  Examiner et approuver les demandes de stage  {/* PERSONNALISER */}
</p>
```

#### Personnaliser les Cartes Statistiques

```typescript
// LOCALISATION: Ligne 161-205
<CardTitle className="text-sm font-medium">Total Demandes</CardTitle>        {/* CHANGER "Total" */}
<CardTitle className="text-sm font-medium">En Révision</CardTitle>           {/* CHANGER "En attente" */}
<CardTitle className="text-sm font-medium">Reçues</CardTitle>                {/* CHANGER "Envoyées" */}
<CardTitle className="text-sm font-medium">Approuvées</CardTitle>            {/* CHANGER "Validées" */}
<CardTitle className="text-sm font-medium">Refusées</CardTitle>              {/* CHANGER "Rejetées" */}
```

#### Modifier les Labels des Colonnes

```typescript
// LOCALISATION: Ligne 256-265
<TableHeader>
  <TableRow>
    <TableHead>Apprenant</TableHead>                  {/* CHANGER "Étudiant" */}
    <TableHead>Type de Formation Pratique</TableHead> {/* CHANGER "Type de Stage" */}
    <TableHead>Parcours</TableHead>                   {/* CHANGER "Filière" */}
    <TableHead>Date de Création</TableHead>           {/* CHANGER "Date de génération" */}
    <TableHead>Date de Réception</TableHead>          {/* CHANGER "Date de soumission" */}
    <TableHead>État</TableHead>                       {/* CHANGER "Statut" */}
    <TableHead>Actions</TableHead>
  </TableRow>
</TableHeader>
```

#### Personnaliser les Types de Stage

```typescript
// LOCALISATION: Ligne 122-133
const getTypeStageLabel = (typeStage: string) => {
  switch (typeStage) {
    case 'initiation':
      return 'Formation Pratique de Base (1ère année)';      {/* PERSONNALISER */}
    case 'fin_annee':
      return 'Stage Professionnel (2ème année)';            {/* PERSONNALISER */}
    case 'fin_etudes':
      return 'Projet de Fin d\'Études (3ème année)';        {/* PERSONNALISER */}
    default:
      return typeStage;
  }
};
```

---

## 🎓 5. TABLEAU DE BORD ÉTUDIANT

### Fichier : `src/pages/student/StudentDashboard.tsx`

#### Modifier les Messages de Bienvenue

```typescript
// LOCALISATION: Ligne 40-50
<h1 className="text-3xl font-bold text-gray-900">
  Bienvenue sur votre Espace Personnel  {/* PERSONNALISER */}
</h1>
<p className="text-gray-600">
  Gérez votre parcours de formation pratique  {/* PERSONNALISER */}
</p>

// MESSAGE DE BIENVENUE PERSONNALISÉ
<div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
  <h2 className="text-xl font-bold mb-2">
    Bonjour {student.nom} ! 👋
  </h2>
  <p>
    Votre formation en {student.filiere} - Niveau {student.annee}
    <br />
    Préparez votre expérience professionnelle avec notre plateforme  {/* PERSONNALISER */}
  </p>
</div>
```

#### Personnaliser les Cartes d'Information

```typescript
// LOCALISATION: Ligne 60-90
<Card>
  <CardHeader>
    <CardTitle className="flex items-center space-x-2">
      <User className="h-5 w-5" />
      <span>Mon Profil Apprenant</span>  {/* PERSONNALISER */}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <p><strong>Formation :</strong> {student.filiere}</p>
      <p><strong>Niveau d'études :</strong> {student.annee}ème année</p>
      <p><strong>Référence :</strong> {student.codeApogee}</p>
      <p><strong>Statut :</strong> 
        <Badge variant="outline" className="ml-2">
          Apprenant Actif  {/* PERSONNALISER */}
        </Badge>
      </p>
    </div>
  </CardContent>
</Card>
```

---

## 📋 6. GESTION DE CONVENTION (ÉTUDIANT)

### Fichier : `src/pages/student/ConventionManagement.tsx`

#### Modifier le Titre Principal

```typescript
// LOCALISATION: Ligne 204-208
<h1 className="text-3xl font-bold text-gray-900">
  Ma Formation Pratique  {/* CHANGER "Ma Convention de Stage" */}
</h1>
<p className="text-gray-600">
  {getStageLabel(student.annee)} - Formation {student.filiere}  {/* PERSONNALISER */}
</p>
```

#### Personnaliser le Bouton de Génération

```typescript
// LOCALISATION: Ligne 216-228
<Button 
  onClick={handleGenerateConvention}
  disabled={generateConventionMutation.isPending}
  size="lg"
  className="bg-primary hover:bg-primary/90"
>
  {generateConventionMutation.isPending ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      Préparation...
    </>
  ) : (
    <>
      <FileText className="h-5 w-5 mr-2" />
      Générer ma Convention (PDF)  {/* PERSONNALISER */}
    </>
  )}
</Button>
```

#### Modifier les Labels des Types de Stage

```typescript
// LOCALISATION: Ligne 97-108
const getStageLabel = (annee: number) => {
  switch (annee) {
    case 1:
      return 'Formation Pratique Initiale (1ère année)';     {/* PERSONNALISER */}
    case 2:
      return 'Stage d\'Application (2ème année)';            {/* PERSONNALISER */}
    case 3:
      return 'Projet Professionnel (3ème année)';           {/* PERSONNALISER */}
    default:
      return 'Formation Pratique';
  }
};
```

#### Personnaliser les Instructions

```typescript
// LOCALISATION: Ligne 474-494
<h4 className="font-medium mb-3">Étapes de votre parcours :</h4>  {/* PERSONNALISER */}
<div className="space-y-3">
  <div className="flex items-start space-x-3">
    <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
      <span className="text-primary font-bold text-xs">1</span>
    </div>
    <div>
      <p className="text-sm font-medium">Créer votre convention</p>  {/* PERSONNALISER */}
      <p className="text-xs text-gray-600">
        Générez automatiquement votre document personnalisé  {/* PERSONNALISER */}
      </p>
    </div>
  </div>
  
  <div className="flex items-start space-x-3">
    <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
      <span className="text-primary font-bold text-xs">2</span>
    </div>
    <div>
      <p className="text-sm font-medium">Finaliser avec l'entreprise</p>  {/* PERSONNALISER */}
      <p className="text-xs text-gray-600">
        Faites signer par votre organisme d'accueil  {/* PERSONNALISER */}
      </p>
    </div>
  </div>
</div>
```

---

## 🧭 7. NAVIGATION (HEADER)

### Fichier : `src/components/Header.tsx`

#### Modifier le Logo et Titre

```typescript
// LOCALISATION: Ligne 20-30
<div className="flex items-center space-x-3">
  {/* AJOUTER VOTRE LOGO */}
  <img src="/your-logo.png" alt="Logo" className="h-8 w-8" />
  <h1 className="text-xl font-bold text-white">
    VOTRE PLATEFORME  {/* PERSONNALISER */}
  </h1>
</div>
```

#### Personnaliser les Liens de Navigation

```typescript
// LOCALISATION: Ligne 35-55
{user.role === 'admin' && (
  <nav className="flex space-x-4">
    <Link to="/admin/dashboard" className="text-white hover:text-gray-300">
      🏠 Accueil  {/* PERSONNALISER */}
    </Link>
    <Link to="/admin/students" className="text-white hover:text-gray-300">
      👥 Apprenants  {/* CHANGER "Étudiants" */}
    </Link>
    <Link to="/admin/conventions" className="text-white hover:text-gray-300">
      📋 Validations  {/* CHANGER "Conventions" */}
    </Link>
  </nav>
)}

{user.role === 'student' && (
  <nav className="flex space-x-4">
    <Link to="/student/dashboard" className="text-white hover:text-gray-300">
      🏠 Mon Espace  {/* PERSONNALISER */}
    </Link>
    <Link to="/student/convention" className="text-white hover:text-gray-300">
      📄 Ma Formation  {/* CHANGER "Convention" */}
    </Link>
  </nav>
)}
```

---

## 🎨 8. STYLES GLOBAUX

### Fichier : `src/index.css`

#### Personnaliser les Couleurs

```css
/* LOCALISATION: Début du fichier */
/* VARIABLES CSS PERSONNALISÉES */
:root {
  --primary: 210 40% 50%;          /* Bleu principal */
  --secondary: 142 76% 36%;        /* Vert secondaire */
  --accent: 346 77% 50%;           /* Rouge accent */
  --background: 0 0% 100%;         /* Blanc background */
  --foreground: 224 71% 4%;        /* Texte principal */
}

/* CHANGER POUR VOS COULEURS */
:root {
  --primary: 259 94% 51%;          /* Violet */
  --secondary: 32 95% 44%;         /* Orange */
  --accent: 348 83% 47%;           /* Rouge foncé */
  --background: 240 10% 3.9%;      /* Sombre */
  --foreground: 0 0% 98%;          /* Blanc cassé */
}
```

#### Ajouter des Styles Personnalisés

```css
/* AJOUTER À LA FIN DU FICHIER */

/* STYLES PERSONNALISÉS POUR VOTRE ÉCOLE */
.school-brand {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
}

.student-card {
  border-left: 4px solid hsl(var(--primary));
  background: linear-gradient(to right, transparent, hsl(var(--primary) / 0.1));
}

.admin-card {
  border-left: 4px solid hsl(var(--secondary));
  background: linear-gradient(to right, transparent, hsl(var(--secondary) / 0.1));
}

/* ANIMATIONS PERSONNALISÉES */
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🔧 9. CONFIGURATION DES ROUTES

### Fichier : `src/App.tsx`

#### Personnaliser les URLs

```typescript
// LOCALISATION: Ligne 45-72
{/* CHANGER LES URLS SI NÉCESSAIRE */}
<Route path="/admin/dashboard" element={
  <ProtectedRoute role="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
<Route path="/admin/apprenants" element={    {/* CHANGER "students" */}
  <ProtectedRoute role="admin">
    <StudentsManagement />
  </ProtectedRoute>
} />
<Route path="/admin/validations" element={   {/* CHANGER "conventions" */}
  <ProtectedRoute role="admin">
    <ConventionsManagement />
  </ProtectedRoute>
} />

<Route path="/etudiant/dashboard" element={  {/* CHANGER "student" */}
  <ProtectedRoute role="student">
    <StudentDashboard />
  </ProtectedRoute>
} />
<Route path="/etudiant/stage" element={      {/* CHANGER "convention" */}
  <ProtectedRoute role="student">
    <ConventionManagement />
  </ProtectedRoute>
} />
```

---

## 📊 TABLEAU RÉCAPITULATIF DES MODIFICATIONS

| Page/Composant | Fichier | Éléments Modifiables |
|----------------|---------|---------------------|
| **Page Connexion** | `LoginPage.tsx` | Titres, labels, boutons, rôles, logo |
| **Dashboard Admin** | `AdminDashboard.tsx` | Titre, cartes stats, actions rapides |
| **Gestion Étudiants** | `StudentsManagement.tsx` | Boutons, formulaires, tableaux, filières |
| **Gestion Conventions** | `ConventionsManagement.tsx` | Titres, colonnes, types stage, stats |
| **Dashboard Étudiant** | `StudentDashboard.tsx` | Messages, cartes profil, informations |
| **Convention Étudiant** | `ConventionManagement.tsx` | Boutons, instructions, labels stage |
| **Navigation** | `Header.tsx` | Logo, titre, liens navigation |
| **Styles Globaux** | `index.css` | Couleurs, polices, animations |
| **Routes** | `App.tsx` | URLs des pages |

---

## 🚀 MODIFICATIONS RAPIDES - CHECKLIST

### ✅ Pour une Personnalisation Basique (30 min)

1. **Changer le nom de l'école** - `LoginPage.tsx` ligne 85
2. **Modifier les couleurs** - `index.css` début du fichier  
3. **Ajouter votre logo** - `Header.tsx` ligne 20
4. **Personnaliser les titres** - Chaque fichier page, première section
5. **Adapter les filières** - `StudentsManagement.tsx` ligne 234

### ✅ Pour une Personnalisation Complète (2h)

1. **Tous les textes et labels** - Suivre ce guide section par section
2. **Couleurs et styles** - `index.css` + ajout classes personnalisées
3. **Types de stages** - `ConventionsManagement.tsx` + `ConventionManagement.tsx`
4. **URLs et navigation** - `App.tsx` + `Header.tsx`
5. **Messages personnalisés** - Chaque page selon besoins

### 🎯 Exemple de Modification Complète

```typescript
// AVANT (ENSAM)
<h1>Gestion des Étudiants</h1>
<SelectItem value="Génie Mécanique">Génie Mécanique</SelectItem>
<Label>Stage d'Initiation</Label>

// APRÈS (École de Commerce)
<h1>Gestion des Apprenants</h1>
<SelectItem value="Commerce International">Commerce International</SelectItem>
<Label>Formation Pratique Commerciale</Label>
```

Avec ce guide, vous pouvez transformer complètement l'interface pour qu'elle corresponde à votre établissement ! 🎨✨