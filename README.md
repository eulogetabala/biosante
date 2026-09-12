# Bio Santé Diagnostic

Site vitrine du Groupe Bio Santé Diagnostic, laboratoire d'analyses médicales à
Brazzaville (République du Congo). Deux sites : Mpila et Cité Flamboyants.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** — thème piloté par variables CSS dans `app/globals.css`
- **Base UI** (`@base-ui/react`) — primitives accessibles sans style
- **Leaflet** — carte des deux laboratoires
- **Netlify** — hébergement et traitement du formulaire de rendez-vous

## Démarrer

```bash
npm install
npm run dev
```

Le site écoute sur [http://localhost:3000](http://localhost:3000).

## Structure

```
app/                 Pages (App Router)
  page.tsx           Accueil
  laboratoire/       Le laboratoire
  services/          Nos examens
  contact/           Contact & rendez-vous
components/
  brand/             Logo, navigation
  layout/            En-tête, pied de page
  sections/          Sections de page réutilisables
  ui/                Primitives (bouton, etc.)
lib/
  site.ts            Données du site : laboratoires, services, examens,
                     créneaux, pays — tout le contenu statique vit ici
public/
  __forms.html       Squelette de détection Netlify Forms (voir ci-dessous)
```

## Le formulaire de rendez-vous

Le formulaire est traité par **Netlify Forms** et les demandes arrivent sur la
boîte `contact@grbiosante.com` (à configurer dans Netlify : *Forms → Form
notifications → Email*).

### Le piège à connaître

Netlify détecte les formulaires en lisant le **HTML statique produit au
déploiement**. Or les pages Next.js ne sont pas écrites en HTML statique : elles
sont pré-rendues puis servies depuis le cache Next. Un `<form>` déclaré dans un
composant React est donc **invisible** pour Netlify, et les envois échouent en
silence.

Deux pièces rendent le montage fonctionnel :

1. **`public/__forms.html`** — squelette statique qui décrit le formulaire et
   tous ses champs. C'est ce fichier que Netlify lit au déploiement. S'il manque
   un champ, la valeur est simplement ignorée à la réception.
2. **L'envoi pointe vers `/__forms.html`**, et non vers `/`. Un POST vers `/`
   serait intercepté par le rendu Next sans jamais atteindre Netlify.

> En ajoutant un champ au formulaire, il faut l'ajouter **dans les deux
> fichiers** : `AppointmentCard.tsx` et `public/__forms.html`.

Le champ `form-name` doit valoir `rendez-vous` des deux côtés.

### Anti-spam

Un champ piège (`bot-field`) est présent. Netlify rejette silencieusement toute
soumission qui le remplit. Le filtrage Akismet est actif par défaut.

## Base de données des rendez-vous

Pas encore en place. Les demandes sont aujourd'hui conservées dans l'interface
Netlify et notifiées par email. Le cloisonnement prévu : un rôle Postgres en
insertion seule pour le site public, un rôle complet pour l'espace admin.

## Données de santé

Les demandes contiennent des données de santé (type d'analyse). Le cadre
congolais — loi n° 29-2019 sur la protection des données personnelles — impose
un accès restreint et une finalité explicite. Toute évolution doit préserver ces
deux points.
