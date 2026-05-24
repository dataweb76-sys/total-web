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
