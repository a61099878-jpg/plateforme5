# ✅ Test de Génération de Convention PDF

## 🎯 Problème résolu !

L'endpoint `/api/student/convention/generate` est maintenant fonctionnel et génère des conventions de stage personnalisées.

---

## 🧪 Comment tester

### 1. **Créer un compte étudiant**
```bash
# Via l'interface web ou en ligne de commande :
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed.benjelloun@student.ensam.ac.ma","password":"StudentPass123!"}'
```

### 2. **Se connecter comme étudiant**
- Aller sur http://localhost:5173
- Cliquer sur "Se connecter" puis "Étudiant"
- Email : `ahmed.benjelloun@student.ensam.ac.ma`
- Mot de passe : `StudentPass123!`

### 3. **Tester la génération de convention**
- Aller dans l'espace étudiant
- Cliquer sur **"Générer une convention"**
- ✅ **Le fichier HTML se télécharge automatiquement**

### 4. **Convertir en PDF**
- Ouvrir le fichier HTML téléchargé dans le navigateur
- Faire **Ctrl+P** (ou Cmd+P sur Mac)
- Sélectionner **"Enregistrer au format PDF"**
- ✅ **Vous obtenez votre convention en PDF !**

---

## 📋 Contenu généré

La convention inclut automatiquement :

- **En-tête ENSAM** avec logo
- **Informations étudiant** (nom, email, filière, année, codes)
- **Type de stage** selon l'année :
  - 1ère année : Stage d'Initiation (4 semaines)
  - 2ème année : Stage de Fin d'Année (8 semaines)  
  - 3ème année : Stage de Fin d'Études (12 semaines)
- **Sections à compléter** (entreprise, encadrant)
- **Zones de signature** (étudiant, ENSAM, entreprise)

---

## 🎨 Personnalisation

Pour modifier le template de convention :
1. Éditer le fichier `backend-node.cjs`
2. Chercher la section `htmlContent` dans l'endpoint `/api/student/convention/generate`
3. Modifier le HTML/CSS selon vos besoins
4. Redémarrer le backend : `npm run backend`

---

**🎉 La génération de convention fonctionne parfaitement !**