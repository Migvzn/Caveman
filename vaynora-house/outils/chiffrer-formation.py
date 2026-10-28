#!/usr/bin/env python3
"""Chiffre le pack de formation pour l'Espace équipe du site (vaynora/equipe.html).

Usage :  python3 vaynora-house/outils/chiffrer-formation.py "VOTRE-CODE-D-ACCES"
Entrée : vaynora-house/2-FORMATION-OFM/vaynora-formation-pack.json
Sortie : vaynora/formation.enc.json  (AES-256-GCM, clé dérivée du code par PBKDF2-SHA256)

Changer le code = relancer ce script avec un nouveau code, puis publier.
Ne jamais écrire le code d'accès dans le dépôt.
"""
import base64, gzip, json, os, sys
from pathlib import Path
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'vaynora-house/2-FORMATION-OFM/vaynora-formation-pack.json'
OUT = ROOT / 'vaynora/formation.enc.json'
ITER = 310_000

def main():
    if len(sys.argv) != 2 or len(sys.argv[1].strip()) < 10:
        sys.exit('Indiquez un code d\'accès d\'au moins 10 caractères.')
    code = sys.argv[1].strip().encode()
    data = gzip.compress(SRC.read_bytes(), compresslevel=9, mtime=0)
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(code)
    ct = AESGCM(key).encrypt(iv, data, None)
    b = lambda x: base64.b64encode(x).decode()
    OUT.write_text(json.dumps({'v': 1, 'kdf': 'PBKDF2-SHA256', 'iter': ITER, 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}))
    print(f'OK : {OUT} ({OUT.stat().st_size // 1024} Ko)')

if __name__ == '__main__':
    main()
