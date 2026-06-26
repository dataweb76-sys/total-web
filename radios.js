/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Radio Pampa AR â€” radios.js
   CambiÃ¡ RADIO_SERVER por la URL del tÃºnel
   Cloudflare cuando lo tengas activo.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const RADIO_SERVER = 'https://website-imported-medicines-interactions.trycloudflare.com';

// â”€â”€ Estado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let socket       = null;
let audio        = new Audio();
let isPlaying    = false;
let liveMode     = false;
let muted        = false;
let currentUrl   = null;

let mse = null, mseBuf = null, mseQ = [];
let screenMse = null, screenBuf = null, screenQ = [];

let donateAmount = 1000;

// â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function init() {
  const script = document.createElement('script');
  script.src = RADIO_SERVER + '/socket.io/socket.io.js';
  script.onload  = connectSocket;
  script.onerror = () => setConn(false, 'Sin conexiÃ³n al servidor');
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
        const newUrl = resolveUrl(state.currentTrack.url);
        // Solo actualizar src si no estÃ¡ reproduciendo ya esta misma pista
        if (!isPlaying || currentUrl !== newUrl) {
          currentUrl = newUrl;
          if (!isPlaying) audio.src = currentUrl;
        }
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
      setTrack(track.name || track.url);
      if (isPlaying) {
        // Limpiar estado MSE sin matar el audio (el crossfade lo va a ir bajando suave)
        mse = null; mseBuf = null; mseQ = [];
        crossfadeTo(currentUrl);
      } else {
        teardownMSE();
        audio.src = currentUrl;
      }
    } else if (track) {
      liveMode = true;
      currentUrl = null;
      setLive(true);
      setTrack(track.name || 'ðŸŽ™ï¸ En Vivo');
    }
  });

  socket.on('status_change', s => setLive(s === 'live'));

  socket.on('live_audio_chunk', chunk => {
    if (!liveMode || !isPlaying) return;
    if (!mse) {
      // Primer chunk: reciÃ©n acÃ¡ cortamos la mÃºsica y arrancamos MSE
      audio.pause();
      audio.src = '';
      teardownMSE();
      setupMSE(true);
    }
    mseQ.push(chunk);
    flushMSE();
  });

  socket.on('chat_message', msg => appendChat(msg.user || msg.name, msg.text));

  socket.on('video_chunk', chunk => {
    initVideoMSE();
    screenQ.push(chunk);
    flushVideoNow();
  });

  socket.on('banner_show', data => {
    const strip = document.getElementById('bannerStrip');
    const txt   = document.getElementById('bannerText');
    if (!strip || !txt) return;
    txt.textContent = data.text || '';
    strip.classList.add('visible');
  });

  socket.on('music_duck', level => {
    audio.volume = Math.min(1, Math.max(0, Number(level) || 0));
    const sl = document.getElementById('volSlider');
    if (sl) sl.value = audio.volume;
  });

  // â”€â”€ Podcast mic: canal separado sobre la mÃºsica â”€â”€â”€â”€â”€â”€â”€â”€
  let audioMic = null, mseMic = null, mseBufMic = null, mseQMic = [];

  socket.on('podcast_start', ({ duck, name }) => {
    // Bajar mÃºsica sin cortarla
    const vol = Math.min(1, Math.max(0, Number(duck) || 0.3));
    audio.volume = vol;
    const sl = document.getElementById('volSlider');
    if (sl) sl.value = vol;
    if (name) setTrack(name);
    setupMicMSE();
  });

  socket.on('podcast_mic_chunk', chunk => {
    if (!isPlaying) return;
    if (!mseMic) setupMicMSE();
    mseQMic.push(chunk instanceof ArrayBuffer ? chunk : chunk.buffer);
    flushMicMSE();
  });

  socket.on('podcast_duck', level => {
    audio.volume = Math.min(1, Math.max(0, Number(level) || 0));
    const sl = document.getElementById('volSlider');
    if (sl) sl.value = audio.volume;
  });

  socket.on('podcast_stop', () => {
    teardownMicMSE();
    audio.volume = 1;
    const sl = document.getElementById('volSlider');
    if (sl) sl.value = 1;
  });

  function setupMicMSE() {
    if (mseMic || !window.MediaSource) return;
    audioMic = new Audio();
    audioMic.autoplay = true;
    mseMic = new MediaSource();
    const thisMse = mseMic;
    audioMic.src = URL.createObjectURL(mseMic);
    // Intentar play de inmediato para heredar el contexto de audio activo de la pÃ¡gina
    audioMic.play().catch(() => {});
    const mime = 'audio/webm;codecs=opus';
    mseMic.addEventListener('sourceopen', () => {
      if (mseMic !== thisMse || thisMse.readyState !== 'open' || mseBufMic) return;
      if (!MediaSource.isTypeSupported(mime)) return;
      mseBufMic = mseMic.addSourceBuffer(mime);
      mseBufMic.mode = 'sequence';
      mseBufMic.addEventListener('updateend', flushMicMSE);
      flushMicMSE();
    });
    audioMic.addEventListener('canplay', () => audioMic.play().catch(() => {}));
    audioMic.addEventListener('pause', () => {
      // Si el browser pausÃ³ por polÃ­tica de autoplay, reintentar
      if (mseBufMic) audioMic.play().catch(() => {});
    });
  }

  function teardownMicMSE() {
    if (audioMic) { audioMic.pause(); audioMic.src = ''; audioMic = null; }
    mseMic = null; mseBufMic = null; mseQMic = [];
  }

  function flushMicMSE() {
    if (!mseBufMic || mseBufMic.updating || mseQMic.length === 0) return;
    try { mseBufMic.appendBuffer(mseQMic.shift()); } catch(e) {}
  }

  socket.on('video_stream_start', () => {
    const vid = document.getElementById('vidEl');
    if (vid) { vid.pause(); vid.src = ''; vid.load(); }
    screenMse = null; screenBuf = null; screenQ = [];
  });

  socket.on('screen_share_stop', () => {
    document.getElementById('camCard').classList.remove('visible');
    const vid = document.getElementById('vidEl');
    vid.pause(); vid.src = '';
    screenMse = null; screenBuf = null; screenQ = [];
  });

  const AD_SLOT_DEFAULT = `<span style="font-size:1.8rem">ðŸ“¡</span><span>Espacio publicitario</span><span style="font-size:.72rem">Contactanos para publicitar en la radio</span>`;

  // ad_play: publicidad de la biblioteca (audio o video)
  socket.on('ad_play', ad => {
    if (!ad) return;
    const slot  = document.getElementById('adSlot');
    const adUrl = resolveUrl(ad.url);

    if (ad.type === 'video') {
      const v = document.createElement('video');
      v.autoplay = true; v.playsinline = true; v.controls = true;
      v.style.cssText = 'width:100%;border-radius:10px;max-height:220px;display:block';
      v.src = adUrl;
      slot.innerHTML = `<p class="ad-name" style="margin-bottom:8px">ðŸ“¢ ${esc(ad.name)}</p>`;
      slot.appendChild(v);
      v.play().catch(() => {});
      v.onended = () => { slot.innerHTML = AD_SLOT_DEFAULT; };
    } else {
      // Audio publicitario â†’ muestra nombre, reproduce en segundo plano
      slot.innerHTML = `<span style="font-size:2rem">ðŸ“¢</span><p class="ad-name">${esc(ad.name)}</p>`;
      const adAudio = new Audio(adUrl);
      adAudio.volume = audio.volume;
      adAudio.play().catch(() => {});
      adAudio.onended = () => { slot.innerHTML = AD_SLOT_DEFAULT; };
    }
  });

  // ad_broadcast: publicidad de texto/banner enviada desde el panel admin
  socket.on('ad_broadcast', data => {
    if (!data) return;
    const slot = document.getElementById('adSlot');
    let html = '';
    if (data.banner) html += `<img src="${resolveUrl(data.banner)}" alt="Publicidad" style="max-width:100%;border-radius:8px;margin-bottom:8px">`;
    if (data.text)   html += `<p class="ad-name" style="font-size:1.1rem;padding:8px 0">${esc(data.text)}</p>`;
    if (html) slot.innerHTML = html;
  });
}

// â”€â”€ Player â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function togglePlay() {
  if (isPlaying) pause(); else play();
}

function play() {
  isPlaying = true;
  const btn = document.getElementById('btnPlay');
  btn.textContent = 'â¸ Pausar';
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
  btn.textContent = 'â–¶ Escuchar';
  btn.classList.add('paused');
  document.getElementById('trackEq').classList.remove('active');
  audio.pause();
  teardownMSE();
}

function setVol(v) {
  audio.volume = parseFloat(v);
  muted = false;
  document.getElementById('volIcon').textContent = v > 0 ? 'ðŸ”Š' : 'ðŸ”‡';
}

function toggleMute() {
  muted = !muted;
  audio.muted = muted;
  document.getElementById('volIcon').textContent = muted ? 'ðŸ”‡' : 'ðŸ”Š';
}

// â”€â”€ Crossfade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function crossfadeTo(url) {
  const next = new Audio();
  next.volume = 0;
  next.src = url;
  next.play().catch(() => {});

  const FADE_MS = 3000, TICK = 80;
  const steps = FADE_MS / TICK;
  let step = 0;
  const oldAudio = audio;
  const savedVol = oldAudio.volume;

  // Reasignar `audio` de inmediato: setVol/mute/pause ya controlan la nueva pista
  audio = next;

  const tid = setInterval(() => {
    step++;
    const t = Math.min(1, step / steps);
    next.volume = savedVol * t;
    oldAudio.volume = savedVol * (1 - t);
    if (t >= 1) {
      clearInterval(tid);
      oldAudio.pause();
      oldAudio.src = '';
    }
  }, TICK);
}

// â”€â”€ MSE audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ MSE video â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let screenStallHandler = null;

function initVideoMSE() {
  if (screenMse && screenMse.readyState === 'ended') {
    screenMse = null; screenBuf = null; screenQ = [];
  }
  if (screenMse) return;
  if (!window.MediaSource) return;

  const vid  = document.getElementById('vidEl');
  const card = document.getElementById('camCard');
  if (!vid || !card) return;

  const mimes = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'];
  const m = mimes.find(x => MediaSource.isTypeSupported(x));
  if (!m) return;

  card.classList.add('visible');

  // Reemplazar stall handler anterior para no acumular listeners
  if (screenStallHandler) {
    vid.removeEventListener('waiting', screenStallHandler);
    vid.removeEventListener('stalled', screenStallHandler);
  }
  screenStallHandler = () => {
    if (!screenBuf || !screenBuf.buffered.length) return;
    const bufEnd = screenBuf.buffered.end(0);
    if (bufEnd > vid.currentTime + 0.5) vid.currentTime = bufEnd - 0.1;
    vid.play().catch(() => {});
  };
  vid.addEventListener('waiting', screenStallHandler);
  vid.addEventListener('stalled', screenStallHandler);

  screenMse = new MediaSource();
  const thisMs = screenMse;
  vid.src = URL.createObjectURL(screenMse);

  screenMse.addEventListener('sourceopen', () => {
    if (screenMse !== thisMs || thisMs.readyState !== 'open') return;
    if (screenBuf) return;
    try {
      screenBuf = screenMse.addSourceBuffer(m);
      screenBuf.mode = 'sequence';
      screenBuf.addEventListener('updateend', flushVideoNow);
      flushVideoNow();
    } catch(e) {
      screenMse = null; screenBuf = null; screenQ = [];
    }
  });

  screenMse.addEventListener('sourceclose', () => {
    if (screenMse === thisMs) { screenMse = null; screenBuf = null; }
  });

  vid.onerror = () => {
    if (screenMse === thisMs) { screenMse = null; screenBuf = null; screenQ = []; }
  };

  vid.addEventListener('canplay', function onCp() {
    vid.removeEventListener('canplay', onCp);
    vid.play().catch(() => {});
  });

  // Watchdog: cada 800ms forzar play si hay buffer pero estÃ¡ pausado
  const watchdog = setInterval(() => {
    if (screenMse !== thisMs) { clearInterval(watchdog); return; }
    if (vid.paused && screenBuf && screenBuf.buffered.length > 0) {
      vid.play().catch(() => {});
    }
  }, 800);
}

function flushVideoNow() {
  if (!screenBuf || screenBuf.updating || screenQ.length === 0) return;
  try {
    const vid = document.getElementById('vidEl');
    if (vid && screenBuf.buffered.length > 0) {
      const bufEnd   = screenBuf.buffered.end(0);
      const bufStart = screenBuf.buffered.start(0);
      const ct       = vid.currentTime;
      if (bufEnd - ct > 3) vid.currentTime = bufEnd - 0.1;
      // Solo limpiar cuando el buffer acumula >10s para no interrumpir el append
      if (bufEnd - bufStart > 10) {
        const removeEnd = Math.max(bufStart, ct - 2);
        if (removeEnd > bufStart + 1) {
          screenBuf.remove(bufStart, removeEnd);
          return;
        }
      }
    }
    const c = screenQ.shift();
    screenBuf.appendBuffer(c instanceof ArrayBuffer ? c : c.buffer);
    // Forzar play en mobile donde autoplay a veces no dispara
    const vid2 = document.getElementById('vidEl');
    if (vid2 && vid2.paused && vid2.readyState >= 2) vid2.play().catch(() => {});
  } catch(e) {
    if (e.name === 'QuotaExceededError') {
      screenQ.length = 0;
      if (!screenBuf.updating && screenBuf.buffered.length > 0) {
        try { screenBuf.remove(screenBuf.buffered.start(0), screenBuf.buffered.end(0)); } catch(_) {}
      }
    }
  }
}

// â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Donaciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function selectAmount(val) {
  donateAmount = val;
  document.getElementById('donateAmount').value = val;
  document.querySelectorAll('.donate-opt').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

function openDonation() {
  const amount = parseInt(document.getElementById('donateAmount').value) || donateAmount;
  // ReemplazÃ¡ con tu link de Mercado Pago o el webhook que prefieras
  const waMsg = encodeURIComponent(`Hola! Quiero donar $${amount} a Radio Pampa AR ðŸ’œ`);
  window.open(`https://wa.me/5492954320639?text=${waMsg}`, '_blank');
}

// â”€â”€ Podcast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ UI helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setConn(on, txt) {
  document.getElementById('connDot').classList.toggle('on', on);
  document.getElementById('connText').textContent = txt;
  document.getElementById('btnPlay').disabled = !on;
  document.getElementById('chatInput').disabled = !on;
  document.getElementById('chatSend').disabled  = !on;
}

function setTrack(name) {
  document.getElementById('trackName').textContent = name || 'â€”';
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

// â”€â”€ Clima / DÃ³lar / Noticias â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _WMO = {0:'Despejado â˜€ï¸',1:'Casi despejado ðŸŒ¤ï¸',2:'Parcialmente nublado â›…',3:'Nublado â˜ï¸',45:'Niebla ðŸŒ«ï¸',48:'Niebla con escarcha ðŸŒ«ï¸',51:'Llovizna ligera ðŸŒ¦ï¸',53:'Llovizna moderada ðŸŒ¦ï¸',55:'Llovizna densa ðŸŒ§ï¸',61:'Lluvia ligera ðŸŒ§ï¸',63:'Lluvia moderada ðŸŒ§ï¸',65:'Lluvia intensa ðŸŒ§ï¸',71:'Nieve ligera ðŸŒ¨ï¸',73:'Nieve moderada ðŸŒ¨ï¸',75:'Nieve intensa â„ï¸',80:'Chaparrones ligeros ðŸŒ¦ï¸',81:'Chaparrones moderados ðŸŒ§ï¸',82:'Chaparrones intensos â›ˆï¸',85:'Nevadas ligeras ðŸŒ¨ï¸',86:'Nevadas intensas â„ï¸',95:'Tormenta â›ˆï¸',96:'Tormenta con granizo â›ˆï¸',99:'Tormenta con granizo fuerte â›ˆï¸'};

function initClima() {
  const el = document.getElementById('twClima');
  if (!el) return;
  const show = (lat, lon, city) => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`)
      .then(r => r.json()).then(d => {
        const w = d.current_weather;
        const desc = _WMO[w.weathercode] || 'Clima';
        const hIdx = d.hourly.time.findIndex(t => t.startsWith(new Date().toISOString().slice(0,13)));
        const hum = hIdx >= 0 ? d.hourly.relativehumidity_2m[hIdx] : 'â€”';
        el.innerHTML = `<div class="tw-temp">${Math.round(w.temperature)}Â°C</div>
          <div class="tw-desc">${desc}</div>
          <div class="tw-meta">${city} Â· Viento ${w.windspeed} km/h Â· Hum ${hum}%</div>`;
      }).catch(() => { el.innerHTML = '<div class="tw-meta">No se pudo obtener el clima</div>'; });
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => {
        const {latitude: lat, longitude: lon} = p.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          .then(r=>r.json()).then(d => show(lat, lon, d.address?.city || d.address?.town || d.address?.village || 'Tu ciudad'))
          .catch(() => show(lat, lon, 'Tu ciudad'));
      },
      () => show(-36.6167, -64.2833, 'Santa Rosa')
    );
  } else { show(-36.6167, -64.2833, 'Santa Rosa'); }
}

function loadDolar() {
  const el = document.getElementById('twDolar');
  const upd = document.getElementById('twDolarUpd');
  if (!el) return;
  fetch('https://dolarapi.com/v1/dolares')
    .then(r => r.json()).then(arr => {
      const get = casa => arr.find(d => d.casa === casa) || {};
      const tipos = [
        {n: 'Blue',    v: get('blue').venta,    c: get('blue').compra},
        {n: 'Oficial', v: get('oficial').venta,  c: get('oficial').compra},
        {n: 'Tarjeta', v: get('tarjeta').venta,  c: get('tarjeta').compra},
      ].filter(t => t.v);
      el.innerHTML = tipos.map(t => `
        <div class="tw-drow">
          <span>${t.n}</span>
          <div style="text-align:right">
            <div class="tw-dventa">$${t.v}</div>
            <div class="tw-dcompra">Compra $${t.c}</div>
          </div>
        </div>`).join('');
      if (upd) upd.textContent = new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    }).catch(() => { el.innerHTML = '<div class="tw-meta">No disponible</div>'; });
}

let _twNoticias = [];
function loadNoticias() {
  const upd = document.getElementById('twNewsUpd');
  const el  = document.getElementById('twNewsList');
  fetch(RADIO_SERVER + '/api/news')
    .then(r => r.json()).then(d => {
      _twNoticias = d.noticias || d;
      twRender('');
      if (upd) upd.textContent = new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    }).catch(() => {
      if (el) el.innerHTML = '<p style="color:#888;font-size:.82rem">No se pudieron cargar las noticias</p>';
    });
}

function twFilter(btn, cat) {
  document.querySelectorAll('.tw-nf').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  twRender(cat);
}

function twRender(cat) {
  const el = document.getElementById('twNewsList');
  if (!el) return;
  const items = cat ? _twNoticias.filter(n => n.categoria === cat) : _twNoticias;
  if (!items.length) { el.innerHTML = '<p style="color:#888;font-size:.82rem">Sin noticias en esta categoria</p>'; return; }
  el.innerHTML = items.map(n => `
    <a class="tw-ni cat-${n.categoria||'nacional'}" href="${n.url||n.link||'#'}" target="_blank" rel="noopener">
      <div class="tw-ni-meta">${n.fuente||''} - ${n.categoria||''}</div>
      <div class="tw-ni-title">${n.titulo||n.title||''}</div>
      ${(n.resumen||n.description) ? `<div class="tw-ni-desc">${(n.resumen||n.description).slice(0,120)}...</div>` : ''}
    </a>`).join('');
}

// â”€â”€ Arrancar al cargar â”€â”€
document.addEventListener('DOMContentLoaded', () => {
  initClima();
  loadDolar();
  loadNoticias();
});

