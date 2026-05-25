// ══ RESPONDER-PRESUPUESTO.JS ══
const ADMIN_PASS = 'localweb2025';
const WA_NUMBER  = '5492954320639';
const USD_ARS    = 1200; // tipo de cambio referencial

// ── LOGIN ──
function checkLogin() {
  const pass = document.getElementById('adminPass').value;
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem('lw_admin', '1');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    calcular();
    cargarConsultas();
  } else {
    document.getElementById('loginErr').textContent = 'Contraseña incorrecta.';
  }
}

function logout() {
  sessionStorage.removeItem('lw_admin');
  location.reload();
}

// Auto-login si ya estaba logueado
if (sessionStorage.getItem('lw_admin') === '1') {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// ── TABS ──
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
  if (name === 'calculadora') calcular();
}

// ── CALCULADORA ──
const PRECIOS = {
  'web-comercio':   { basico: 120000, intermedio: 220000, avanzado: 400000, tipo: 'unico' },
  'inmobiliaria':   { basico: 220000, intermedio: 380000, avanzado: 600000, tipo: 'unico' },
  'app-movil':      { basico: 400000, intermedio: 800000, avanzado: 1500000, tipo: 'unico' },
  'sistema':        { basico: 300000, intermedio: 600000, avanzado: 1200000, tipo: 'unico' },
  'publicidad':     { basico: 50000,  intermedio: 100000, avanzado: 200000,  tipo: 'mensual' },
  'community':      { basico: 60000,  intermedio: 100000, avanzado: 180000,  tipo: 'mensual' },
  'hosting-juegos': { basico: 30000,  intermedio: 70000,  avanzado: 150000,  tipo: 'mensual' },
  'web-medida':     { basico: 200000, intermedio: 500000, avanzado: 1200000, tipo: 'unico' }
};

const SOPORTE_COSTO = { 0: 0, 1: 15000, 3: 40000, 6: 75000, 12: 140000 };

function fmt(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function calcular() {
  const servicio    = document.getElementById('c-servicio')?.value;
  const complejidad = document.getElementById('c-complejidad')?.value;
  const dominio     = document.getElementById('c-dominio')?.value;
  const hosting     = document.getElementById('c-hosting')?.value;
  const supabase    = document.getElementById('c-supabase')?.value;
  const soporte     = document.getElementById('c-soporte')?.value;
  const descuento   = parseFloat(document.getElementById('c-descuento')?.value || 0);

  if (!servicio || !PRECIOS[servicio]) {
    document.getElementById('resultado-body').innerHTML =
      '<p style="color:var(--text-muted);text-align:center;padding:40px 0">Seleccioná un servicio para ver el presupuesto estimado</p>';
    return;
  }

  const precio = PRECIOS[servicio];
  const creacion = precio[complejidad] || precio.intermedio;
  const esMensual = precio.tipo === 'mensual';

  // Costos adicionales
  let costoDominio = 0;
  if (dominio === 'ar')     costoDominio = 3500;
  if (dominio === 'com-ar') costoDominio = 2500;

  let costoHosting = 0;
  if (hosting === 'vercel-pro') costoHosting = 20 * USD_ARS;

  let costoSupabase = 0;
  if (supabase === 'pro') costoSupabase = 25 * USD_ARS;

  const costoSoporte = SOPORTE_COSTO[soporte] || 0;

  // Total
  let subtotal = creacion + costoDominio + costoSoporte;
  let descuentoMonto = subtotal * (descuento / 100);
  let total = subtotal - descuentoMonto;

  // Mensual
  let totalMensual = costoHosting + costoSupabase;

  // Render
  let html = '';

  html += `<div class="resultado-item"><span class="label">${esMensual ? 'Costo mensual del servicio' : 'Creación / Desarrollo'} (${complejidad})</span><span class="valor">${fmt(creacion)}${esMensual ? '/mes' : ''}</span></div>`;

  if (costoDominio > 0)
    html += `<div class="resultado-item"><span class="label">Dominio .${dominio} (1 año)</span><span class="valor">${fmt(costoDominio)}</span></div>`;

  if (costoSoporte > 0)
    html += `<div class="resultado-item"><span class="label">Soporte ${soporte} mes${soporte > 1 ? 'es' : ''}</span><span class="valor">${fmt(costoSoporte)}</span></div>`;

  if (descuento > 0)
    html += `<div class="resultado-item"><span class="label">Descuento (${descuento}%)</span><span class="valor" style="color:#10b981">-${fmt(descuentoMonto)}</span></div>`;

  html += `<div class="resultado-total"><span class="label">💰 Total${esMensual ? ' mensual' : ''}</span><span class="valor">${fmt(total)}${esMensual ? '/mes' : ''}</span></div>`;

  if (totalMensual > 0) {
    html += `<div style="margin-top:16px"><div class="resultado-item"><span class="label" style="font-weight:600">Costos fijos mensuales adicionales</span><span class="valor"></span></div>`;
    if (costoHosting > 0)
      html += `<div class="resultado-item"><span class="label">Vercel Pro</span><span class="valor">$20 USD/mes (~${fmt(costoHosting)})</span></div>`;
    if (costoSupabase > 0)
      html += `<div class="resultado-item"><span class="label">Supabase Pro</span><span class="valor">$25 USD/mes (~${fmt(costoSupabase)})</span></div>`;
    html += `<div class="resultado-item"><span class="label">Total mensual infra</span><span class="valor">${fmt(totalMensual)}</span></div></div>`;
  }

  html += `<p class="resultado-nota">💡 Precios en pesos argentinos. Tipo de cambio referencial: $${USD_ARS} ARS/USD. Los costos en USD varían según cotización del día.</p>`;

  // Auto-completar campos de respuesta
  document.getElementById('r-precio').value = fmt(total);
  document.getElementById('r-mensual').value = totalMensual > 0 ? fmt(totalMensual) + '/mes' : 'No aplica';
  document.getElementById('r-servicio').value = document.getElementById('c-servicio').options[document.getElementById('c-servicio').selectedIndex]?.text || '';
  document.getElementById('r-nombre').value = document.getElementById('c-nombre').value;

  document.getElementById('resultado-body').innerHTML = html;
}

// ── CONSULTAS GUARDADAS ──
function cargarConsultas() {
  const consultas = JSON.parse(localStorage.getItem('lw_consultas') || '[]');
  if (consultas.length === 0) return;

  // Auto-fill con la última consulta
  const ultima = consultas[0];
  if (ultima) {
    document.getElementById('c-nombre').value   = ultima.nombre || '';
    document.getElementById('c-email').value    = ultima.email || '';
    document.getElementById('c-telefono').value = ultima.telefono || '';
    document.getElementById('r-nombre').value   = ultima.nombre || '';
    // Intentar mapear servicio
    const mapa = {
      'Página Web Comercio':'web-comercio','Inmobiliaria':'inmobiliaria','App Móvil':'app-movil',
      'Sistema Administrativo':'sistema','Publicidad en Redes':'publicidad',
      'Community Manager':'community','Hosting Servidor de Juegos':'hosting-juegos','Web a Medida':'web-medida'
    };
    const val = mapa[ultima.servicio];
    if (val) { document.getElementById('c-servicio').value = val; calcular(); }
  }
}

// ── GENERAR MENSAJE ──
function generarMensaje() {
  const nombre   = document.getElementById('r-nombre').value.trim() || 'Cliente';
  const servicio = document.getElementById('r-servicio').value.trim() || 'su servicio';
  const precio   = document.getElementById('r-precio').value.trim();
  const mensual  = document.getElementById('r-mensual').value.trim();
  const incluye  = document.getElementById('r-incluye').value.trim();
  const plazo    = document.getElementById('r-plazo').value.trim();
  const obs      = document.getElementById('r-obs').value.trim();

  const telefono = document.getElementById('c-telefono').value.trim();

  const msg = `Hola ${nombre}! 👋 Te hablo de *Local Web*.

Revisamos tu consulta sobre *${servicio}* y te preparamos un presupuesto:

💰 *Inversión inicial:* ${precio || 'A consultar'}
📅 *Costo mensual (hosting/mantenimiento):* ${mensual || 'No aplica'}
⏱️ *Plazo de entrega:* ${plazo || '7 días hábiles'}

✅ *¿Qué incluye?*
${incluye || '• Diseño personalizado\n• Panel de administración\n• 3 meses de soporte'}
${obs ? '\n📌 ' + obs : ''}

Cualquier consulta estamos a disposición. ¿Querés que avancemos?

*Local Web* 🌐
📍 localweb.ar | 📸 @datawebdigital`;

  document.getElementById('preview-texto').textContent = msg;
  document.getElementById('mensaje-generado').classList.remove('hidden');

  // Guardar datos para envío
  window._mensajeActual = msg;
  window._telefonoActual = telefono;
}

function enviarWA() {
  if (!window._mensajeActual) return;
  const tel = window._telefonoActual?.replace(/\D/g,'') || WA_NUMBER;
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(window._mensajeActual)}`, '_blank');
}

function enviarEmail() {
  if (!window._mensajeActual) return;
  const email   = document.getElementById('c-email').value.trim();
  const servicio = document.getElementById('r-servicio').value.trim();
  const subject  = encodeURIComponent(`Presupuesto Local Web — ${servicio}`);
  const body     = encodeURIComponent(window._mensajeActual);
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

function copiarMensaje() {
  if (!window._mensajeActual) return;
  navigator.clipboard.writeText(window._mensajeActual).then(() => {
    const btn = event.target;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = '📋 Copiar texto', 2000);
  });
}
