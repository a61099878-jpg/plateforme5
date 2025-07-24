# 🚀 Guide de Test Rapide - Plateforme ENSAM

## Démarrage Immédiat

```bash
cd ensam-stage-management
npm run dev
```

L'application démarre sur : http://localhost:5173
Le backend démarre sur : http://localhost:3001

## 👨‍💼 Test Admin

### Connexion Admin
- URL: http://localhost:5173/login
- Email: `admin@ensam.ac.ma`
- Password: `AdminENSAM2024!`

### ✅ Test 1: Import d'étudiants
1. **Gestion Étudiants** → **Importer**
2. Sélectionner `test_etudiants_import.csv`
3. **Vérifier** : 5 étudiants importés ✅
4. **Vérifier** : Compteurs mis à jour (5 non inscrits) ✅

### ✅ Test 2: Créer un étudiant manuellement
1. **Ajouter un étudiant**
2. Remplir les champs
3. **Vérifier** : Statut "Non inscrit" affiché ✅
4. **Vérifier** : Compteurs mis à jour ✅

### ✅ Test 3: Supprimer un étudiant
1. Cliquer sur la poubelle d'un étudiant
2. Confirmer la suppression
3. **Vérifier** : Pas d'erreur réseau ✅
4. **Vérifier** : Compteurs mis à jour ✅

## 👨‍🎓 Test Étudiant

### Créer un compte étudiant
1. Se déconnecter de l'admin
2. Aller sur `/login`
3. Cliquer "Créer un compte"
4. Utiliser un email importé : `ahmed.benali@ensam.ac.ma`
5. Créer mot de passe : `Password123!`

### ✅ Test 4: Convention côté étudiant
1. **Générer Convention** ✅
2. **Vérifier** : PDF s'ouvre dans nouvel onglet ✅
3. **Uploader** un fichier PDF/image ✅
4. **Vérifier** : Statut "Envoyée" affiché ✅

## 👨‍💼 Test Validation Admin

### ✅ Test 5: Valider/Rejeter convention
1. Retour admin → **Gestion des Conventions**
2. **Vérifier** : Convention apparaît avec dates ✅
3. Cliquer l'œil → Changer statut → Ajouter notes
4. **Télécharger** le fichier uploadé ✅
5. Retour côté étudiant
6. **Vérifier** : Statut et notes affichés ✅

## 📊 Vérifications Finales

### Compteurs Admin
- ✅ Total étudiants
- ✅ Inscrits vs Non inscrits  
- ✅ Total conventions
- ✅ Statuts conventions

### Dates et Affichage
- ✅ Date génération convention
- ✅ Date soumission  
- ✅ Date validation/rejet
- ✅ Type de stage affiché

### Fonctionnalités Upload
- ✅ Admin peut télécharger fichiers
- ✅ Validation types fichiers
- ✅ Taille max 10MB

## 🔧 Problèmes Résolus

| Problème Original | Status |
|------------------|--------|
| Statut inscription non affiché | ✅ RÉSOLU |
| Erreur suppression étudiant | ✅ RÉSOLU |
| Import échoue | ✅ RÉSOLU |
| Dates non affichées | ✅ RÉSOLU |
| Pas de téléchargement admin | ✅ RÉSOLU |
| Statut étudiant invisible | ✅ RÉSOLU |

## 🎯 Test en 2 Minutes

```bash
# 1. Démarrer l'app
npm run dev

# 2. Admin: Importer test_etudiants_import.csv
# 3. Créer compte étudiant avec ahmed.benali@ensam.ac.ma
# 4. Générer + uploader convention
# 5. Admin: valider convention
# 6. Étudiant: voir statut validé
```

## 📱 Données de Test

**Fichier CSV fourni:** `test_etudiants_import.csv`
- Ahmed Benali - Génie Mécanique
- Fatima Zahr - Génie Électrique  
- Mohamed Alami - Génie Civil
- Sarah Ouali - Génie Industriel
- Youssef Tazi - Génie Informatique

**Admin par défaut:**
- Email: admin@ensam.ac.ma
- Password: AdminENSAM2024!

## 🆘 En cas de problème

1. **Vérifier les logs console du navigateur**
2. **Vérifier les logs du terminal backend**
3. **Redémarrer l'application**
4. **Vérifier que le fichier `ensam_stages.db` existe**
5. **Vérifier que le dossier `uploads/` existe**

La base de données est persistante - les données restent après redémarrage ! 🎉