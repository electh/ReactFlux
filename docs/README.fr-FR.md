# ReactFlux

Lire dans d'autres langues : [English](../README.md), [Español](README.es-ES.md), [简体中文](README.zh-CN.md)

## Aperçu

ReactFlux est une interface web tierce pour [Miniflux](https://github.com/miniflux/v2), visant à offrir une expérience de lecture plus conviviale.

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
  - Recherche avec une syntaxe similaire à Google
  - Filtrage des articles par statut de lecture, date de publication, titre, contenu ou auteur
  - Opérations par lot sur les flux
  - Support de la récupération du texte intégral
  - Dédoublonnage des articles par hash, titre ou URL
  - Marquage automatique des articles comme lus lors du défilement
- Fonctionnalités avancées :
  - Raccourcis clavier (personnalisables)
  - Mise à jour par lot de l'hôte des URLs de souscription filtrées (utile pour remplacer les instances RSSHub)
  - Actualisation par lot des souscriptions récemment en erreur
  - Sauvegarde d'articles vers des services tiers
- Support multilingue (English / Español / Français / 简体中文)
- D'autres fonctionnalités à découvrir...

## Démo en ligne et captures d'écran

Essayez ReactFlux avec notre [instance de démo en ligne](https://reactflux.pages.dev).

Voyez à quoi ressemble ReactFlux dans différents thèmes :

![Mode Clair](images/light.png)
![Mode Sombre](images/dark.png)

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

Assurez-vous de configurer la réécriture des URL pour rediriger toutes les requêtes vers `index.html`.

Si vous déployez en utilisant Nginx, vous devrez peut-être ajouter la configuration suivante :

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel

[![Déployer sur Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Docker

[![dockeri.co](https://dockerico.blankenship.io/image/electh/reactflux)](https://hub.docker.com/r/electh/reactflux)

```bash
docker run -p 2000:2000 electh/reactflux
```

Ou en utilisant [Docker Compose](docker-compose.yml):

```bash
docker-compose up -d
```

<!-- ### Zeabur (Obsolète, non recommandé)

[![Déployer sur Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W) -->

## Guide de traduction

Pour nous aider à traduire ReactFlux dans votre langue, veuillez contribuer au dossier `locales` et envoyer une pull request.

De plus, vous devez ajouter un fichier README pour la langue respective et le référencer dans tous les fichiers README existants.

Vous devez également modifier certaines parties du code source pour inclure les packages de langue i18n pour `Arco Design` et `Day.js`.

Pour des modifications détaillées, veuillez vous référer aux modifications dans la [PR #120](https://github.com/electh/ReactFlux/pull/120).

### Traducteurs actuels

- Español by [Victorhck](https://github.com/victorhck)
- Français by [MickGe](https://github.com/MickGe)
- 简体中文 by [Neko Aria](https://github.com/NekoAria)

## Contributeurs

> Merci à tous les contributeurs qui ont rendu ce projet encore plus génial !

<a href="https://github.com/electh/ReactFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=electh/ReactFlux" alt="Contributeurs pour ReactFlux" />
</a>

Créé avec [contrib.rocks](https://contrib.rocks).

## Historique des étoiles

[![Historique des étoiles](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
