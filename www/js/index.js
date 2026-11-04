// 1. Lógica del Carrusel Automático de Fondo
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('#carousel-indicators button');
let currentSlide = 0;
const slideInterval = 5000;

function showSlide(index) {
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.classList.remove('opacity-0');
      slide.classList.add('opacity-100');
    } else {
      slide.classList.remove('opacity-100');
      slide.classList.add('opacity-0');
    }
  });

  indicators.forEach((indicator, i) => {
    if (i === index) {
      indicator.classList.remove('bg-gray-300', 'w-2.5');
      indicator.classList.add('bg-emerald-600', 'w-6');
    } else {
      indicator.classList.remove('bg-emerald-600', 'w-6');
      indicator.classList.add('bg-gray-300', 'w-2.5');
    }
  });

  currentSlide = index;
}

function nextSlide() {
  const next = (currentSlide + 1) % slides.length;
  showSlide(next);
}

let autoSlide = setInterval(nextSlide, slideInterval);

indicators.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    clearInterval(autoSlide);
    showSlide(index);
    autoSlide = setInterval(nextSlide, slideInterval);
  });
});

// 2. Menú desplegable Mobile
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

menuBtn.addEventListener('click', () => {
  const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', !isExpanded);
  mobileMenu.classList.toggle('hidden');
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

// 3. Detección de Sección Activa (ScrollSpy & Active Links)
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-link');

function setActiveLink(id) {
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${id}`) {
      link.classList.add('text-emerald-700', 'border-emerald-600', 'font-bold');
      link.classList.remove('text-gray-700', 'border-transparent');
    } else {
      link.classList.remove('text-emerald-700', 'border-emerald-600', 'font-bold');
      link.classList.add('text-gray-700', 'border-transparent');
    }
  });

  mobileNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${id}`) {
      link.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
      link.classList.remove('hover:bg-gray-100');
    } else {
      link.classList.remove('bg-emerald-50', 'text-emerald-700', 'font-bold');
      link.classList.add('hover:bg-gray-100');
    }
  });
}

const observerOptions = {
  root: null,
  rootMargin: '-20% 0px -60% 0px',
  threshold: 0
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActiveLink(entry.target.id);
    }
  });
}, observerOptions);

sections.forEach(section => observer.observe(section));

// 4. Manejo de la tarjeta de información
const cardZonificacion = document.getElementById('card-zonificacion');
const mapaFrame = document.getElementById('mapa-frame');

function restablecerFicha() {
  document.getElementById('zone-code').textContent = '—';
  document.getElementById('zone-title').textContent = 'Selecciona una zona en el mapa';
  document.getElementById('zone-use').textContent = 'Haz clic en un polígono para consultar sus datos.';
  ['param-densidad', 'param-altura', 'param-area-libre', 'param-lote',
    'param-frente', 'param-estacionamiento', 'zone-source'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });
  cardZonificacion.classList.remove('hidden');
}

// Solo aceptar selecciones enviadas por nuestro visor incrustado.
window.addEventListener('message', (event) => {
  if (event.source !== mapaFrame.contentWindow || event.origin !== window.location.origin) return;
  if (event.data?.type === 'CLEAR_ZONE') {
    restablecerFicha();
    return;
  }
  if (!event.data || event.data.type !== 'SELECT_ZONE') return;
  const zoneData = event.data.payload;
  if (!zoneData || typeof zoneData !== 'object' || typeof zoneData.code !== 'string') return;

  const campos = {
    'zone-code': 'code', 'zone-title': 'title', 'zone-use': 'use',
    'param-densidad': 'densidad', 'param-altura': 'altura',
    'param-area-libre': 'areaLibre', 'param-lote': 'lote',
    'param-frente': 'frente', 'param-estacionamiento': 'estacionamiento',
    'zone-source': 'fuente'
  };
  Object.entries(campos).forEach(([id, campo]) => {
    const valor = zoneData[campo];
    document.getElementById(id).textContent =
      (typeof valor === 'string' && valor.trim()) || typeof valor === 'number'
        ? valor : 'Sin información';
  });
  cardZonificacion.classList.remove('hidden');
});
