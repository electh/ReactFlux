# ReactFlux

Lire dans d'autres langues : [Deutsch](README.de-DE.md), [English](../README.md), [Español](README.es-ES.md), [简体中文](README.zh-CN.md)

## Aperçu

ReactFlux est une interface web tierce pour [Miniflux](https://github.com/miniflux/v2), visant à offrir une expérience de lecture plus conviviale.

Versions Miniflux prises en charge : 2.3.2 et supérieures.

Les fonctionnalités principales incluent :

- Design d'interface moderne
- Mise en page responsive avec support de gestes tactiles
- Prise en charge du mode sombre et des thèmes personnalisés
- Expérience de lecture personnalisable :
  - Paramètres de police et de taille
  - Ajustement de la largeur des articles
  - Options d'alignement des titres
  - Visionneuse d'images avec zoom et diaporama
  - Amélioration des notes de bas de page
  - Coloration syntaxique du code
  - Temps de lecture estimé
- Gestion des articles et des flux :
  - Recherche en texte intégral Miniflux avec phrases, `OR` et termes exclus
  - Filtrage des articles par statut de lecture et date de publication
  - Opérations par lot sur les flux
  - Support de la récupération du texte intégral
  - Dédoublonnage des articles par hash, titre ou URL
  - Marquage automatique des articles comme lus lors du défilement
- Fonctionnalités avancées :
  - Raccourcis clavier (personnalisables)
  - Mise à jour par lot de l'hôte des URLs de souscription filtrées (utile pour remplacer les instances RSSHub)
  - Actualisation par lot des souscriptions récemment en erreur
  - Sauvegarde d'articles vers des services tiers
- Support multilingue (Deutsch / English / Español / Français / 简体中文)
- D'autres fonctionnalités à découvrir...

## Démo en ligne et captures d'écran

Essayez ReactFlux avec notre [instance de démo en ligne](https://reactflux.pages.dev).

Voyez à quoi ressemble ReactFlux dans différents thèmes :

![screenshot](../images/screenshot.png)
![devices](../images/devices.png)

## Démarrage rapide

1. Assurez-vous d'avoir une instance fonctionnelle de Miniflux
2. Utilisez directement notre [instance de démo en ligne](https://reactflux.pages.dev) ou déployez ReactFlux en utilisant l'une des méthodes ci-dessous
3. Connectez-vous en utilisant votre nom d'utilisateur et mot de passe Miniflux ou la clé API (recommandé)

## Déploiement

### Cloudflare Pages

ReactFlux est construit avec React et génère un ensemble de fichiers web statiques après la compilation, qui peuvent être directement déployés sur Cloudflare Pages.

Vous pouvez le déployer sur Cloudflare Pages en sélectionnant `Framework preset` comme `Create React App`.

### Utilisation des fichiers pré-construits

Vous pouvez télécharger les fichiers pré-construits à partir de la branche `gh-pages` et les déployer sur n'importe quel service d'hébergement statique qui prend en charge les applications monopages (SPA).

Les fichiers de `gh-pages` sont compilés pour le chemin GitHub Pages de ce dépôt (`/ReactFlux/`). Si votre déploiement utilise un autre chemin, compilez le projet depuis les sources avec `VITE_BASE_PATH` comme indiqué ci-dessous.

Assurez-vous de configurer la réécriture des URL pour rediriger toutes les requêtes vers `index.html`.

Si vous déployez en utilisant Nginx, vous devrez peut-être ajouter la configuration suivante :

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Ou en utilisant Caddy, vous devrez peut-être ajouter la configuration suivante :

```caddyfile
try_files {path} {path}/ /index.html
```

### Déploiement dans un sous-chemin

Le chemin public est intégré au bundle du frontend lors de la compilation : toute modification nécessite une nouvelle compilation. `VITE_BASE_PATH` doit valoir `/` ou être un chemin absolu commençant et se terminant par `/`. Les segments peuvent contenir des lettres ASCII, des chiffres, `.`, `_`, `~` et `-` :

```bash
VITE_BASE_PATH=/reactflux/ pnpm run build
```

Le contenu de `build` doit être disponible sous le même chemin d’URL et les liens profonds de la SPA doivent se replier sur le fichier `index.html` de ce chemin. Par exemple, si les fichiers se trouvent dans `/srv/reactflux`, Caddy peut être configuré ainsi :

```caddyfile
root * /srv
try_files {path} {path}/ /reactflux/index.html
file_server
```

L’image Docker peut également être construite pour ce chemin ; la configuration Caddy incluse place et sert automatiquement les fichiers :

```bash
docker build --build-arg VITE_BASE_PATH=/reactflux/ -t reactflux:subpath .
docker run -p 2000:2000 reactflux:subpath
# Ouvrez http://localhost:2000/reactflux/
```

Le proxy inverse doit conserver le préfixe configuré.

### Vercel

[![Déployer sur Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Docker

[![dockeri.co](https://dockerico.blankenship.io/image/electh/reactflux)](https://hub.docker.com/r/electh/reactflux)

```bash
docker run -p 2000:2000 electh/reactflux
```

Ou en utilisant [Docker Compose](../docker-compose.yml):

```bash
docker-compose up -d
```

<!-- ### Zeabur (Obsolète, non recommandé)

[![Déployer sur Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W) -->

## Guide de traduction

Pour nous aider à traduire ReactFlux dans votre langue, veuillez contribuer au dossier `locales` et envoyer une pull request.

De plus, vous devez ajouter un fichier README pour la langue respective et le référencer dans tous les fichiers README existants.

Vous devez également modifier certaines parties du code source pour inclure les packages de langue i18n pour `Arco Design` et `Day.js`.

Pour des modifications détaillées, veuillez vous référer aux modifications dans la [PR #145](https://github.com/electh/ReactFlux/pull/145).

### Traducteurs actuels

| Langue   | Traducteur                                      |
| -------- | ----------------------------------------------- |
| Deutsch  | [DonkeeeyKong](https://github.com/donkeeeykong) |
| Español  | [Victorhck](https://github.com/victorhck)       |
| Français | [MickGe](https://github.com/MickGe)             |
| 简体中文 | [Neko Aria](https://github.com/NekoAria)        |

## Contributeurs

> Merci à tous les contributeurs qui ont rendu ce projet encore plus génial !

<a href="https://github.com/electh/ReactFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=electh/ReactFlux" alt="Contributeurs pour ReactFlux" />
</a>

Créé avec [contrib.rocks](https://contrib.rocks).

## Historique des étoiles

<a href="https://star-history.dera.page/#electh/ReactFlux">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://star-history.dera.page/svg?repos=electh/reactflux&amp;theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://star-history.dera.page/svg?repos=electh/reactflux" />
    <img alt="Graphique de l’historique des étoiles de ReactFlux" src="https://star-history.dera.page/svg?repos=electh/reactflux" />
  </picture>
</a>
