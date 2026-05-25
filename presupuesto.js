// ══ PRESUPUESTO.JS ══
const WA_NUMBER = '5492954320639';

let currentStep = 1;

// ── Navegación entre pasos ──
function goStep(n) {
  if (n === 2 && !validateStep1()) return;
  if (n === 3 && !validateStep2()) return;

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');

  // Actualizar dots
  [1, 2, 3].forEach(i => {
    const dot = document.getElementById('dot' + i);
    dot.classList.remove('active', 'done');
    if (i < n) dot.classList.add('done');
    else if (i === n) dot.classList.add('active');
  });

  // Lines
  document.querySelectorAll('.step-line').forEach((l, i) => {
    l.classList.toggle('done', i < n - 1);
  });

  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Mostrar bloque de detalles correcto
  if (n === 2) showDetailBlock();
}

function validateStep1() {
  const sel = document.querySelector('input[name="servicio"]:checked');
  const err = document.getElementById('err-servicio');
  if (!sel) {
    err.textContent = 'Por favor seleccioná un servicio.';
    err.classList.remove('hidden');
    return false;
  }
  err.classList.add('hidden');
  return true;
}

function validateStep2() { return true; }

function showDetailBlock() {
  const sel = document.querySelector('input[name="servicio"]:checked');
  if (!sel) return;
  document.querySelectorAll('.detail-block').forEach(b => b.classList.add('hidden'));
  const block = document.getElementById('det-' + sel.value);
  if (block) block.classList.remove('hidden');
}

// ── Envío ──
function enviarPresupuesto() {
  const nombre   = document.getElementById('nombre').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const email    = document.getElementById('email').value.trim();

  // Validar
  let ok = true;
  const setErr = (id, msg) => {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  };
  setErr('err-nombre','');
  setErr('err-telefono','');
  setErr('err-email','');

  if (!nombre)   { setErr('err-nombre','Ingresá tu nombre.'); ok = false; }
  if (!telefono) { setErr('err-telefono','Ingresá tu WhatsApp o teléfono.'); ok = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('err-email','Email inválido.'); ok = false; }
  if (!ok) return;

  // Armar datos
  const servicio  = document.querySelector('input[name="servicio"]:checked')?.value || '';
  const servicioLabel = {
    'web-comercio':'Página Web Comercio','inmobiliaria':'Inmobiliaria','app-movil':'App Móvil',
    'sistema':'Sistema Administrativo','publicidad':'Publicidad en Redes','community':'Community Manager',
    'hosting-juegos':'Hosting Servidor de Juegos','web-medida':'Web a Medida'
  }[servicio] || servicio;

  const empresa    = document.getElementById('empresa').value.trim();
  const localidad  = document.getElementById('localidad').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const urgencia   = document.getElementById('urgencia').value;
  const presupEst  = document.getElementById('presupuesto-est').value;
  const viaWA      = document.getElementById('via-wa').checked;
  const viaEmail   = document.getElementById('via-email').checked;
  const viaLlamada = document.getElementById('via-llamada').checked;

  const contactoPref = [viaWA && 'WhatsApp', viaEmail && 'Email', viaLlamada && 'Llamada'].filter(Boolean).join(', ');

  // Mensaje WhatsApp
  const msg = `🎯 *NUEVO PRESUPUESTO — Local Web*

👤 *Nombre:* ${nombre}${empresa ? `\n🏢 *Empresa:* ${empresa}` : ''}
📱 *Teléfono/WA:* ${telefono}
✉️ *Email:* ${email}${localidad ? `\n📍 *Localidad:* ${localidad}` : ''}

📋 *Servicio solicitado:* ${servicioLabel}
⏰ *Urgencia:* ${urgencia || 'No especificó'}
💰 *Presupuesto estimado:* ${presupEst || 'No especificó'}
📨 *Prefiere contacto por:* ${contactoPref}

💬 *Descripción:*
${descripcion || '(Sin descripción adicional)'}

—
Enviado desde localweb.ar/presupuesto`;

  // Mostrar loading
  document.getElementById('btnEnviarText').textContent = 'Enviando...';
  document.getElementById('btnEnviarSpinner').classList.remove('hidden');
  document.getElementById('btnEnviar').disabled = true;

  setTimeout(() => {
    // Abrir WhatsApp con el mensaje
    if (viaWA) {
      const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }

    // Abrir email si eligió esa opción
    if (viaEmail) {
      const subject = encodeURIComponent(`Presupuesto: ${servicioLabel} — ${nombre}`);
      const body = encodeURIComponent(msg.replace(/\*/g, ''));
      window.open(`mailto:hola@localweb.ar?subject=${subject}&body=${body}`, '_blank');
    }

    // Guardar en localStorage para el admin
    const consultas = JSON.parse(localStorage.getItem('lw_consultas') || '[]');
    consultas.unshift({
      id: Date.now(),
      fecha: new Date().toLocaleString('es-AR'),
      nombre, empresa, telefono, email, localidad,
      servicio: servicioLabel, urgencia, presupEst,
      descripcion, contactoPref
    });
    localStorage.setItem('lw_consultas', JSON.stringify(consultas.slice(0, 50)));

    // Mostrar éxito
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('stepSuccess').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1200);
}

// ── Auto-advance servicios con click ──
document.querySelectorAll('input[name="servicio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    // Highlight seleccionado
    document.querySelectorAll('.serv-inner').forEach(el => el.classList.remove('selected'));
  });
});
