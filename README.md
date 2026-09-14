# Bio Santé Diagnostic

Site vitrine du Groupe Bio Santé Diagnostic, laboratoire d'analyses médicales à
Brazzaville (République du Congo). Deux sites : Mpila et Cité Flamboyants.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** — thème piloté par variables CSS dans `app/globals.css`
- **Base UI** (`@base-ui/react`) — primitives accessibles sans style
- **Leaflet** — carte des deux laboratoires
- **Netlify Forms** — réception du formulaire et email d'alerte
- **Firebase** — Firestore pour les demandes, Authentication pour l'accès admin
- **Netlify** — hébergement

## Démarrer

```bash
npm install
npm run dev
```

Le site écoute sur [http://localhost:3000](http://localhost:3000).

Pour que le formulaire et l'espace `/admin` fonctionnent en local, copier
`.env.example` en `.env` et renseigner les clés (voir « Mise en service »).

## Structure

```
app/
  layout.tsx         Racine : polices, styles, <html> — rien d'autre
  (site)/            Groupe de routes : le site public
    layout.tsx       Nav, Footer, Analytics
    page.tsx         Accueil
    laboratoire/     Le laboratoire
    services/        Nos examens
    contact/         Contact & rendez-vous
  admin/             Espace d'administration (aucun chrome public)
    login/           Écran de connexion
    page.tsx         Liste des demandes
    AdminBoard.tsx   Tableau de bord (client)
  api/
    forms/           Webhook : recopie les soumissions Netlify dans Firestore
    session/         Connexion / déconnexion admin
    confirm/         Validation d'un créneau + lien WhatsApp au patient
components/
  brand/             Logo, navigation
  layout/            Pied de page
  sections/          Sections de page réutilisables
  ui/                Primitives (bouton, etc.)
lib/
  site.ts            Contenu statique : laboratoires, services, examens, créneaux
  appointments.ts    Modèle, lecture et validation des demandes
  firebase-admin.ts  Accès Firestore et Auth côté serveur
  auth.ts            Session administrateur (cookie signé)
  whatsapp.ts        Message de confirmation et lien wa.me
firestore.rules      Règles de sécurité Firestore (tout est refusé côté client)
```

### Pourquoi un groupe de routes `(site)`

`app/layout.tsx` est la racine : il ne contient que les polices, les styles et
la balise `<html>`. Le `Nav` et le `Footer` vivent dans `app/(site)/layout.tsx`.
Les parenthèses créent un **groupe de routes** : le nom disparaît de l'URL, donc
les pages restent servies à la racine (`/`, `/contact`…), mais elles partagent
ce chrome.

Sans ce découpage, `/admin` hériterait du menu et du pied de page publics. Toute
nouvelle page publique doit donc être créée dans `app/(site)/`.

## Le formulaire de rendez-vous

Le formulaire reste traité par **Netlify Forms** — ce mécanisme fonctionne, il
n'y avait pas de raison de le refaire. Netlify envoie l'email d'alerte à
`contact@grbiosante.com` (*Forms → Form notifications → Email*).

Firestore s'y ajoute en aval, via un **webhook sortant** : à chaque soumission,
Netlify appelle `/api/forms`, qui recopie la demande dans la base. C'est ce qui
permet à l'espace d'administration de la suivre et de la confirmer.

```
patient → formulaire → Netlify Forms
                          ├─ email à contact@grbiosante.com
                          └─ POST signé → /api/forms → Firestore → /admin
```

### Le piège à connaître

Netlify détecte les formulaires en lisant le **HTML statique produit au
déploiement**. Or les pages Next.js ne sont pas écrites en HTML statique : elles
sont pré-rendues puis servies depuis le cache Next. Un `<form>` déclaré dans un
composant React est donc **invisible** pour Netlify, et les envois échouent en
silence.

Deux pièces rendent le montage fonctionnel :

1. **`public/__forms.html`** — squelette statique qui décrit le formulaire et
   tous ses champs. C'est ce fichier que Netlify lit au déploiement. S'il manque
   un champ, la valeur est simplement ignorée à la réception — y compris pour le
   webhook.
2. **L'envoi pointe vers `/__forms.html`**, et non vers `/`. Un POST vers `/`
   serait intercepté par le rendu Next sans jamais atteindre Netlify.

> En ajoutant un champ au formulaire, il faut l'ajouter **dans les deux
> fichiers** : `AppointmentCard.tsx` et `public/__forms.html`.

Le champ `form-name` doit valoir `rendez-vous` des deux côtés.

### Le webhook, côté Netlify

*Forms → Form notifications → Add notification → Outgoing webhook* :

| Réglage | Valeur |
|---|---|
| Event | Form submitted |
| Form | `rendez-vous` |
| URL | `https://grbiosante.com/api/forms` |
| JWS secret | à recopier dans `NETLIFY_FORMS_SECRET` |

Sans le secret, `/api/forms` refuse toute requête : c'est délibéré. Une URL de
webhook est publique, et sans vérification de signature n'importe qui pourrait
y injecter de fausses demandes.

L'identifiant de la soumission Netlify sert de clé Firestore. C'est ce qui rend
les relivraisons inoffensives : une seconde tentative retombe sur le même
document sans le modifier.

### Anti-spam

Un champ piège (`bot-field`) est présent. Netlify rejette silencieusement toute
soumission qui le remplit. Le filtrage Akismet est actif par défaut.

## Espace d'administration

Accessible sur **`/admin`**. Aucun lien ne mène ici depuis le site public, et la
page est exclue de l'indexation. Ce n'est pas une protection : la vraie barrière
est la vérification de session faite à chaque requête, côté serveur.

- La session est un cookie `httpOnly` signé (HMAC), valable 8 heures. Il ne
  contient aucun jeton Firebase : un cookie volé ne donne pas accès aux API
  Google du projet.
- La connexion vérifie le mot de passe auprès de Firebase Authentication, puis
  contrôle que l'utilisateur figure bien dans la collection `admins`.
- La liste se filtre par statut et par laboratoire, et se recherche par nom,
  téléphone ou email.
- Confirmer un créneau met à jour le statut et ouvre **WhatsApp avec le message
  rédigé** — l'administration n'a plus qu'à appuyer sur Envoyer.

### Pourquoi WhatsApp manuel et pas automatique

L'envoi automatique (WhatsApp Cloud API) impose trois contraintes lourdes :

1. un **numéro dédié**, qui ne peut plus servir dans l'application WhatsApp —
   concrètement, le 067657878 cesserait de fonctionner normalement pour l'équipe ;
2. la **validation d'un modèle de message** par Meta ;
3. une **facturation à la message**.

Le lien « cliquer pour envoyer » contourne les trois, pour un coût nul. Le
message part de la conversation que le patient connaît déjà, et l'équipe garde
la main sur ce qui est envoyé. Un SMS automatique nécessiterait un service
équivalent, avec les mêmes frais.

> Le message ne contient que la date, l'heure, le service et l'adresse : jamais
> de détail d'analyse. C'est volontaire — les données de santé ne transitent pas
> par WhatsApp.

### Mise en service

1. **Créer le projet Firebase**, puis la base Firestore (*Firestore Database →
   Créer une base*). Le choix de la région est **définitif**.
2. **Activer Authentication** (*Authentication → Sign-in method → Adresse
   e-mail/Mot de passe*).
3. **Créer le compte administrateur** (*Authentication → Users → Ajouter un
   utilisateur*), puis copier son **UID**.
4. **Déclarer cet UID comme admin** : dans Firestore, créer la collection
   `admins` et un document dont l'**ID est l'UID**, avec les champs
   `name` (texte), `email` (texte) et `active` (booléen `true`).
   Créer un compte Firebase ne suffit pas : sans ce document, l'accès est refusé.
5. **Renseigner les variables** dans Netlify (*Project configuration →
   Environment variables*), d'après `.env.example`. Les trois valeurs Firebase
   viennent de *Paramètres du projet → Comptes de service → Générer une nouvelle
   clé privée*. Le `ADMIN_SESSION_SECRET` se génère avec `openssl rand -base64 48`.
6. **Publier les règles Firestore** : reprendre le contenu de `firestore.rules`
   dans *Firestore Database → Règles*, puis publier. Ces règles refusent tout
   accès depuis un navigateur ; l'accès serveur, lui, n'est pas concerné — le
   SDK d'administration ignore les règles par conception. Sans cette étape, la
   base reste sur son mode de test, ouvert à quiconque connaît l'URL du projet.
7. **Configurer le webhook** (voir « Le webhook, côté Netlify » plus haut), et
   recopier son JWS secret dans `NETLIFY_FORMS_SECRET`.
8. **Déployer** : le nouveau champ `dial` doit être publié *avant* que le webhook
   ne serve à quoi que ce soit, sinon les numéros arrivent sans indicatif.

### Emails à l'administration

Rien à installer : Netlify s'en charge. Vérifier simplement que
*Forms → Form notifications → Email* pointe sur `contact@grbiosante.com`. Seules
les soumissions **vérifiées** déclenchent l'envoi.

### Emails au patient

Il n'y en a plus. La confirmation part par WhatsApp, à la main, depuis le
tableau de bord.

## Déploiement (Netlify)

Le site est déployé sur Netlify depuis la branche `main`.

`netlify.toml` déclare **explicitement** l'adaptateur Next.js :

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Cette déclaration n'est pas facultative. La documentation Netlify annonce une
détection automatique du framework, mais elle ne s'est pas déclenchée sur ce
site : le build a publié le dossier `.next` brut sans créer la moindre Function,
et Netlify l'a servi comme un site statique. Comme `.next` ne contient aucun
`index.html` à sa racine, **toutes les routes répondaient 404** — y compris la
page d'accueil.

Symptôme à reconnaître : 404 Netlify sur toutes les URL, sur un build vert et
sans aucune section « Plugins » dans le journal de déploiement.

> Contrepartie assumée : déclarer le plugin renonce aux mises à jour automatiques
> de l'adaptateur. Pour les réactiver, retirer le bloc `[[plugins]]` et l'entrée
> correspondante dans `package.json`.

## Données de santé

Les demandes contiennent des données de santé (type d'analyse). Le cadre
congolais — loi n° 29-2019 sur la protection des données personnelles — impose
un accès restreint et une finalité explicite. Trois points à préserver :

- **Accès restreint** — les règles Firestore refusent toute lecture depuis un
  client ; tout passe par le serveur, où la session est vérifiée.
- **Finalité explicite** — mentions à faire figurer dans la politique de
  confidentialité, y compris le transfert vers les serveurs de Google.
- **Conservation** — les demandes servent d'archive. Fiabilité à connaître : le
  palier gratuit de Firestore plafonne à 1 Gio (les écritures cessent silencieusement
  au-delà) et ne prévoit aucune restauration dans le temps. Prévoir un export
  périodique — et, pour un archivage médical, une copie hors Firebase.

