# ReParole Pro — Dossier de préparation réglementaire (v1, juillet 2026)

> ⚠️ **Ce document n'est PAS une certification.** Il ne remplace ni
> l'ISO 13485, ni l'ISO 14971, ni un dossier technique MDR réel, ni le
> marquage CE. C'est un dossier de **préparation** — un état des lieux
> honnête de ce qui existe déjà et de ce qu'il manque — pour que le
> jour où le budget et le volume d'activité le justifient, la mise en
> conformité réelle (avec un∙e consultant∙e QARA et, selon la classe,
> un organisme notifié) parte d'une base documentée plutôt que de
> zéro.
>
> **Ne jamais présenter ce document, ni aucun contenu qu'il contient,
> comme une certification obtenue.** Apposer un marquage CE ou
> revendiquer une conformité ISO non obtenue est une infraction pénale
> sous le règlement (UE) 2017/745 (MDR), pas seulement une mauvaise
> pratique.
>
> Rédigé par Claude (Anthropic) en tant qu'assistant de développement
> — **pas un∙e professionnel∙le des affaires réglementaires**. Rien
> ici ne doit être considéré comme un avis réglementaire ou juridique.

---

## 1. Statut actuel : ReParole est-il un dispositif médical aujourd'hui ?

**Non, très probablement pas**, selon la qualification du MDR (art.
2(1), guide MDCG 2019-11) : un logiciel n'est un dispositif médical
que s'il a une finalité médicale propre (diagnostic, prévention,
surveillance, prédiction, pronostic, traitement ou atténuation d'une
maladie).

ReParole se positionne aujourd'hui explicitement **hors de ce
périmètre**, et ce choix de positionnement est ce qui le maintient
hors du champ du MDR :

- Bandeau d'accueil : *"Cet outil vous aide à patienter, il ne
  remplace pas votre rendez-vous avec un∙e orthophoniste."*
- Aucune revendication de diagnostic, de traitement ou d'efficacité
  clinique mesurée nulle part dans l'app ou sa documentation.
- Garde-fou n°6 (voir SKILL) : jamais de "norme clinique" chiffrée
  montrée au patient — exactement le type de contenu qui ferait
  basculer un logiciel vers une finalité médicale.

**Si l'objectif futur est de revendiquer une finalité médicale**
(diagnostic, mesure d'efficacité thérapeutique, aide à la décision
clinique), ce positionnement devra changer en premier — et ça
déclenchera alors le MDR, probablement en classe IIa minimum (la
majorité des logiciels qualifiés dispositif médical depuis 2021 ne
sont plus éligibles à l'auto-certification de classe I), donc un
passage obligatoire par un organisme notifié.

---

## 2. Ce qui existe déjà et qui compte comme un vrai point de départ

Un système de management de la qualité (ISO 13485) et un dossier
technique MDR reposent tous les deux sur la **traçabilité** et la
**preuve documentée**. Ce qui suit n'est pas un SMQ, mais c'est une
matière première réutilisable :

| Exigence typique | Ce qui existe déjà dans ReParole |
|---|---|
| Traçabilité des versions et des changements | Journal détaillé de chaque version (`README.md`, section changelog — 88+ versions documentées avec ce qui a changé, pourquoi, et ce qui a été testé) |
| Preuve de vérification avant mise en production | Suite de tests automatisés (467 tests au 11 juillet 2026), exécutée avant chaque livraison, jamais de régression silencieuse tolérée |
| Gestion des risques liés aux données personnelles | `RGPD.md` — catégories de données, base légale à trancher, droits d'accès/rectification/effacement/portabilité (effacement et portabilité réellement implémentés, pas seulement documentés) |
| Sécurité du traitement des données | Audit de sécurité XSS documenté (v6.83), RLS sur toutes les tables, authentification à deux facteurs (admin + orthophoniste), gestion du cycle de vie des mots de passe |
| Règles métier destinées à limiter les risques cliniques | "Garde-fous" documentés et appliqués de façon continue (SKILL_ReParole_v6.md) — voir section 3 |
| Définition de la destination du produit (intended use) | Formulée de façon informelle mais cohérente sur tout le site — à formaliser en une vraie "Déclaration de destination" si besoin (voir section 5) |

---

## 3. Registre de risques préliminaire (esprit ISO 14971, non formel)

ISO 14971 attend un processus continu d'identification des dangers,
d'estimation du risque, de mesures de maîtrise et de réévaluation du
risque résiduel — tenu à jour pendant tout le cycle de vie du produit,
pas une liste figée une fois pour toutes. Ce qui suit est un **point
de départ informel**, pas un fichier de gestion des risques conforme.

| Danger identifié | Risque | Maîtrise déjà en place | Risque résiduel |
|---|---|---|---|
| Contenu d'exercice erroné ou traduction inventée | Le patient s'entraîne sur du contenu linguistiquement faux | Garde-fou n°1 (aucun LLM ne génère de contenu clinique) + garde-fou n°3 (aucune traduction sans relecture native sourcée) | Les langues déjà "complètes" (fr, en, es...) n'ont pas toutes été relues par un∙e professionnel∙le de santé natif∙ve — seule la structure grammaticale a été vérifiée |
| Faux sentiment de progrès thérapeutique | Retarde une vraie prise en charge | Bandeau permanent "aide à patienter", garde-fou n°6 (aucune norme clinique chiffrée affichée) | Dépend de la bonne lecture du bandeau par la personne — pas de garde-fou technique qui empêche une mauvaise interprétation |
| Exercice inadapté à un profil clinique à risque (ex. dysphagie) | Risque de fausse route ou d'exercice contre-indiqué | Garde-fou n°2 : aucun exercice de déglutition/dysphagie dans l'app, catégorie entièrement exclue | Le profil clinique déclaré par l'orthophoniste (v6.42) reste facultatif et non vérifié automatiquement |
| Fuite ou accès non autorisé à des données de santé | Atteinte à la confidentialité (RGPD art. 9, donnée sensible) | RLS sur toutes les tables, fonctions `security definer`, audit XSS complet (v6.83), MFA sur les comptes professionnels, version des dépendances figée | Le code de suivi patient reste un facteur unique sans expiration ni limite de tentatives — compromis assumé pour l'accessibilité, documenté comme tel |
| Score ou progression affiché de façon inexacte (bug logiciel) | Décision du patient/aidant/orthophoniste basée sur une donnée fausse | Garde-fou n°5 (aucun score truqué), suite de tests automatisés vérifiant les calculs à chaque livraison | Aucune revue de code par une tierce partie indépendante à ce jour |
| Barrière d'accessibilité excluant la population cible (troubles moteurs/visuels post-AVC) | Le patient qui en a le plus besoin ne peut pas utiliser l'outil | Mode dyslexie, cibles agrandies, contraste renforcé, focus clavier visible, lecteurs d'écran (audit v6.79) | Aucun test réel avec des utilisateurs en situation de handicap à ce jour — uniquement des vérifications automatisées |
| Contenu jamais relu par un professionnel de santé qualifié | L'ensemble du contenu clinique repose sur la rigueur de conception, pas sur une validation externe | Structure pensée avec prudence (garde-fous), mais... | **C'est le risque résiduel le plus important du produit aujourd'hui**, reconnu comme priorité n°1 depuis le début du projet |

---

## 4. Ce qu'il manque encore pour un vrai SMQ (ISO 13485) — honnêtement

La plupart de ce qui suit est **organisationnel, pas technique** —
donc pas quelque chose que je peux construire par du code :

- **Politique qualité et manuel qualité** formels, avec engagement de
  la direction (vous, en tant que porteur du projet)
- **Processus documenté de maîtrise documentaire** (versions
  approuvées, historique des révisions avec signature/validation —
  différent d'un changelog technique)
- **Processus CAPA** (actions correctives et préventives) formalisé,
  avec enregistrements
- **Revue de direction** périodique documentée
- **Gestion des réclamations** et de la matériovigilance (remontée
  d'incidents)
- **Contrôle de conception (design control)** formalisé — le
  processus actuel (garde-fous + tests) s'en rapproche dans l'esprit,
  mais n'est pas formalisé au sens de la norme
- **Personne chargée de veiller au respect de la réglementation**
  (article 15 du MDR) avec les qualifications requises — nécessaire
  dès la qualification en dispositif médical, quelle que soit la
  classe
- **Évaluation clinique** documentée (et potentiellement investigation
  clinique selon la classe) — actuellement, aucune validation clinique
  externe n'existe (voir section 3)

---

## 5. Étapes concrètes pour plus tard, dans l'ordre où elles devraient venir

1. **D'abord, la validation clinique de base** (déjà identifiée comme
   priorité n°1 avant même ce dossier) — trouver un∙e orthophoniste
   pour une vraie relecture du contenu. Sans ça, aucune démarche de
   certification n'a de sens : on ne certifie pas un contenu qui n'a
   jamais été validé par un professionnel.
2. **Décider consciemment de la destination du produit** — rester un
   outil d'accompagnement (hors MDR) ou viser une finalité médicale
   (dans le MDR). Ce choix doit être fait *avant* d'engager un budget
   de certification, pas après.
3. **Si la finalité médicale est confirmée** : consultation avec un∙e
   professionnel∙le QARA pour la qualification/classification réelle
   (pas une estimation faite ici).
4. **Budget et calendrier réalistes** : plusieurs dizaines de milliers
   d'euros et 12 à 24+ mois pour une première certification MDR,
   généralement classe IIa minimum depuis 2021 (organisme notifié
   requis, pas d'auto-certification).
5. **Hébergement certifié HDS** (déjà noté comme question ouverte
   dans `HEBERGEMENT.md`) — à trancher dans tous les cas, indépendant
   du statut MDR, dès qu'il y a de vrais patients.

---

*Document vivant — à mettre à jour à mesure que le registre de risques
évolue et que de nouvelles fonctionnalités sont ajoutées. Voir
`SKILL_ReParole_v6.md` pour l'état technique détaillé du projet.*
