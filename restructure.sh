#!/bin/bash
set -e

cd /Users/koushik/idps-schools
mkdir -p apps/web

echo "Moving mobile apps..."
mv erp-school-app apps/mobile
mv idps-teacher-erp apps/teacher-mobile

echo "Moving web app files..."
shopt -s extglob
mv !(apps|.git|.next|node_modules|.trae|.vscode|firebase.json|firestore.rules|firestore.indexes.json|.firebaserc|serviceAccount.json|README.md|erp_folder_structure.md|restructure.sh) apps/web/

mv .next apps/web/ 2>/dev/null || true
mv node_modules apps/web/ 2>/dev/null || true
mv .env* apps/web/ 2>/dev/null || true
mv .gitignore apps/web/ 2>/dev/null || true

echo "Creating root package.json..."
cat << 'PKG' > package.json
{
  "name": "idps-schools-monorepo",
  "private": true,
  "workspaces": [
    "apps/*"
  ]
}
PKG

echo "Done restructuring."
