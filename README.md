# Librairie du Temple — Les Rayons du Marais

Prototype de modernisation de la boutique parisienne, préparé par Deux Rives Web pour revue. Ce second concept associe le bordeaux, l’ivoire et le vert sauge à une ouverture sur l’intérieur de la librairie. Le logo, les bannières, les couvertures, les photos et les vidéos proviennent des supports publics de la librairie.

## Démarrer

```sh
npm run dev
npm test
```

Node.js et Python 3 sont requis. Aucun paquet npm ni accès marchand n’est nécessaire. Ouvrir l’adresse affichée par le serveur. GitHub Pages publie la racine de `main`. Les URL internes sont relatives et fonctionnent sous le chemin du dépôt.

## Parcours disponibles

- Accueil avec bandeau PayPal au-dessus de la recherche, un accueil avec la photo de la librairie et les cinq visuels de campagne dans un carrousel à défilement manuel.
- Carrousels Nouveautés et Coups de cœur utilisables au clavier, avec les flèches ou par défilement tactile. Les quatre premiers titres des Nouveautés reprennent l’ordre de la maquette, dont deux titres également présents dans les Coups de cœur d’origine.
- Catalogue, 109 rayons et sous-rayons, tri, recherche et fiches avec liens vers les pages d’origine. Le catalogue de démonstration reprend la première page de chaque rayon, puis déduplique les articles. Les fiches présentées sur l’accueil ont des détails supplémentaires lorsqu’ils existent dans la source.
- Panier local avec ajout, quantité et retrait, visite de la librairie, personnalisation, contact, aperçu du compte, plan et pages d’information.
- Les deux vidéos publiques sont ouvertes à la demande. Les formulaires de démonstration valident les champs localement. Aucun paiement, envoi de message, accès compte ou abonnement ne s’exécute dans le prototype. Les liens vers la boutique officielle donnent accès aux opérations réelles.

## Contenu et maintenance

- `styles.css` contient le thème, les mises en page et les variantes mobiles. `app.js` contient les parcours et interactions. `catalogue.json` contient la sélection capturée depuis le [site officiel](https://www.librairiedutemple.fr/), les références et les liens sources.
- `assets/` contient les médias principaux du prototype. Le reste des images produit utilise les URL d’origine. Les prix et disponibilités sont des valeurs indicatives capturées dans le catalogue public et peuvent changer. Les descriptifs disponibles reprennent le texte de la boutique.
- La date passée du 7 décembre 2023 a été retirée du bloc Hanoucca. Aucun millésime de remplacement n’a été ajouté sans calendrier confirmé. Les dates historiques des notices restent inchangées.
- Le bandeau PayPal est un aperçu informatif. Pour le site marchand, la configuration PayPal existante de la librairie et son affichage par marché sont à valider lors de l’intégration.
- `scripts/snapshot.py` transforme les pages PrestaShop publiques enregistrées localement en catalogue statique. Le script requiert `lxml`. Il n’est pas nécessaire au déploiement. Le déploiement de démonstration porte une instruction `noindex`.
