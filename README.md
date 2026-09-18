# [ExamArchive](https://examenarchive.netlify.app/)

Plateforme numérique d'archivage, de recherche et de consultation des sujets d'examen universitaire.

## Présentation
ExamArchive est une application web destinée à centraliser et organiser les anciens sujets d'examen. Ce projet est la version V1 développée en HTML, CSS, et JavaScript (Vanilla) et fonctionnant sans serveur backend, avec `localStorage` pour la persistance des données.

## Fonctionnalités
- Consultation des archives
- Recherche en temps réel
- Filtres (Filière, Année, Semestre, Matière)
- Tri des résultats
- Consultation du texte intégral d'un examen
- Ajout, modification, et suppression locale de sujets
- Fonctionnement hors ligne

## Installation et Utilisation
Puisque le projet est entièrement statique (HTML/CSS/JS), il vous suffit d'ouvrir le fichier `index.html` dans un navigateur moderne pour l'utiliser. 

Pour une meilleure expérience (par exemple pour contourner certaines restrictions CORS locales si vous ajoutez plus tard des modules ou imports), vous pouvez lancer un serveur local :

```bash
python -m http.server 8000
```
Puis rendez-vous sur `http://localhost:8000`.

## Configuration des clés API

Les clés Gemini et OCR.space ne sont pas incluses dans le dépôt. Pour les configurer, ouvrez l'application avec le hash administrateur, par exemple `index.html#admin-votreMotDePasse`, puis ouvrez les paramètres avec le bouton ⚙️.

Les clés saisies sont conservées uniquement dans le `localStorage` du navigateur et utilisées directement depuis celui-ci. N'utilisez pas une clé avec des permissions ou un budget illimités sur une application statique publique. En cas d'exposition, révoquez immédiatement la clé depuis le fournisseur concerné.

## Architecture
- `index.html` : Structure de l'application
- `css/style.css` : Styles et design responsive
- `js/app.js` : Logique principale de l'interface
- `js/data.js` : Données et métadonnées initiales
- `js/textes.js` : Textes OCR des sujets
- `js/search.js` : Logique de recherche et de filtrage
- `js/storage.js` : Gestion du localStorage
- `sujet/` : Dossier contenant les images originales (facultatif pour la V1)
