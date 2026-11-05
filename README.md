# Bataille de bulles — jeu pour live TikTok

Chaque spectateur devient une bulle avec sa photo. Les cadeaux donnent des pouvoirs :

| Cadeau | Pouvoir | Effet |
|---|---|---|
| 🌹 Rose (1) | Lame scie | Scie autour de la bulle 6 s par rose, elle chasse et vole des points. x10 = scie dorée |
| 🍩 Donut (30) | Éclair | 3 éclairs sur des bulles au hasard |
| 🎮 Manette de jeu (100) | Tempête | Onde de choc qui repousse et frappe tout autour |
| 🌌 Galaxie (1000) | Attaque ultime | Scie géante dorée 12 s + vole 15 % à tout le monde |

Like = petit bonus, abonnement = +50, partage = +20. Une bulle à 0 est éliminée.
Pour changer les cadeaux : bloc RÉGLAGES en haut de index.html.

## Installation sur le VPS
```bash
git clone <ton-dépôt-privé> ~/bataille-bulles   # ou copie les 4 fichiers
cd ~/bataille-bulles
npm install
TIKTOK_USER=tonpseudo node server.mjs
```
Ouvre le port si besoin : `sudo ufw allow 3000/tcp`

## En service permanent (comme memebot)
/etc/systemd/system/bataille.service :
```
[Unit]
Description=Bataille de bulles TikTok
After=network.target

[Service]
WorkingDirectory=/root/bataille-bulles
Environment=TIKTOK_USER=tonpseudo
ExecStart=/usr/bin/node server.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload && sudo systemctl enable --now bataille
journalctl -u bataille -f
```

## Sur l’iPhone
1. Safari → http://IP-DU-VPS:3000 → Partager → « Sur l’écran d’accueil » (plein écran).
2. Active « Ne pas déranger ».
3. TikTok → LIVE → mode partage d’écran (Jeu mobile) → lance le live.
4. Ouvre l’appli « Bataille » : le badge vert « En direct » confirme la connexion.

Sans serveur, la page s’ouvre en mode démo : touche le badge en haut à gauche pour afficher les boutons de test.
