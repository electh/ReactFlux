# ReactFlux

Lire dans d'autres langues : [English](README.md), [Español](README.es-ES.md), [简体中文](README.zh-CN.md)

## Aperçu

ReactFlux est une interface web tierce pour [Miniflux](https://github.com/miniflux/v2), visant à offrir une expérience de lecture plus conviviale.

Les fonctionnalités principales incluent :

- Design d'interface moderne
- Mise en page responsive
- Prise en charge du mode sombre et des thèmes personnalisés
- Recherche d'articles et de flux avec une syntaxe similaire à Google
- Filtrage des articles par date de publication
- Gestion des flux et des groupes
- Raccourcis clavier (personnalisables)
- Marquage automatique des articles comme lus lors du défilement
- Mise à jour par lot de l'hôte des URLs de souscription filtrées (utile pour remplacer les instances RSSHub)
- Actualisation par lot des souscriptions récemment en erreur
- Dédoublonnage des articles par hash, titre ou URL lors du chargement de la liste
- Support multilingue (inclut : Anglais / Español / 简体中文)
- Sauvegarde d'articles vers des services tiers
- Coloration syntaxique pour les blocs de code
- D'autres fonctionnalités à découvrir...

## Captures d'écran

![Mode Clair](images/light.png)
![Mode Sombre](images/dark.png)

## Démo

[Instance de démonstration en ligne](https://reactflux.pages.dev/login)

## Déploiement

### Cloudflare Pages

ReactFlux est construit avec React et génère un ensemble de fichiers web statiques après la compilation, qui peuvent être directement déployés sur Cloudflare Pages.

Vous pouvez également le déployer vous-même sur Cloudflare Pages en sélectionnant `Framework preset` comme `Create React App`.

### Vercel

[![Déployer sur Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Zeabur

[![Déployer sur Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W)

### Docker

```bash
docker run -p 2000:2000 electh/reactflux
```

## Configuration

Vous avez besoin d'une instance Miniflux fonctionnelle pour utiliser ce projet, qui prend en charge les deux méthodes de connexion suivantes :

1. Se connecter en utilisant le nom d'utilisateur et le mot de passe de l'instance (non recommandé) ;
2. Se connecter en utilisant un jeton Miniflux, qui peut être généré dans "Paramètres > Clés API > Créer une nouvelle clé API".

## Branches

- Branche `main` : Fournit les fonctionnalités les plus complètes. Les nouvelles fonctionnalités sont généralement publiées d'abord sur cette branche, adaptée à la plupart des utilisateurs.
- Branche `next` : Initialement créée pour améliorer la compatibilité avec les appareils mobiles, offrant une meilleure expérience et performance pour les appareils mobiles tout en restant compatible avec les ordinateurs de bureau. Cette branche manque actuellement de fonctionnalités comme les raccourcis clavier et migrera sélectivement les fonctionnalités de la branche `main`.
- Branche `gh-pages` : Utilisée pour compiler et déployer la branche `main` sur GitHub Pages.

Si vous souhaitez rapidement essayer la branche `next`, voici une [instance en ligne](https://arcoflux.pages.dev/login).

## Contributeurs

> Merci à tous les contributeurs qui ont rendu ce projet possible !

<table>
<tr>
    <td align="center">
        <a href="https://github.com/NekoAria">
            <img src="https://avatars.githubusercontent.com/u/23137034?v=4" width="90" alt="NekoAria" style="border-radius: 4px"/>
        </a>
        <br />
        <sub><b>NekoAria</b></sub>
        <br />
        <sub><b>Contributeur Principal</b></sub>
    </td>
    <td align="center">
        <a href="https://github.com/electh">
            <img src="https://avatars.githubusercontent.com/u/83588235?v=4" width="90" alt="electh" style="border-radius: 4px"/>
        </a>
        <br />
        <sub><b>electh</b></sub>
        <br />
        <sub><b>Initiateur du Projet</b></sub>
    </td>
</tr>
</table>

## Historique des étoiles

[![Historique des étoiles](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
