<div align="center">
  <h1>⚒️ ForgeHook</h1>
  <p><strong>Gestionnaire de webhooks Discord self-hosted ultra-complet — alternative à discordhook.org.</strong></p>

  ![Version](https://img.shields.io/badge/version-2.0.0-blue)
  ![Stack](https://img.shields.io/badge/stack-Vue3%20%2B%20Hono.js%20%2B%20Docker-purple)
  ![License](https://img.shields.io/badge/license-MIT-green)
  ![Status](https://img.shields.io/badge/status-production-brightgreen)
</div>

---

## 📋 Description

ForgeHook est une application web self-hosted complète pour créer, prévisualiser et envoyer des messages Discord enrichis (embeds) via webhooks ou bot Discord. Elle offre un éditeur visuel avec aperçu pixel-perfect, des templates prêts à l'emploi, un planificateur de messages, un relais RSS et bien plus — le tout derrière une authentification admin sécurisée.

**Production** : [https://forgehook.heiphaistos.org](https://forgehook.heiphaistos.org)

---

## ✨ Fonctionnalités

- **Embed Builder** : Éditeur visuel avec aperçu Discord pixel-perfect, couleurs, images, champs, auteur, footer
- **20+ Templates pré-faits** : Gaming, Films, Annonces, Alertes, Mises à jour, et bien d'autres
- **Envoi Webhook / Bot** : Via URL de webhook OU via token de bot Discord avec sélecteur de serveur/salon
- **Export multi-format** : JSON, Markdown, HTML, TXT, cURL — copie en un clic
- **Templates personnalisés** : Variables `{{var}}` avec remplissage via modal interactif
- **Gestionnaire de Bots** : Guild browser, channel picker, envoi rapide sans quitter l'interface
- **Flux RSS → Discord** : Polling automatique + template `{{title}}` `{{link}}` `{{content}}`
- **Planificateur de messages** : Expressions cron pour automatiser l'envoi
- **Tutorial Builder** : Créateur de tutoriels structurés avec blocs text / image / vidéo / code / embed
- **Historique complet** : Filtres avancés, bulk delete, export CSV
- **Gestionnaire de médias** : Drag & drop, grille, copier l'URL en un clic
- **22 polices Unicode Discord** : Bold, italic, monospace, petites capitales, barré, et plus
- **Dashboard analytique** : Graphique 7 jours, stats globales, top webhooks
- **Auth admin sécurisée** : Compte unique bcrypt + JWT HttpOnly

---

## 🛠️ Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | Vue 3 · TypeScript · Tailwind CSS v4 · Pinia · Vite |
| Backend | Hono.js · Node.js · better-sqlite3 · JWT |
| Base de données | SQLite (better-sqlite3) |
| Déploiement | Docker · Docker Compose · nginx |

---

## 🚀 Installation & Déploiement

### Prérequis

- Docker >= 24
- Docker Compose >= 2.x
- Un serveur avec nginx (reverse proxy recommandé)

### Variables d'environnement

Créer un fichier `docker/.env` :

```env
JWT_SECRET=votre_secret_jwt_tres_long
ADMIN_PASSWORD=votre_mot_de_passe_admin
PORT=3010
```

### Démarrage

```bash
# Cloner le dépôt
git clone https://github.com/Heiphaistos/ForgeHook.git
cd ForgeHook

# Lancer les conteneurs
docker compose -f docker/docker-compose.yml up -d

# Vérifier les logs
docker compose -f docker/docker-compose.yml logs -f
```

### Mise à jour

```bash
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d --force-recreate
```

### Configuration nginx (reverse proxy)

```nginx
server {
    listen 443 ssl;
    server_name forgehook.heiphaistos.org;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📁 Structure du projet

```
ForgeHook/
├── frontend/          # Vue 3 + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/    # Composants UI
│   │   ├── stores/        # Pinia stores
│   │   └── views/         # Pages principales
├── backend/           # Hono.js + Node.js
│   ├── src/
│   │   ├── routes/        # Endpoints API
│   │   ├── middleware/    # Auth JWT, validation
│   │   └── db/            # SQLite queries
└── docker/            # docker-compose.yml + Dockerfile
```

---

## 📸 Aperçu

![Embed Builder](./docs/screenshot.png)

---

## 🔐 Sécurité

- Authentification admin unique (bcrypt cost 12 + JWT)
- Tokens JWT HttpOnly, Secure, SameSite=Strict
- Rate limiting sur les endpoints sensibles
- Validation stricte des URLs de webhooks
- Aucun secret en dur — tout via variables d'environnement

---

## 📝 Licence

MIT — © 2026 Heiphaistos
