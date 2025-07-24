# 🚀 Démarrage Rapide - Plateforme ENSAM Stages

## ✅ Problèmes résolus

1. **Erreur réseau** ❌ ➜ ✅ Backend fonctionnel
2. **Import admin non persistant** ❌ ➜ ✅ Import CSV opérationnel 
3. **Espace étudiant en chargement infini** ❌ ➜ ✅ Dashboard étudiant fonctionnel

---

## 🏁 Démarrage en 3 commandes

```bash
cd ensam-stage-management
npm install
npm run dev
```

**C'est tout !** 🎉

---

## 📊 Accès à l'application

- **Frontend :** http://localhost:5173
- **Backend API :** http://localhost:3001

### 👨‍💼 Connexion Admin
- **Email :** `admin@ensam.ac.ma`
- **Mot de passe :** `AdminENSAM2024!`

### 🎓 Connexion Étudiant
1. L'admin doit d'abord importer la base CSV
2. L'étudiant crée son compte avec son email de la base
3. L'étudiant se connecte avec ses identifiants

---

## 📁 Test d'import immédiat

1. Se connecter comme **admin**
2. Aller dans **"Gestion des Étudiants"**
3. Cliquer **"Importer"**
4. Sélectionner `exemple_etudiants.csv`
5. ✅ **Import réussi et données persistantes !**

---

## 🔧 Architecture technique

- **Frontend :** React 19 + Vite + Tailwind + ShadCN
- **Backend :** Node.js + Hono + SQLite
- **Base de données :** `ensam_stages.db` (auto-créée)
- **Authentification :** bcrypt + JWT simplifié

---

## 📋 Fonctionnalités confirmées

### 👨‍💼 Admin
- [x] Import/Export CSV avec persistance
- [x] Gestion CRUD étudiants
- [x] Visualisation conventions par statut
- [x] Validation/rejet conventions

### 🎓 Étudiant
- [x] Création compte (si email dans base)
- [x] **Génération convention HTML personnalisée** 🆕
- [x] **Conversion HTML vers PDF** (via navigateur)
- [x] Upload convention signée
- [x] Suivi statut en temps réel

---

## 🆘 Si besoin d'aide

```bash
# Redémarrage complet
pkill -f backend
npm run dev

# Vérification API
curl http://localhost:3001/api

# Logs backend
npm run backend
```

**🎯 Tout fonctionne parfaitement maintenant !**

---

## 📝 Test de génération de convention

**Compte étudiant de test déjà créé :**
- Email : `ahmed.benjelloun@student.ensam.ac.ma`
- Mot de passe : `StudentPass123!`

**Procédure :**
1. Se connecter comme étudiant
2. Cliquer **"Générer une convention"**
3. Le fichier HTML se télécharge automatiquement
4. Ouvrir le fichier dans le navigateur
5. **Ctrl+P** → **"Enregistrer au format PDF"**
6. ✅ **Convention PDF prête !**

