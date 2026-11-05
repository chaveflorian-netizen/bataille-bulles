// Bataille de bulles — serveur : lit les événements du live TikTok et les envoie au jeu.
// Lancement : TIKTOK_USER=tonpseudo node server.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

const USER = (process.env.TIKTOK_USER || process.argv[2] || '').replace(/^@/, '');
const PORT = Number(process.env.PORT || 3000);
const SIGN_KEY = process.env.EULER_KEY || null; // optionnel, clé gratuite sur eulerstream.com
if (!USER) { console.error('Indique ton pseudo : TIKTOK_USER=tonpseudo node server.mjs'); process.exit(1); }

const html = await readFile(new URL('./index.html', import.meta.url));
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
});
const wss = new WebSocketServer({ server, path: '/ws' });
let liveOn = false;
const send = (ev) => { const s = JSON.stringify(ev); for (const c of wss.clients) if (c.readyState === 1) c.send(s); };
wss.on('connection', (c) => c.send(JSON.stringify({ type: 'status', connected: liveOn, user: USER })));

// Compatible avec les formats v1 et v2 de tiktok-live-connector
const who = (d) => {
  const u = d.user || d;
  return {
    id: u.uniqueId || u.userId || d.uniqueId,
    name: u.nickname || u.uniqueId || d.nickname || d.uniqueId,
    avatar: u.profilePicture?.url?.[0] || u.profilePicture?.urls?.[0] || u.profilePictureUrl || d.profilePictureUrl || ''
  };
};

const streaks = new Map(); // combos de roses en cours
function bind(conn) {
  conn.on(WebcastEvent.GIFT, (d) => {
    const user = who(d);
    const giftId = d.giftId ?? d.giftDetails?.giftId;
    const gift = d.giftDetails?.giftName || d.giftName || d.extendedGiftInfo?.name || '';
    const diamonds = d.giftDetails?.diamondCount ?? d.diamondCount ?? d.extendedGiftInfo?.diamond_count ?? 0;
    const type = d.giftDetails?.giftType ?? d.giftType;
    const total = d.repeatCount || 1;
    let count = total;
    if (type === 1) { // cadeau en combo : on envoie seulement ce qui est nouveau
      const key = user.id + ':' + giftId;
      count = total - (streaks.get(key) || 0);
      if (d.repeatEnd) streaks.delete(key); else streaks.set(key, total);
    }
    if (count > 0) send({ type: 'gift', user, gift, diamonds, count });
    console.log(`🎁 ${user.name} → ${gift} x${count}`);
  });
  conn.on(WebcastEvent.MEMBER, (d) => send({ type: 'join', user: who(d) }));
  conn.on(WebcastEvent.CHAT, (d) => send({ type: 'chat', user: who(d), text: d.comment }));
  conn.on(WebcastEvent.LIKE, (d) => send({ type: 'like', user: who(d), count: d.likeCount || 1 }));
  conn.on(WebcastEvent.FOLLOW, (d) => send({ type: 'follow', user: who(d) }));
  conn.on(WebcastEvent.SHARE, (d) => send({ type: 'share', user: who(d) }));
  conn.on(WebcastEvent.STREAM_END, () => { liveOn = false; send({ type: 'status', connected: false, user: USER }); });
  conn.on(WebcastEvent.DISCONNECTED, () => {
    liveOn = false; send({ type: 'status', connected: false, user: USER });
    console.log('Déconnecté, nouvel essai dans 10 s'); setTimeout(connect, 10000);
  });
}

async function connect() {
  const conn = new TikTokLiveConnection(USER, { enableExtendedGiftInfo: true, ...(SIGN_KEY ? { signApiKey: SIGN_KEY } : {}) });
  bind(conn);
  try {
    const st = await conn.connect();
    liveOn = true; send({ type: 'status', connected: true, user: USER });
    console.log(`✅ Connecté au live de @${USER} (room ${st.roomId})`);
  } catch (e) {
    conn.removeAllListeners?.();
    console.log(`Live de @${USER} introuvable (${e?.message || e}). Nouvel essai dans 15 s`);
    setTimeout(connect, 15000);
  }
}

server.listen(PORT, () => console.log(`Jeu disponible sur http://<IP-du-VPS>:${PORT}`));
connect();
