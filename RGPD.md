# RGPD — modèles de documents à faire valider

⚠️ **Je ne suis pas juriste.** Ce qui suit est un point de départ structuré,
pas un avis juridique. Avant tout usage avec de vraies personnes, faites
relire et compléter ces documents par un·e juriste spécialisé·e en droit du
numérique/santé, ou consultez directement la CNIL (https://www.cnil.fr —
la CNIL propose des modèles et un service de conseil aux petites structures).

---

## 1. Registre de traitement (modèle à compléter)

Le RGPD impose de tenir un registre des traitements de données personnelles.
Pour ReParole, un traitement de base ressemblerait à ceci :

| Champ | À compléter pour ReParole |
|---|---|
| **Nom du traitement** | Suivi de rééducation orthophonique post-AVC (application ReParole) |
| **Responsable de traitement** | _[Vous / votre structure — à préciser]_ |
| **Finalité** | Permettre le suivi personnalisé d'exercices de rééducation du langage et leur supervision par un·e orthophoniste |
| **Base légale** | À déterminer avec un juriste — probablement : consentement de la personne concernée (art. 6.1.a), et/ou intérêt public/mission de soin selon le cadre d'exercice |
| **Catégories de données** | Identité (prénom, code de suivi), données de santé (résultats d'exercices, catégories d'erreurs, profil clinique déclaré), photos personnelles éventuelles, email (si rappels activés) |
| **Catégories de personnes concernées** | Patients en rééducation, orthophonistes utilisateurs |
| **Destinataires** | L'orthophoniste rattaché·e au patient ; l'hébergeur technique (Supabase ou autre) en tant que sous-traitant |
| **Durée de conservation** | À définir — voir section 3 ci-dessous |
| **Mesures de sécurité** | Authentification (Supabase Auth pour les orthophonistes), chiffrement en transit (HTTPS), règles d'accès en base (RLS), hébergement à choisir en fonction du statut HDS (voir HEBERGEMENT.md) |
| **Transferts hors UE** | À vérifier selon l'hébergeur choisi — Supabase propose des régions UE, à sélectionner explicitement lors de la création du projet |

## 2. Mentions d'information (à afficher aux patients et aux orthophonistes)

Modèle de texte à adapter et à afficher lors de l'inscription (patient et
orthophoniste) :

> **Vos données personnelles**
> Les informations recueillies dans cette application (résultats
> d'exercices, catégories d'erreurs détectées automatiquement, profil
> clinique le cas échéant, photos que vous choisissez d'ajouter) sont
> utilisées uniquement pour personnaliser votre rééducation et permettre
> le suivi par votre orthophoniste. Elles sont conservées pendant
> _[durée à définir]_ et hébergées par _[nom de l'hébergeur]_.
>
> Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
> d'effacement et de portabilité de vos données, ainsi que du droit de
> retirer votre consentement à tout moment. Pour exercer ces droits,
> contactez _[coordonnées à compléter]_.
>
> Vous pouvez également introduire une réclamation auprès de la CNIL
> (www.cnil.fr).

## 3. Durée de conservation — questions à trancher

- Combien de temps garder les données d'un patient après la fin du suivi ?
- Faut-il anonymiser (plutôt que supprimer) les données à des fins
  statistiques internes, et selon quel délai ?
- Que se passe-t-il si un compte orthophoniste est supprimé — les patients
  qui lui étaient rattachés perdent-ils leur suivi ?

Ce prototype ne met en place **aucune suppression ou anonymisation
automatique** — c'est un point à construire avant tout usage réel (par
exemple via une tâche planifiée Supabase, similaire à celle des rappels
email, voir `js/reminders-edge-function.md`).

## 4. Droit d'accès / suppression — état actuel du prototype

- Un patient peut, en théorie, demander la suppression de son dossier :
  techniquement, cela demande une fonction dédiée (non incluse dans ce
  prototype) qui supprime la ligne `patients` — les suppressions en
  cascade (`on delete cascade`) sur `sessions`, `error_events`,
  `patient_media`, `reports`, `notes` sont déjà prévues dans le schéma,
  donc une suppression de la ligne patient entraîne bien la suppression de
  tout le reste.
- Il n'y a pas encore d'interface pour qu'un patient déclenche lui-même
  cette suppression, ni pour exporter ses propres données (portabilité).
  Ce sont des ajouts à prévoir avant un usage réel.

## 5. Sous-traitant technique

Si vous utilisez Supabase, il agit comme **sous-traitant** au sens RGPD.
Vérifiez :
- Que Supabase propose un DPA (Data Processing Agreement) — c'est le cas,
  disponible dans leur documentation légale.
- La région d'hébergement de votre projet Supabase (choisissez une région
  UE dès la création du projet).
- Le statut de certification HDS le cas échéant (voir HEBERGEMENT.md —
  un hébergeur généraliste comme Supabase n'est, à ma connaissance, pas
  certifié HDS ; à reconfirmer directement auprès d'eux).
