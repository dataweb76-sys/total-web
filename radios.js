/* ══════════════════════════════════════════
   Radio Pampa AR — radios.js
   Cambiá RADIO_SERVER por la URL del túnel
   Cloudflare cuando lo tengas activo.
   ══════════════════════════════════════════ */

const RADIO_SERVER = 'https://engines-propecia-north-riverside.trycloudflare.com';

// ── Estado ────────────────────────────────
let socket       = null;
let audio        = new Audio();
let isPlaying    = false;
let liveMode     = false;
let muted        = false;
let currentUrl   = null;

let mse = null, mseBuf = null, mseQ = [];
let screenMse = null, screenBuf = null, screenQ = [];

let donateAmount = 1000;

// ── Init ──────────────────────────────────
(function init() {
  const script = document.createElement('script');
  script.src = RADIO_SERVER + '/socket.io/socket.io.js';
  script.onload  = connectSocket;
  script.onerror = () => setConn(false, 'Sin conexión al servidor');
  document.head.appendChild(script);
})();

function connectSocket() {
  socket = io(RADIO_SERVER, { transports: ['websocket', 'polling'] });

  socket.on('connect',    () => setConn(true,  'Conectado'));
  socket.on('disconnect', () => setConn(false, 'Desconectado'));

  socket.on('state_sync', state => {
    if (state.currentTrack) {
      setTrack(state.currentTrack.name || '');
      if (state.currentTrack.url) {
        liveMode = false;
        currentUrl = resolveUrl(state.currentTrack.url);
        audio.src = currentUrl;
      } else {
        liveMode = true;
        currentUrl = null;
      }
      setLive(liveMode);
    }
    if (state.playlist) renderPodcast(state.playlist);
  });

  socket.on('track_change', ({ track }) => {
    if (track && track.url) {
      liveMode = false;
      currentUrl = resolveUrl(track.url);
      setLive(false);
      teardownMSE();
      setTrack(track.name || track.url);
      audio.src = currentUrl;
      if (isPlaying) audio.play().catch(() => {});
    } else if (track) {
      // Modo en vivo: actualizar nombre e indicador pero NO cortar la música
      // todavía — la música se corta cuando llega el primer chunk de audio en vivo
      liveMode = true;
      currentUrl = null;
      setLive(true);
      setTrack(track.name || '🎙️ En Vivo');
      // No llamamos teardownMSE() ni setupMSE() acá — esperamos el primer chunk
    }
  });

  socket.on('status_change', s => setLive(s === 'live'));

  socket.on('live_audio_chunk', chunk => {
    if (!liveMode || !isPlaying) return;
    if (!mse) {
      // Primer chunk: recién acá cortamos la música y arrancamos MSE
      audio.pause();
      audio.src = '';
      teardownMSE();
      setupMSE(true);
    }
    mseQ.push(chunk);
    flushMSE();
  });

  socket.on('chat_message', msg => appendChat(msg.name, msg.text));

  socket.on('video_chunk', chunk => {
    initVideoMSE();
    screenQ.push(chunk);
    flushVideoNow();
  });

  socket.on('screen_share_stop', () => {
    document.getElementById('videoWrap').classList.remove('visible');
    document.getElementById('adSlot').style.display = '';
    const vid = document.getElementById('vidEl');
    vid.pause(); vid.src = '';
    screenMse = null; screenBuf = null; screenQ = [];
  });

  // ad_play: publicidad de la biblioteca (audio o video)
  socket.on('ad_play', ad => {
    if (!ad) return;
    const slot   = document.getElementById('adSlot');
    const wrap   = document.getElementById('videoWrap');
    const vidEl  = document.getElementById('vidEl');
    const adUrl  = resolveUrl(ad.url);

    if (ad.type === 'video') {
      // Mostrar video directamente (archivo estático, no MSE)
      slot.style.display = 'none';
      wrap.classList.add('visible');
      // Resetear MSE de pantalla si había uno activo
      screenMse = null; screenBuf = null; screenQ = [];
      vidEl.src = adUrl;
      vidEl.play().catch(() => {});
      vidEl.onended = () => {
        wrap.classList.remove('visible');
        slot.style.display = '';
        vidEl.src = '';
      };
    } else {
      // Audio: mostrar nombre y reproducir en segundo plano
      slot.style.display = '';
      slot.innerHTML = `<span style="font-size:2rem">📢</span><p class="ad-name">${esc(ad.name)}</p>`;
      const adAudio = new Audio(adUrl);
      adAudio.volume = audio.volume;
      adAudio.play().catch(() => {});
    }
  });

  // ad_broadcast: publicidad de texto/banner enviada desde el panel admin
  socket.on('ad_broadcast', data => {
    if (!data) return;
    const slot = document.getElementById('adSlot');
    slot.style.display = '';
    let html = '';
    if (data.banner) html += `<img src="${resolveUrl(data.banner)}" alt="Publicidad" style="max-width:100%;border-radius:8px">`;
    if (data.text)   html += `<p class="ad-name" style="font-size:1.1rem;padding:8px">${esc(data.text)}</p>`;
    if (html) slot.innerHTML = html;
  });
}

// ── Player ────────────────────────────────
function togglePlay() {
  if (isPlaying) pause(); else play();
}

function play() {
  isPlaying = true;
  const btn = document.getElementById('btnPlay');
  btn.textContent = '⏸ Pausar';
  btn.classList.remove('paused');
  document.getElementById('trackEq').classList.add('active');
  if (liveMode) {
    teardownMSE();
    setupMSE(true);
  } else {
    if (currentUrl && audio.src !== currentUrl) audio.src = currentUrl;
    audio.play().catch(() => {});
  }
}

function pause() {
  isPlaying = false;
  const btn = document.getElementById('btnPlay');
  btn.textContent = '▶ Escuchar';
  btn.classList.add('paused');
  document.getElementById('trackEq').classList.remove('active');
  audio.pause();
  teardownMSE();
}

function setVol(v) {
  audio.volume = parseFloat(v);
  muted = false;
  document.getElementById('volIcon').textContent = v > 0 ? '🔊' : '🔇';
}

function toggleMute() {
  muted = !muted;
  audio.muted = muted;
  document.getElementById('volIcon').textContent = muted ? '🔇' : '🔊';
}

// ── MSE audio ─────────────────────────────
function setupMSE(autoplay = false) {
  if (!window.MediaSource || mse) return;
  mse = new MediaSource();
  const thisMse = mse;
  audio.src = URL.createObjectURL(mse);
  const mime = 'audio/webm;codecs=opus';
  mse.addEventListener('sourceopen', () => {
    if (mse !== thisMse || thisMse.readyState !== 'open') return;
    if (mseBuf) return;
    if (!MediaSource.isTypeSupported(mime)) return;
    mseBuf = mse.addSourceBuffer(mime);
    mseBuf.mode = 'sequence';
    mseBuf.addEventListener('updateend', flushMSE);
    flushMSE();
  });
  if (autoplay) {
    audio.addEventListener('canplay', function onCp() {
      audio.removeEventListener('canplay', onCp);
      audio.play().catch(() => {});
    });
  }
}

function teardownMSE() {
  mse = null; mseBuf = null; mseQ = [];
  audio.pause(); audio.src = '';
}

function flushMSE() {
  if (!mseBuf || mseBuf.updating || mseQ.length === 0) return;
  try { const c = mseQ.shift(); mseBuf.appendBuffer(c instanceof ArrayBuffer ? c : c.buffer); } catch(e) {}
}

// ── MSE video ─────────────────────────────
function initVideoMSE() {
  if (screenMse) return;
  const vid  = document.getElementById('vidEl');
  const wrap = document.getElementById('videoWrap');
  wrap.classList.add('visible');
  document.getElementById('adSlot').style.display = 'none';

  screenMse = new MediaSource();
  const thisMs = screenMse;
  vid.src = URL.createObjectURL(screenMse);

  screenMse.addEventListener('sourceopen', () => {
    if (screenMse !== thisMs || thisMs.readyState !== 'open') return;
    if (screenBuf) return;
    const m = 'video/webm';
    if (!MediaSource.isTypeSupported(m)) return;
    screenBuf = screenMse.addSourceBuffer(m);
    screenBuf.mode = 'sequence';
    screenBuf.addEventListener('updateend', flushVideoNow);
    flushVideoNow();
  });

  vid.addEventListener('canplay', function onCp() {
    vid.removeEventListener('canplay', onCp);
    vid.play().catch(() => {});
  });
}

function flushVideoNow() {
  if (!screenBuf || screenBuf.updating || screenQ.length === 0) return;
  try {
    const c = screenQ.shift();
    screenBuf.appendBuffer(c instanceof ArrayBuffer ? c : c.buffer);
  } catch(e) {}
}

// ── Chat ──────────────────────────────────
function sendChat(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const name  = document.getElementById('chatName').value.trim() || 'Oyente';
  const text  = input.value.trim();
  if (!text || !socket) return;
  socket.emit('chat_message', { name, text });
  input.value = '';
}

function appendChat(name, text) {
  const box = document.getElementById('chatMessages');
  const empty = box.querySelector('.chat-empty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="chat-msg-name">${esc(name)}</span><span class="chat-msg-text">${esc(text)}</span>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ── Donaciones ────────────────────────────
function selectAmount(val) {
  donateAmount = val;
  document.getElementById('donateAmount').value = val;
  document.querySelectorAll('.donate-opt').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

function openDonation() {
  const amount = parseInt(document.getElementById('donateAmount').value) || donateAmount;
  // Reemplazá con tu link de Mercado Pago o el webhook que prefieras
  const waMsg = encodeURIComponent(`Hola! Quiero donar $${amount} a Radio Pampa AR 💜`);
  window.open(`https://wa.me/5492954320639?text=${waMsg}`, '_blank');
}

// ── Podcast ───────────────────────────────
function renderPodcast(playlist) {
  const list = document.getElementById('podcastList');
  if (!playlist || playlist.length === 0) return;
  list.innerHTML = playlist.slice(0, 12).map((ep, i) => `
    <div class="ep-item">
      <div class="ep-num">${i + 1}</div>
      <div class="ep-name">${esc(ep.name || ep.url || 'Episodio ' + (i + 1))}</div>
    </div>
  `).join('');
}

// ── UI helpers ────────────────────────────
function setConn(on, txt) {
  document.getElementById('connDot').classList.toggle('on', on);
  document.getElementById('connText').textContent = txt;
  document.getElementById('btnPlay').disabled = !on;
  document.getElementById('chatInput').disabled = !on;
  document.getElementById('chatSend').disabled  = !on;
}

function setTrack(name) {
  document.getElementById('trackName').textContent = name || '—';
}

function setLive(on) {
  document.getElementById('liveBadge').classList.toggle('visible', on);
  document.getElementById('heroDot').classList.toggle('active', on);
}

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return RADIO_SERVER + (url.startsWith('/') ? '' : '/') + url;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
