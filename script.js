// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Mobile hamburger ──
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ── Form validation & submit ──
const form       = document.getElementById('consultaForm');
const btnSubmit  = document.getElementById('btnSubmit');
const btnText    = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const formSuccess = document.getElementById('formSuccess');

function showError(id, msg) {
  const el = document.getElementById('err-' + id);
  if (el) el.textContent = msg;
}
function clearErrors() {
  ['nombre','email','servicio','mensaje'].forEach(id => showError(id, ''));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const nombre   = form.nombre.value.trim();
  const email    = form.email.value.trim();
  const servicio = form.servicio.value;
  const mensaje  = form.mensaje.value.trim();

  let valid = true;
  if (!nombre)  { showError('nombre',  'Por favor ingresá tu nombre.');       valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('email', 'Ingresá un email válido.');
    valid = false;
  }
  if (!servicio) { showError('servicio', 'Seleccioná un servicio.');            valid = false; }
  if (!mensaje || mensaje.length < 10) {
    showError('mensaje', 'Contanos un poco más sobre tu proyecto (mín. 10 caracteres).');
    valid = false;
  }
  if (!valid) return;

  // Simulate sending
  btnSubmit.disabled = true;
  btnText.textContent = 'Enviando...';
  btnSpinner.classList.remove('hidden');

  await new Promise(r => setTimeout(r, 1800));

  form.classList.add('hidden');
  formSuccess.classList.remove('hidden');
});

// ── Hero Dinámico ──
(function () {
  const SLIDES = [
    {
      icon: '🛒', label: 'Tienda Online', url: 'tu-tienda.com',
      siteType: 'tienda online', color: '#f97316', glow: 'rgba(249,115,22,0.18)',
      html: `<div style="background:#0a0806;height:100%;font-family:Arial,sans-serif;overflow:hidden">
        <div style="background:#111;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #f97316">
          <span style="color:#f97316;font-weight:800;font-size:12px">👗 MiModa</span>
          <div style="display:flex;gap:7px;align-items:center">
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Novedades</span>
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Rebajas</span>
            <span style="background:#f97316;color:#000;font-size:8px;font-weight:700;padding:2px 7px;border-radius:4px">🛒 3</span>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#1a0a00,#2d1500);padding:14px 12px;text-align:center">
          <div style="font-size:8px;color:#f97316;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">OFERTA ESPECIAL</div>
          <div style="font-size:22px;font-weight:900;color:#fff;line-height:1">50% OFF</div>
          <div style="font-size:9px;color:rgba(255,255,255,.55);margin:4px 0 8px">en toda la colección de invierno</div>
          <div style="display:inline-block;background:#f97316;color:#000;font-size:8px;font-weight:700;padding:4px 12px;border-radius:20px">VER COLECCIÓN →</div>
        </div>
        <div style="padding:8px 12px">
          <div style="font-size:8px;color:rgba(255,255,255,.35);margin-bottom:6px;letter-spacing:1px">LO MÁS VENDIDO</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
            ${['👜','👟','🧥'].map((e,i)=>`<div style="background:#1a1a2a;border-radius:6px;overflow:hidden"><div style="height:55px;background:linear-gradient(135deg,#1e1e3a,#2d2d50);display:flex;align-items:center;justify-content:center;font-size:22px">${e}</div><div style="padding:5px 6px"><div style="font-size:7px;color:rgba(255,255,255,.6)">${['Cartera Premium','Zapatillas Sport','Campera Slim'][i]}</div><div style="font-size:9px;font-weight:700;color:#f97316">$${['45.990','89.990','129.990'][i]}</div></div></div>`).join('')}
          </div>
        </div>
      </div>`
    },
    {
      icon: '🏋️', label: 'Gimnasio / Fitness', url: 'fitzone.com.ar',
      siteType: 'gimnasio', color: '#22c55e', glow: 'rgba(34,197,94,0.18)',
      html: `<div style="background:#040e08;height:100%;font-family:Arial,sans-serif;overflow:hidden">
        <div style="background:#071a0d;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(34,197,94,.25)">
          <span style="color:#22c55e;font-weight:800;font-size:13px">⚡ FitZone</span>
          <div style="display:flex;gap:7px;align-items:center">
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Clases</span>
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Planes</span>
            <span style="background:#22c55e;color:#000;font-size:8px;font-weight:700;padding:2px 8px;border-radius:4px">Unirme</span>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#071a0d,#0d2e16);padding:12px;position:relative;overflow:hidden">
          <div style="font-size:7px;color:#22c55e;font-weight:700;letter-spacing:2px;text-transform:uppercase">SANTA ROSA · LA PAMPA</div>
          <div style="font-size:18px;font-weight:900;color:#fff;line-height:1.15;margin:3px 0">ENTRENÁ<br><span style="color:#22c55e">SIN LÍMITES</span></div>
          <div style="font-size:8px;color:rgba(255,255,255,.5);margin:4px 0 8px">Clases grupales · Musculación · Cardio</div>
          <div style="display:inline-block;background:#22c55e;color:#000;font-size:8px;font-weight:700;padding:4px 10px;border-radius:4px">PRIMER MES GRATIS →</div>
          <div style="position:absolute;right:10px;top:6px;font-size:52px;opacity:.1">🏋️</div>
        </div>
        <div style="padding:8px 12px">
          <div style="font-size:8px;color:rgba(255,255,255,.35);margin-bottom:6px;letter-spacing:1px">ELEGÍ TU PLAN</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
            <div style="background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.15);border-radius:6px;padding:8px 6px;text-align:center"><div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.7)">Básico</div><div style="font-size:14px;font-weight:900;color:#22c55e;margin:2px 0">$8.500</div><div style="font-size:7px;color:rgba(255,255,255,.3)">/mes</div></div>
            <div style="background:#22c55e;border-radius:6px;padding:8px 6px;text-align:center;position:relative;margin-top:-4px"><div style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#f97316;font-size:6px;font-weight:700;color:#fff;padding:2px 5px;border-radius:10px;white-space:nowrap">★ POPULAR</div><div style="font-size:8px;font-weight:700;color:#000">Premium</div><div style="font-size:14px;font-weight:900;color:#000;margin:2px 0">$12.000</div><div style="font-size:7px;color:rgba(0,0,0,.5)">/mes</div></div>
            <div style="background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.15);border-radius:6px;padding:8px 6px;text-align:center"><div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.7)">Elite</div><div style="font-size:14px;font-weight:900;color:#22c55e;margin:2px 0">$18.000</div><div style="font-size:7px;color:rgba(255,255,255,.3)">/mes</div></div>
          </div>
        </div>
      </div>`
    },
    {
      icon: '🏠', label: 'Inmobiliaria', url: 'propiedades-sur.com.ar',
      siteType: 'inmobiliaria', color: '#3b82f6', glow: 'rgba(59,130,246,0.18)',
      html: `<div style="background:#050e1a;height:100%;font-family:Arial,sans-serif;overflow:hidden">
        <div style="background:#071220;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(59,130,246,.2)">
          <span style="color:#60a5fa;font-weight:800;font-size:11px">🏠 Propiedades Sur</span>
          <div style="display:flex;gap:7px;align-items:center">
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Ventas</span>
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Alquileres</span>
            <span style="background:#3b82f6;color:#fff;font-size:8px;font-weight:600;padding:2px 7px;border-radius:4px">Contacto</span>
          </div>
        </div>
        <div style="background:#0a1628;padding:8px 12px;border-bottom:1px solid rgba(59,130,246,.1)">
          <div style="font-size:8px;color:rgba(255,255,255,.4);margin-bottom:5px">Buscá tu propiedad ideal</div>
          <div style="display:flex;gap:4px">
            <div style="flex:1;background:#111d30;border:1px solid rgba(59,130,246,.2);border-radius:4px;padding:5px 8px;font-size:8px;color:rgba(255,255,255,.4)">Tipo ▾</div>
            <div style="flex:1;background:#111d30;border:1px solid rgba(59,130,246,.2);border-radius:4px;padding:5px 8px;font-size:8px;color:rgba(255,255,255,.4)">Zona ▾</div>
            <div style="flex:1;background:#111d30;border:1px solid rgba(59,130,246,.2);border-radius:4px;padding:5px 8px;font-size:8px;color:rgba(255,255,255,.4)">Precio ▾</div>
            <div style="background:#3b82f6;border-radius:4px;padding:5px 10px;font-size:8px;font-weight:700;color:#fff;white-space:nowrap">Buscar</div>
          </div>
        </div>
        <div style="padding:8px 12px">
          <div style="font-size:8px;color:rgba(255,255,255,.35);margin-bottom:6px;letter-spacing:1px">PROPIEDADES DESTACADAS</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${[['🏡','Casa 3 amb. · Macaco','USD 75.000','🛏 3 · 🚿 2 · 📐 180m²','VENTA','#22c55e','#fff'],['🏢','Depto 2 amb. · Centro','$180.000/mes','🛏 1 · 🚿 1 · 📐 55m²','ALQUILER','#f59e0b','#000']].map(([e,n,p,i,t,tc,ft])=>`<div style="background:#0d1a2d;border-radius:6px;overflow:hidden;border:1px solid rgba(59,130,246,.1)"><div style="height:65px;background:linear-gradient(135deg,#0d1a2d,#1a2e4a);display:flex;align-items:center;justify-content:center;font-size:26px;position:relative">${e}<span style="position:absolute;top:4px;right:4px;background:${tc};font-size:6px;font-weight:700;color:${ft};padding:1px 5px;border-radius:3px">${t}</span></div><div style="padding:5px 7px"><div style="font-size:7px;font-weight:700;color:#fff">${n}</div><div style="font-size:9px;font-weight:900;color:#60a5fa">${p}</div><div style="font-size:7px;color:rgba(255,255,255,.35);margin-top:2px">${i}</div></div></div>`).join('')}
          </div>
        </div>
      </div>`
    },
    {
      icon: '📊', label: 'Sistema Administrativo', url: 'admin.micomercio.com',
      siteType: 'sistema admin', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',
      html: `<div style="background:#07040f;height:100%;font-family:Arial,sans-serif;overflow:hidden;display:flex">
        <div style="width:58px;background:#0e0720;border-right:1px solid rgba(139,92,246,.12);padding:10px 0;display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="color:#8b5cf6;font-size:16px;font-weight:900;margin-bottom:8px">A</div>
          ${['📊','🛍️','👥','📦','⚙️'].map((e,i)=>`<div style="width:100%;padding:7px 0;display:flex;justify-content:center;font-size:14px;${i===0?'background:rgba(139,92,246,.15)':'opacity:.35'}">${e}</div>`).join('')}
        </div>
        <div style="flex:1;padding:9px 10px;overflow:hidden">
          <div style="font-size:10px;font-weight:700;color:#fff;margin-bottom:7px;display:flex;align-items:center;justify-content:space-between"><span>Dashboard</span><span style="font-size:8px;color:rgba(255,255,255,.35)">Hoy</span></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:7px">
            ${[['Ventas hoy','$84.500','↑ 12%'],['Pedidos','47','↑ 8%'],['Clientes','1.284','↑ 3%']].map(([l,v,c])=>`<div style="background:#150a28;border:1px solid rgba(139,92,246,.12);border-radius:6px;padding:6px 7px"><div style="font-size:7px;color:rgba(255,255,255,.4);margin-bottom:2px">${l}</div><div style="font-size:12px;font-weight:900;color:#a78bfa">${v}</div><div style="font-size:7px;color:#22c55e">${c}</div></div>`).join('')}
          </div>
          <div style="background:#150a28;border:1px solid rgba(139,92,246,.1);border-radius:6px;padding:7px;margin-bottom:6px">
            <div style="font-size:7px;color:rgba(255,255,255,.4);margin-bottom:5px">Ventas — últimos 7 días</div>
            <div style="display:flex;align-items:flex-end;gap:3px;height:32px">
              ${[40,62,50,80,70,100,30].map(h=>`<div style="flex:1;background:rgba(139,92,246,${h===100?'.85':'.28'});height:${h}%;border-radius:2px 2px 0 0"></div>`).join('')}
            </div>
          </div>
          <div style="font-size:7px;color:rgba(255,255,255,.3);margin-bottom:3px;letter-spacing:1px">ÚLTIMOS PEDIDOS</div>
          <div style="background:#150a28;border-radius:6px;overflow:hidden">
            ${[['#1042','Juan García','Entregado','#22c55e'],['#1041','María López','En camino','#f59e0b'],['#1040','Carlos R.','Pendiente','#6366f1']].map(([id,n,s,c])=>`<div style="display:flex;padding:4px 8px;justify-content:space-between;font-size:7px;border-bottom:1px solid rgba(139,92,246,.06);align-items:center"><span style="color:rgba(255,255,255,.5)">${id} · ${n}</span><span style="color:${c};font-weight:600">${s}</span></div>`).join('')}
          </div>
        </div>
      </div>`
    },
    {
      icon: '🍕', label: 'Restaurante / Delivery', url: 'donmario.com.ar',
      siteType: 'restaurante', color: '#ef4444', glow: 'rgba(239,68,68,0.18)',
      html: `<div style="background:#0a0508;height:100%;font-family:Arial,sans-serif;overflow:hidden">
        <div style="background:#ef4444;padding:2px;text-align:center;font-size:7px;font-weight:700;color:#fff;letter-spacing:1px">🛵 ENVÍO GRATIS por compras mayores a $5.000</div>
        <div style="background:#140a08;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(239,68,68,.2)">
          <span style="color:#ef4444;font-weight:800;font-size:12px">🍕 Don Mario</span>
          <div style="display:flex;gap:7px;align-items:center">
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Menú</span>
            <span style="font-size:9px;color:rgba(255,255,255,.5)">Bebidas</span>
            <span style="background:#ef4444;color:#fff;font-size:8px;font-weight:700;padding:2px 8px;border-radius:4px">Pedir ahora</span>
          </div>
        </div>
        <div style="padding:6px 12px;display:flex;gap:5px">
          ${[['🍕 Pizzas',true],['🍔 Combos',false],['🥤 Bebidas',false],['🍦 Postres',false]].map(([l,a])=>`<div style="background:${a?'#ef4444':'rgba(255,255,255,.05)'};color:${a?'#fff':'rgba(255,255,255,.4)'};font-size:7px;${a?'font-weight:700;':''}padding:3px 8px;border-radius:20px;white-space:nowrap">${l}</div>`).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;padding:0 12px 8px">
          ${[['🍕','Napolitana grande','Tomate, mozzarella, albahaca','$3.500'],['🍔','Combo Familiar','2 hamburguesas + papas + bebidas','$6.800'],['🥗','Ensalada del Chef','Verdes frescos, cherrys, queso','$2.200']].map(([e,n,d,p])=>`<div style="background:#1a0d0a;border-radius:6px;padding:7px 10px;display:flex;align-items:center;gap:8px;border:1px solid rgba(239,68,68,.1)"><div style="font-size:24px;flex-shrink:0">${e}</div><div style="flex:1;min-width:0"><div style="font-size:9px;font-weight:700;color:#fff">${n}</div><div style="font-size:7px;color:rgba(255,255,255,.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d}</div><div style="font-size:9px;font-weight:700;color:#ef4444;margin-top:1px">${p}</div></div><div style="background:#ef4444;color:#fff;font-size:13px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">+</div></div>`).join('')}
        </div>
      </div>`
    }
  ];

  const screen      = document.getElementById('hdmScreen');
  if (!screen) return;

  const urlText     = document.getElementById('hdmUrlText');
  const browser     = document.getElementById('hdmBrowser');
  const dotsNav     = document.getElementById('hdmDotsNav');
  const typePill    = document.getElementById('hdmTypePill');
  const pillIcon    = document.getElementById('hdmPillIcon');
  const pillText    = document.getElementById('hdmPillText');
  const progressFill= document.getElementById('hdmProgressFill');
  const siteTypeEl  = document.getElementById('hdmSiteType');

  let current = 0, timer = null;

  SLIDES.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'hdm-slide' + (i === 0 ? ' active' : '');
    el.innerHTML = s.html;
    screen.appendChild(el);

    const dot = document.createElement('button');
    dot.className = 'hdm-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', s.label);
    dot.addEventListener('click', () => { clearInterval(timer); goTo(i); startAuto(); });
    dotsNav.appendChild(dot);
  });

  function applyMeta(s) {
    if (urlText)  urlText.textContent  = s.url;
    if (pillIcon) pillIcon.textContent = s.icon;
    if (pillText) pillText.textContent = s.label;
    if (typePill) {
      typePill.style.cssText = `border-color:${s.color}44;color:${s.color};background:${s.color}18;display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:30px;font-size:11px;font-weight:700;border:1px solid;transition:all .4s ease;`;
    }
    if (browser) {
      browser.style.boxShadow = `0 0 0 1px rgba(255,255,255,.07),0 32px 80px rgba(0,0,0,.7),0 0 80px ${s.glow}`;
    }
    dotsNav.querySelectorAll('.hdm-dot').forEach((d, i) => {
      d.style.setProperty('--hdm-color', s.color);
      if (i === current) { d.style.background = s.color; d.style.boxShadow = `0 0 7px ${s.color}`; }
      else               { d.style.background = ''; d.style.boxShadow = ''; }
    });
    if (siteTypeEl) {
      siteTypeEl.classList.add('fading');
      setTimeout(() => { siteTypeEl.textContent = s.siteType; siteTypeEl.classList.remove('fading'); }, 250);
    }
  }

  function startProgress() {
    if (!progressFill) return;
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    progressFill.style.background = SLIDES[current].color;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      progressFill.style.transition = 'width 4.5s linear';
      progressFill.style.width = '100%';
    }));
  }

  function goTo(idx) {
    const slides = screen.querySelectorAll('.hdm-slide');
    const dots   = dotsNav.querySelectorAll('.hdm-dot');
    slides[current].classList.remove('active');
    slides[current].classList.add('exiting');
    dots[current].classList.remove('active');
    const prev = current;
    current = idx;
    setTimeout(() => slides[prev].classList.remove('exiting'), 400);
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    applyMeta(SLIDES[current]);
    startProgress();
  }

  function startAuto() {
    timer = setInterval(() => goTo((current + 1) % SLIDES.length), 4500);
  }

  applyMeta(SLIDES[0]);
  startProgress();
  startAuto();
})();

// ── Intersection Observer — fade-in cards ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.service-card, .step, .reason, .visual-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`;
  observer.observe(el);
});
