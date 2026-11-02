const theme = document.getElementById('theme');
const menu = document.getElementById('menu');
const navLinks = document.getElementById('navLinks');

if (localStorage.getItem('widya-theme') === 'dark') {
  document.body.classList.add('dark');
}

function updateThemeIcon() {
  theme.textContent = document.body.classList.contains('dark') ? '☀' : '☾';
}
updateThemeIcon();

theme.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem(
    'widya-theme',
    document.body.classList.contains('dark') ? 'dark' : 'light'
  );
  updateThemeIcon();
});

menu.addEventListener('click', () => navLinks.classList.toggle('open'));

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Gallery lightbox and horizontal carousel.
// Masonry gallery: preserve original image proportions and open a lightbox on click.
const gallery = document.getElementById('documentationGallery');
if (gallery) {
  gallery.querySelectorAll('.gallery-photo img').forEach(img => {
    img.addEventListener('click', () => {
      const viewer = document.getElementById('galleryLightbox');
      if (!viewer) return;
      const preview = viewer.querySelector('img');
      preview.src = img.currentSrc || img.src;
      preview.alt = img.alt || 'Dokumentasi';
      viewer.classList.add('open');
      viewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    });
  });
}


// Horizontal carousel controls: swipe on touchscreens, drag with mouse, or use arrows.
if (gallery) {
  const photos = Array.from(gallery.querySelectorAll('.gallery-photo'));
  const prev = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  let activeIndex = 0;
  let pointerDown = false;
  let startX = 0;
  let startScroll = 0;
  let dragged = false;

  // Measure cards relative to the visible gallery so edge padding and overlap are handled correctly.
  const targetScrollFor = photo => {
    const galleryRect = gallery.getBoundingClientRect();
    const photoRect = photo.getBoundingClientRect();
    const photoCenterInContent = photoRect.left - galleryRect.left + gallery.scrollLeft + photoRect.width / 2;
    return Math.max(0, Math.min(
      gallery.scrollWidth - gallery.clientWidth,
      photoCenterInContent - gallery.clientWidth / 2
    ));
  };

  const setActive = () => {
    if (!photos.length) return;
    const galleryCenter = gallery.getBoundingClientRect().left + gallery.clientWidth / 2;
    let closest = 0;
    let distance = Infinity;
    photos.forEach((photo, index) => {
      const rect = photo.getBoundingClientRect();
      const d = Math.abs(rect.left + rect.width / 2 - galleryCenter);
      if (d < distance) { distance = d; closest = index; }
    });
    activeIndex = closest;
    photos.forEach((photo, index) => photo.classList.toggle('is-active', index === activeIndex));
  };

  const goTo = index => {
    activeIndex = Math.max(0, Math.min(photos.length - 1, index));
    const photo = photos[activeIndex];
    gallery.scrollTo({
      left: targetScrollFor(photo),
      behavior: 'smooth'
    });
    photos.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
  };

  prev?.addEventListener('click', () => goTo(activeIndex - 1));
  next?.addEventListener('click', () => goTo(activeIndex + 1));
  gallery.addEventListener('scroll', () => window.requestAnimationFrame(setActive), { passive: true });

  gallery.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerDown = true;
    dragged = false;
    startX = event.clientX;
    startScroll = gallery.scrollLeft;
    gallery.classList.add('dragging');
    if (event.pointerType === 'mouse') gallery.setPointerCapture(event.pointerId);
  });
  gallery.addEventListener('pointermove', event => {
    if (!pointerDown) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) dragged = true;
    if (dragged) gallery.scrollLeft = startScroll - delta;
  });
  const stopDrag = () => {
    if (!pointerDown) return;
    pointerDown = false;
    gallery.classList.remove('dragging');
    // Find the nearest card, then glide it into the center instead of stopping abruptly.
    setActive();
    const settleIndex = activeIndex;
    window.requestAnimationFrame(() => {
      const photo = photos[settleIndex];
      if (photo) {
        gallery.scrollTo({
          left: targetScrollFor(photo),
          behavior: 'smooth'
        });
      }
    });
    window.setTimeout(() => { dragged = false; }, 180);
  };
  gallery.addEventListener('pointerup', stopDrag);
  gallery.addEventListener('pointercancel', stopDrag);
  gallery.addEventListener('click', event => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  setActive();
  window.addEventListener('resize', setActive);
}

function closeGalleryLightbox() {
  const viewer = document.getElementById('galleryLightbox');
  if (!viewer) return;
  viewer.classList.remove('open');
  viewer.setAttribute('aria-hidden', 'true');
  viewer.querySelector('img').src = '';
  document.body.classList.remove('lightbox-open');
}
document.addEventListener('click', event => {
  const viewer = document.getElementById('galleryLightbox');
  if (viewer && event.target === viewer) closeGalleryLightbox();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeGalleryLightbox();
});

// Section 03 capability stack: reliable navigation through all five cards.
const capabilityTrack = document.querySelector('#skills .core-skill-grid');
if (capabilityTrack) {
  const capabilityCards = Array.from(capabilityTrack.querySelectorAll('.core-skill'));
  const capabilityPrev = document.getElementById('capabilityPrev');
  const capabilityNext = document.getElementById('capabilityNext');
  let capabilityIndex = 0;
  let isDragging = false, startX = 0, startScroll = 0, dragMoved = false;
  let scrollFrame = 0;

  const centeredScrollLeft = card => {
    const trackRect = capabilityTrack.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return capabilityTrack.scrollLeft +
      (cardRect.left - trackRect.left) -
      (capabilityTrack.clientWidth - cardRect.width) / 2;
  };

  const setActive = index => {
    capabilityIndex = Math.max(0, Math.min(capabilityCards.length - 1, index));
    capabilityCards.forEach((card, i) => {
      card.classList.toggle('is-active', i === capabilityIndex);
      card.setAttribute('aria-current', i === capabilityIndex ? 'true' : 'false');
    });
  };

  const goToCapability = index => {
    const nextIndex = Math.max(0, Math.min(capabilityCards.length - 1, index));
    setActive(nextIndex);
    const target = centeredScrollLeft(capabilityCards[nextIndex]);
    capabilityTrack.scrollTo({ left: target, behavior: 'smooth' });
  };

  const updateCapabilityActive = () => {
    const trackRect = capabilityTrack.getBoundingClientRect();
    const center = trackRect.left + capabilityTrack.clientWidth / 2;
    let nearest = 0, nearestDistance = Infinity;
    capabilityCards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    setActive(nearest);
  };

  capabilityPrev?.addEventListener('click', () => goToCapability(capabilityIndex - 1));
  capabilityNext?.addEventListener('click', () => goToCapability(capabilityIndex + 1));
  capabilityTrack.addEventListener('scroll', () => {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (!isDragging) updateCapabilityActive();
      scrollFrame = 0;
    });
  }, { passive: true });

  capabilityTrack.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    isDragging = true;
    dragMoved = false;
    startX = event.clientX;
    startScroll = capabilityTrack.scrollLeft;
    capabilityTrack.classList.add('dragging');
    if (event.pointerType === 'mouse') capabilityTrack.setPointerCapture(event.pointerId);
  });
  capabilityTrack.addEventListener('pointermove', event => {
    if (!isDragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) dragMoved = true;
    if (dragMoved) capabilityTrack.scrollLeft = startScroll - delta;
  });
  const stopCapabilityDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    capabilityTrack.classList.remove('dragging');
    updateCapabilityActive();
    if (dragMoved) goToCapability(capabilityIndex);
  };
  capabilityTrack.addEventListener('pointerup', stopCapabilityDrag);
  capabilityTrack.addEventListener('pointercancel', stopCapabilityDrag);
  capabilityTrack.addEventListener('click', event => {
    if (dragMoved) {
      event.preventDefault();
      event.stopPropagation();
      dragMoved = false;
    }
  }, true);
  window.addEventListener('resize', () => goToCapability(capabilityIndex));
  setActive(0);
  requestAnimationFrame(() => goToCapability(0));
}
