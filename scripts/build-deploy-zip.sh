#!/usr/bin/env bash
# =====================================================================
#  build-deploy-zip.sh — construit le ZIP de déploiement de ReParole
# ---------------------------------------------------------------------
#  POURQUOI CE SCRIPT EXISTE : le déploiement se fait en déposant un ZIP
#  chez l'hébergeur. Le dépôt ne contient que des *placeholders* dans
#  audio/ (2 README), alors que l'hébergeur contient les VRAIS fichiers
#  de voix générés. Un ZIP qui inclut audio/ écrase donc les voix en
#  production. Jusqu'ici, la protection reposait sur la discipline
#  (documentée dans HEBERGEMENT.md) ; ce script la rend automatique :
#  audio/ est TOUJOURS exclu du ZIP de déploiement.
#
#  Usage :   bash scripts/build-deploy-zip.sh
#  Sortie :  reparole-deploy-v<version>.zip à la racine du projet
#            (version lue depuis CACHE_NAME dans sw.js)
#
#  NOTE : ceci est le ZIP DE DÉPLOIEMENT (hébergeur). Il exclut aussi
#  les tests et la config CI, inutiles en production. Pour une archive
#  complète du dépôt, utilisez git.
# =====================================================================
set -euo pipefail

# Toujours travailler depuis la racine du projet (parent de scripts/)
cd "$(dirname "$0")/.."

# 1. Garde-fou : la suite de tests doit être verte avant tout déploiement.
if [ -d node_modules ]; then
  echo "— Lancement des tests avant construction…"
  if ! npm test >/tmp/reparole-deploy-tests.log 2>&1; then
    echo "✘ Les tests échouent — déploiement refusé."
    echo "  Détail : /tmp/reparole-deploy-tests.log"
    exit 1
  fi
  echo "✔ Tests verts."
else
  echo "⚠ node_modules absent : tests non lancés (npm install pour les activer)."
fi

# 2. Version depuis sw.js (source de vérité du cache PWA)
VERSION=$(grep -oE "reparole-v[0-9]+-[0-9]+" sw.js | head -1 | sed 's/^reparole-//' || true)
if [ -z "$VERSION" ]; then
  echo "✘ Impossible de lire CACHE_NAME dans sw.js" ; exit 1
fi
OUT="reparole-deploy-${VERSION}.zip"

# 3. Construction — exclusions :
#    audio/*        -> JAMAIS déployé (protège les voix de l'hébergeur)
#    node_modules/  -> dépendances de dev
#    .git/ .github/ -> dépôt et CI
#    tests/ scripts/-> outillage de dev, inutile en prod
#    docs/          -> demandes de traduction internes
rm -f "$OUT"
zip -r -q -X "$OUT" . \
  -x "audio/*" -x "img/*" \
  -x "node_modules/*" \
  -x ".git/*" -x ".github/*" \
  -x "tests/*" -x "scripts/*" \
  -x "docs/*" \
  -x "*.DS_Store" -x "*/.DS_Store" \
  -x "reparole-deploy-*.zip"

# 4. Vérifications finales — on échoue bruyamment plutôt que de laisser
#    partir un mauvais ZIP.
#    NOTE : on capture la liste UNE fois puis on greppe la variable.
#    (grep -q directement sur le pipe + `set -o pipefail` = faux échecs :
#    grep -q quitte dès la ligne trouvée, unzip reçoit un SIGPIPE, et le
#    pipeline est déclaré en erreur alors que le fichier est bien là.)
LISTING=$(unzip -l "$OUT")
if grep -q " audio/" <<<"$LISTING"; then
  echo "✘ ERREUR : audio/ présent dans le ZIP — abandon." ; rm -f "$OUT" ; exit 1
fi
if grep -q "node_modules/" <<<"$LISTING"; then
  echo "✘ ERREUR : node_modules/ présent dans le ZIP — abandon." ; rm -f "$OUT" ; exit 1
fi
for f in index.html dashboard-ortho.html aidant.html sw.js manifest.json; do
  if ! grep -qE " $f\$" <<<"$LISTING"; then
    echo "✘ ERREUR : $f manquant dans le ZIP — abandon." ; rm -f "$OUT" ; exit 1
  fi
done

echo "✔ $OUT prêt ($(du -h "$OUT" | cut -f1))."
echo "  audio/ exclu : les voix de l'hébergeur ne seront pas écrasées."
echo "  Rappel : après dépôt, vérifier que le site répond et que la"
echo "  bannière de mise à jour propose bien ${VERSION}."
