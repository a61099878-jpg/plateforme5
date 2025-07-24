# Plateforme Web de Gestion des Stages - ENSAM Rabat

Cette application web permet de **gérer le processus de stage des étudiants** de l'ENSAM Rabat, en facilitant les interactions entre les **étudiants** et l'**administration**.

## 🎯 Fonctionnalités

### Pour l'Administration
- ✅ Connexion sécurisée avec mot de passe complexe
- ✅ Import et sauvegarde persistante d'une base d'étudiants (Excel/CSV)
- ✅ Gestion complète des étudiants (ajout, édition, suppression)
- ✅ Visualisation des conventions reçues, triées par statut
- ✅ Téléchargement et archivage des conventions signées
- ✅ Tableau de bord avec statistiques détaillées

### Pour les Étudiants
- ✅ Création de compte avec email institutionnel
- ✅ Connexion sécurisée (avec vérification dans la base de données)
- ✅ Génération automatique de convention PDF personnalisée selon la filière/année/type de stage
- ✅ Upload du fichier signé (PDF ou image)
- ✅ Suivi du statut de sa convention en temps réel

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ et Bun
- Navigateur web moderne

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd ensam-stage-management

# Installer les dépendances
bun install

# Initialiser la base de données
bunx drizzle-kit push

# Démarrer l'application en mode développement
bun dev
```

L'application sera accessible sur `http://localhost:3000`

### Compte Admin par Défaut
- **Email**: `admin@ensam.ac.ma`
- **Mot de passe**: `AdminENSAM2024!`

## 📋 Données Étudiantes Enregistrées

Les informations suivantes sont stockées pour chaque étudiant :
- Nom complet, Email, Téléphone
- Filière, Année d'études
- Code Apogée, CNE, CIN, Date de naissance
- Statut d'inscription (compte créé ou non)

## 🎨 Personnalisation des Conventions de Stage

### Templates HTML Modifiables

Les conventions de stage sont générées à partir de templates HTML situés dans le dossier `src/templates/` :

- `convention_default.html` - Template par défaut pour tous types de stages
- `convention_initiation.html` - Template spécialisé pour les stages d'initiation (1ère année)
- `convention_fin_annee.html` - Template spécialisé pour les stages de fin d'année (2ème année)
- `convention_fin_etudes.html` - Template spécialisé pour les stages de fin d'études (3ème année)

### Variables Disponibles dans les Templates

Les templates utilisent un système de variables qui sont automatiquement remplacées lors de la génération :

#### Informations Étudiant
- `{{studentNom}}` - Nom complet de l'étudiant
- `{{studentEmail}}` - Email de l'étudiant
- `{{studentTelephone}}` - Téléphone de l'étudiant
- `{{studentFiliere}}` - Filière d'études
- `{{studentAnnee}}` - Année d'études (1, 2, ou 3)
- `{{studentCodeApogee}}` - Code Apogée
- `{{studentCne}}` - CNE de l'étudiant
- `{{studentCin}}` - CIN de l'étudiant
- `{{studentDateNaissance}}` - Date de naissance

#### Informations Stage
- `{{typeStageTitle}}` - Titre du type de stage (ex: "Stage d'Initiation")
- `{{dateGeneration}}` - Date de génération de la convention
- `{{stageObjectifs}}` - Objectifs du stage (contenu HTML)
- `{{stageDuree}}` - Durée et période du stage (contenu HTML)
- `{{stageEncadrement}}` - Modalités d'encadrement (contenu HTML)
- `{{stageEvaluation}}` - Modalités d'évaluation (contenu HTML)

### Étapes pour Personnaliser une Convention

1. **Identifier le type de stage à modifier** :
   - 1ère année : `convention_initiation.html`
   - 2ème année : `convention_fin_annee.html`
   - 3ème année : `convention_fin_etudes.html`
   - Ou modifier le template par défaut : `convention_default.html`

2. **Éditer le fichier HTML** :
   ```bash
   # Ouvrir le template dans votre éditeur préféré
   nano src/templates/convention_initiation.html
   ```

3. **Personnaliser le contenu** :
   - Modifier les textes, titres, et sections
   - Ajuster les styles CSS dans la balise `<style>`
   - Ajouter ou supprimer des sections
   - Changer les logos et informations de l'école

4. **Utiliser les variables** :
   ```html
   <!-- Exemple d'utilisation des variables -->
   <h2>Convention de Stage - {{typeStageTitle}}</h2>
   <p>Étudiant : {{studentNom}} ({{studentEmail}})</p>
   <p>Filière : {{studentFiliere}} - {{studentAnnee}}ème année</p>
   ```

5. **Redémarrer l'application** :
   ```bash
   # Redémarrer pour prendre en compte les modifications
   bun dev
   ```

### Exemple de Personnalisation

Pour modifier le logo et les informations de l'école dans le header :

```html
<!-- Dans le fichier template -->
<div class="header">
    <div class="logo">VOTRE ÉCOLE</div>
    <div class="subtitle">VOTRE VILLE</div>
    <div class="university-info">
        Votre adresse<br>
        Tél: +212 X XX XX XX XX | Email: contact@votre-ecole.ma
    </div>
    <div class="title">Convention de {{typeStageTitle}}</div>
</div>
```

### Contenu Dynamique par Type de Stage

Le système génère automatiquement des contenus différents selon le type de stage :

- **Stage d'Initiation** : Focus sur la découverte professionnelle
- **Stage de Fin d'Année** : Accent sur l'approfondissement technique
- **Stage de Fin d'Études** : Orientation projet d'ingénieur complet

Ces contenus sont définis dans `src/backend/services/pdf.ts` dans la fonction `getStageContent()`.

## 📊 Types de Stages

Le système gère automatiquement trois types de stages selon l'année :

1. **1ère année** : Stage d'Initiation (4-6 semaines)
2. **2ème année** : Stage de Fin d'Année (6-8 semaines)  
3. **3ème année** : Stage de Fin d'Études (4-6 mois)

## 📁 Structure du Projet

```
ensam-stage-management/
├── src/
│   ├── components/          # Composants React réutilisables
│   ├── pages/              # Pages de l'application
│   │   ├── admin/          # Pages administration
│   │   └── student/        # Pages étudiants
│   ├── contexts/           # Contextes React (authentification)
│   ├── lib/                # Utilitaires et API client
│   ├── backend/            # Backend avec Hono
│   │   ├── db/             # Base de données et schémas
│   │   └── services/       # Services (auth, PDF, import)
│   └── templates/          # Templates HTML pour les PDFs
├── uploads/                # Fichiers uploadés par les étudiants
├── ensam_stages.db         # Base de données SQLite
└── drizzle/               # Migrations de base de données
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` pour personnaliser :

```env
JWT_SECRET=votre-clé-secrète-jwt
PORT=3000
```

### Formats d'Import Supportés

Pour importer la base d'étudiants :
- **CSV** : Fichiers séparés par virgules
- **Excel** : Fichiers .xlsx et .xls

### Colonnes Attendues pour l'Import

Le système reconnaît automatiquement ces colonnes (insensible à la casse) :
- `nom` / `name` / `prénom` / `nom complet`
- `email` / `e-mail` / `mail`
- `téléphone` / `telephone` / `tel` / `phone`
- `filière` / `filiere` / `branch`
- `année` / `annee` / `year` / `niveau`
- `code apogée` / `code_apogee` / `apogee`
- `cne`
- `cin`
- `date naissance` / `date_naissance` / `birth_date`

## 📱 Utilisation

### Pour l'Administration

1. **Connexion** : Utilisez les identifiants admin par défaut
2. **Import d'étudiants** : Uploadez votre fichier CSV/Excel depuis la page "Étudiants"
3. **Gestion** : Ajoutez, modifiez ou supprimez des étudiants
4. **Conventions** : Visualisez et validez les conventions soumises
5. **Export** : Téléchargez la base d'étudiants mise à jour

### Pour les Étudiants

1. **Création de compte** : Utilisez votre email institutionnel ENSAM
2. **Connexion** : Connectez-vous avec vos identifiants
3. **Génération** : Générez votre convention personnalisée
4. **Signature** : Imprimez, signez et faites signer par l'organisme
5. **Upload** : Téléchargez la convention signée (PDF ou image)
6. **Suivi** : Suivez le statut de validation en temps réel

## 🛡️ Sécurité

- Authentification JWT sécurisée
- Validation des emails institutionnels (@ensam.ac.ma)
- Protection des routes par rôle (admin/étudiant)
- Chiffrement des mots de passe avec bcrypt
- Validation des fichiers uploadés (taille et format)

## 🔄 Sauvegarde et Persistance

- **Base de données SQLite** : Données persistantes même après redémarrage
- **Fichiers uploadés** : Stockés dans le dossier `uploads/`
- **Export automatique** : Possibilité d'exporter la base à tout moment
- **Migrations** : Système de migrations pour les mises à jour

## 📞 Support

Pour toute question ou problème :
- Consultez les logs de l'application
- Vérifiez les formats de fichiers pour l'import
- Assurez-vous que les emails sont au format ENSAM (@ensam.ac.ma)

## 🔮 Améliorations Futures

- Notifications par email
- Interface mobile dédiée
- Intégration avec des systèmes externes
- Rapports et analytics avancés
- API REST publique

---

**© 2024 ENSAM Rabat - Plateforme de Gestion des Stages**