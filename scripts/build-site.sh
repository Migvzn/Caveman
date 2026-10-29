#!/bin/sh
# Assemble le site servi par Vercel dans public/ (lancé par Vercel à chaque déploiement, voir vercel.json) :
#   /           → VAYNORA House (dossier vaynora/)
#   /location/  → l'ancien site de location de voitures (fichiers à la racine du dépôt)
set -e
rm -rf public
mkdir -p public/location
cp -R vaynora/. public/
cp -R index.html standalone.html styles.css script.js assets public/location/
echo "site assemblé dans public/ : $(find public -type f | wc -l) fichiers"
