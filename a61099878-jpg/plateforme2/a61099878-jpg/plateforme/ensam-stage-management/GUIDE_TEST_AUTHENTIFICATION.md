# 🧪 Guide de Test - Corrections d'Authentification

## 🚀 Tests Rapides (5 minutes)

### Test 1: Déconnexion Sécurisée ✅
```bash
1. Démarrer l'app : npm run dev
2. Se connecter (admin ou étudiant)
3. Cliquer menu utilisateur → "Déconnexion Sécurisée" 🛡️
4. Arrêter l'app (Ctrl+C)
5. Redémarrer : npm run dev
6. ✅ VÉRIFIER : Page de connexion s'affiche automatiquement
```

### Test 2: Création Compte Étudiant ✅
```bash
1. Page de connexion → Onglet "Créer un compte"
2. Utiliser un email d'étudiant existant (ex: ahmed.benali@ensam.ac.ma)
3. Créer mot de passe
4. Cliquer "Créer le compte"
5. ✅ VÉRIFIER : Redirection immédiate vers dashboard étudiant
6. ✅ VÉRIFIER : Nom et infos correctes affichées
7. ✅ VÉRIFIER : Pas de confusion avec autre compte
```

### Test 3: Banner de Sécurité ✅
```bash
1. Se connecter (admin ou étudiant)
2. ✅ VÉRIFIER : Banner bleu de sécurité affiché en haut
3. Cliquer "Activer" dans le banner
4. Redémarrer l'app
5. ✅ VÉRIFIER : Retour à la page de connexion
```

---

## 🔍 Tests Approfondis (15 minutes)

### Test 4: Validation des Tokens
```bash
1. Se connecter normalement
2. Ouvrir DevTools → Application → Local Storage
3. Trouver 'auth_token_timestamp'
4. Modifier la valeur : soustraire 25*60*60*1000 (25h en ms)
5. Actualiser la page
6. ✅ VÉRIFIER : Déconnexion automatique (token expiré)
```

### Test 5: Nettoyage des Données
```bash
1. Se connecter comme admin
2. Ouvrir DevTools → Application → Local Storage
3. Noter les données présentes
4. Se déconnecter avec "Déconnexion Normale"
5. ✅ VÉRIFIER : auth_token supprimé
6. ✅ VÉRIFIER : user_data supprimé
7. ✅ VÉRIFIER : cached_profile supprimé
```

### Test 6: Options de Déconnexion
```bash
1. Se connecter
2. Menu utilisateur → 2 options visibles :
   - 🛡️ "Déconnexion Sécurisée" (orange)
   - 🚪 "Déconnexion Normale" (rouge)
3. Tester "Déconnexion Normale"
4. ✅ VÉRIFIER : Déconnecte immédiatement
5. ✅ VÉRIFIER : Pas de flag force_logout_on_restart
6. Redémarrer → Se reconnecter automatiquement possible
```

---

## 🐛 Tests de Régression

### Test 7: Fonctionnalités Existantes
```bash
1. Login admin : admin@ensam.ac.ma / AdminENSAM2024!
2. ✅ Dashboard admin fonctionne
3. ✅ Import étudiants fonctionne
4. ✅ Gestion conventions fonctionne

5. Créer compte étudiant et tester :
6. ✅ Dashboard étudiant fonctionne  
7. ✅ Génération convention fonctionne
8. ✅ Upload fichier fonctionne
```

### Test 8: Navigation et Redirections
```bash
1. ✅ URLs directes redirigent vers login si non connecté
2. ✅ Utilisateur admin → admin/dashboard
3. ✅ Utilisateur étudiant → student/dashboard  
4. ✅ Pages 404 fonctionnent correctement
```

---

## 🎯 Scénarios Utilisateur Réels

### Scénario 1: Étudiant Normal
```bash
1. Ahmed visite la plateforme pour la première fois
2. Crée son compte avec ahmed.benali@ensam.ac.ma
3. ✅ Redirected immédiatement vers son espace
4. ✅ Voit ses informations correctes
5. ✅ Peut générer sa convention
```

### Scénario 2: Admin Sécurité
```bash
1. Admin utilise un poste partagé  
2. Se connecte pour valider des conventions
3. Termine sa session avec "Déconnexion Sécurisée"
4. ✅ Prochain utilisateur ne peut pas accéder aux données admin
5. ✅ Doit s'authentifier même après redémarrage
```

### Scénario 3: Étudiant Oubli
```bash
1. Étudiant ferme l'onglet par accident
2. Rouvre la plateforme le lendemain
3. ✅ Reste connecté si <24h (déconnexion normale)
4. ✅ Doit se reconnecter si >24h (expiration auto)
```

---

## 🚨 Indicateurs de Problème

### ⚠️ Signes que ça ne marche PAS
- Utilisateur reste connecté après "Déconnexion Sécurisée" + redémarrage
- Redirection vers mauvais compte après création
- Erreurs console lors de la vérification de token
- Banner de sécurité ne s'affiche pas
- Options de déconnexion manquantes dans le menu

### ✅ Signes que ça marche BIEN  
- Retour systématique à la page login après déconnexion sécurisée
- Redirection immédiate et correcte après création compte
- Banner de sécurité visible et fonctionnel
- Deux options de déconnexion dans le menu
- Pas d'erreurs console liées à l'auth

---

## 🛠️ Debug en Cas de Problème

### Vérifier les Logs Console
```javascript
// Ouvrir DevTools → Console
// Chercher ces messages :
"Token verification failed:" // Normal si pas de token
"User data mismatch - security issue" // PROBLÈME !
"✅ Fichier sauvegardé:" // Upload OK
```

### Vérifier Local Storage
```javascript
// DevTools → Application → Local Storage
// Vérifier ces clés :
auth_token                  // Token d'auth
auth_token_timestamp        // Horodatage
user_data                   // Cache utilisateur  
force_logout_on_restart     // Flag déconnexion sécurisée
security_banner_dismissed   // Banner masqué
```

### Vérifier Network
```javascript
// DevTools → Network → filtrer "api"
// Vérifier ces calls :
POST /api/auth/login        // Login
POST /api/auth/register     // Création compte
POST /api/auth/verify       // Vérification token
```

---

## 📝 Checklist de Validation Finale

- [ ] **Test 1** : Déconnexion sécurisée force retour login
- [ ] **Test 2** : Création compte redirige immédiatement  
- [ ] **Test 3** : Banner sécurité affiché et fonctionnel
- [ ] **Test 4** : Tokens expirent après 24h
- [ ] **Test 5** : Données nettoyées à la déconnexion
- [ ] **Test 6** : Deux options déconnexion disponibles
- [ ] **Test 7** : Fonctionnalités existantes intact
- [ ] **Test 8** : Navigation et redirections OK

### Validation Complète ✅
```bash
# Si tous les tests passent :
echo "🎉 CORRECTIONS D'AUTHENTIFICATION VALIDÉES !"
echo "✅ Sécurité renforcée"  
echo "✅ Bugs de redirection corrigés"
echo "✅ UX améliorée"
```

### En Cas d'Échec ❌
```bash
# Vérifier :
1. Tous les fichiers modifiés sont sauvegardés
2. Serveur redémarré après modifications
3. Cache navigateur vidé (Ctrl+Shift+R)
4. Local Storage nettoyé manuellement si nécessaire
```

Ce guide garantit que toutes les corrections fonctionnent correctement ! 🚀