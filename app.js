/** Every element is visible in CSS; only below-viewport leaf groups are prepared. */
function installReferenceReveals(root = document) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map();
  let active = true;
  const elements = [...root.querySelectorAll('[data-reveal]')];
  const finish = element => {
    element.dataset.revealPlayed = 'true';
    const animation = animations.get(element);
    if (animation) { animation.onfinish = null; animation.cancel(); }
    animations.delete(element);
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    if (!active) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      element.dataset.revealPlayed = 'true';
      if (reduced.matches || document.visibilityState === 'hidden' || entry.boundingClientRect.bottom <= 0) finish(element);
      else animations.get(element)?.play();
    }
  }, { threshold: 0, rootMargin: '0px 0px 96px 0px' }) : undefined;
  const stop = () => { observer?.disconnect(); elements.forEach(finish); };
  const onPreference = () => { if (reduced.matches) stop(); };
  reduced.addEventListener('change', onPreference);
  for (const element of elements) {
    if (element.dataset.revealPlayed === 'true') continue;
    const rect = element.getBoundingClientRect();
    if (reduced.matches || !observer || !element.animate || rect.top < innerHeight || document.visibilityState === 'hidden') { finish(element); continue; }
    const transform = element.dataset.reveal === 'slide' ? 'translateX(-24px)' : element.dataset.reveal === 'media' ? 'translateY(16px)' : 'translateY(20px)';
    const animation = element.animate([{ opacity: 0, transform }, { opacity: 1, transform: 'none' }], { duration: element.dataset.reveal === 'media' ? 650 : 600, delay: innerWidth >= 1024 ? Math.min(240, Number(element.dataset.stagger || 0)) : 0, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'backwards' });
    animation.pause(); animation.onfinish = () => finish(element); animations.set(element, animation); observer.observe(element);
  }
  // A fast jump must finish skipped groups, even when IO never intersected them.
  const onScroll = () => { for (const element of animations.keys()) if (element.getBoundingClientRect().bottom < 0) { observer?.unobserve(element); finish(element); } };
  addEventListener('scroll', onScroll, { passive: true });
  const onResize = () => { for (const element of animations.keys()) if (element.getBoundingClientRect().top < innerHeight) { observer?.unobserve(element); finish(element); } };
  addEventListener('resize', onResize);
  return () => { active = false; stop(); reduced.removeEventListener('change', onPreference); removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); };
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ownedHeroAnimations = new Set();
// Transform-only entrance never hides a hero that has already painted.
if (!reducedMotion.matches && !location.hash && scrollY < 20) {
  document.querySelectorAll('.hero-title, .hero-art').forEach((element, index) => {
    const end = getComputedStyle(element).transform;
    const animation = element.animate([{ transform: `translateY(${index ? 16 : 20}px) ${end === 'none' ? '' : end}` }, { transform: end }], { duration: 700, delay: index * 80, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    ownedHeroAnimations.add(animation); animation.onfinish = () => ownedHeroAnimations.delete(animation);
    element.dataset.heroEntered = 'true';
  });
}
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { ownedHeroAnimations.forEach(animation => animation.cancel()); ownedHeroAnimations.clear(); } });
const cleanupReveals = installReferenceReveals();
addEventListener('pagehide', cleanupReveals, { once: true });

const header = document.querySelector('.site-header');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const compact = matchMedia('(max-width:767px)');
header.dataset.enhanced = 'true';
function closeMenu(returnFocus = false) { menu.setAttribute('aria-expanded', 'false'); menu.firstChild.textContent = 'Menu '; nav.hidden = compact.matches; if (returnFocus) menu.focus(); }
function syncMenu() { menu.hidden = !compact.matches; closeMenu(); }
syncMenu(); compact.addEventListener('change', syncMenu);
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!open)); menu.firstChild.textContent = open ? 'Menu ' : 'Fechar '; nav.hidden = open; });
addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true); });
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  if (nav.contains(link)) closeMenu();
  const target = document.querySelector(link.getAttribute('href'));
  if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
}));

const video = document.querySelector('#intervalo_player');
const controls = document.querySelector('.player-controls');
const play = document.querySelector('#play-toggle');
const seek = document.querySelector('#video-seek');
const time = document.querySelector('#video-time');
const playbackStatus = document.querySelector('#playback-status');
const film = document.querySelector('.film-card');
controls.hidden = false; video.controls = false;
const clock = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
function updateTime() { const duration = Number.isFinite(video.duration) ? video.duration : 8; seek.max = duration; seek.value = video.currentTime; seek.setAttribute('aria-valuetext', `${clock(video.currentTime)} de ${clock(duration)}`); time.textContent = `${clock(video.currentTime)} / ${clock(duration)}`; }
async function toggleVideo() { if (!video.paused) video.pause(); else { try { await video.play(); } catch { video.controls = true; playbackStatus.textContent = 'Use os controles do vídeo para iniciar a reprodução.'; } } }
play.addEventListener('click', toggleVideo);
video.addEventListener('keydown', event => { if (event.code === 'Space') { event.preventDefault(); toggleVideo(); } });
video.addEventListener('play', () => { play.innerHTML = 'Pausar vídeo <span aria-hidden="true">Ⅱ</span>'; film.classList.add('is-playing'); playbackStatus.textContent = 'Em reprodução · Sem áudio'; });
video.addEventListener('pause', () => { play.innerHTML = 'Assistir ao vídeo <span aria-hidden="true">▷</span>'; film.classList.remove('is-playing'); playbackStatus.textContent = video.ended ? 'Reprodução concluída.' : 'Vídeo pausado.'; });
video.addEventListener('ended', () => { playbackStatus.textContent = 'Reprodução concluída.'; });
video.addEventListener('timeupdate', updateTime); video.addEventListener('loadedmetadata', updateTime);
seek.addEventListener('input', () => { video.currentTime = Number(seek.value); updateTime(); });
const fullscreen = document.querySelector('#fullscreen');
if (!video.requestFullscreen && !video.webkitEnterFullscreen) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => { try { video.controls = true; if (video.requestFullscreen) await video.requestFullscreen(); else video.webkitEnterFullscreen(); } catch { video.controls = false; playbackStatus.textContent = 'A reprodução continua nesta página.'; } });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) video.controls = false; });
video.addEventListener('webkitendfullscreen', () => { video.controls = false; });
document.fonts.ready.then(() => { document.documentElement.dataset.fontsReady = 'true'; });
