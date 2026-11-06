for (const widget of document.querySelectorAll('[data-tabs]')) {
  const selector = widget.querySelector('.selector');
  const buttons = Array.from(selector.querySelectorAll('button'));
  const panels = buttons.map(button => document.getElementById(button.dataset.panel));
  const verticalLayout = window.matchMedia('(min-width: 511px)');

  function activate(index, { focus = false, animate = false } = {}) {
    buttons.forEach((button, buttonIndex) => {
      const selected = index === buttonIndex;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      panels[buttonIndex].hidden = !selected;
      panels[buttonIndex].tabIndex = selected ? 0 : -1;
      panels[buttonIndex].classList.toggle('is-changing', animate && selected);
    });
    if (focus) buttons[index].focus();
  }

  function updateOrientation() {
    const vertical = widget.dataset.tabs === 'skills' && verticalLayout.matches;
    selector.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
  }

  selector.setAttribute('role', 'tablist');
  updateOrientation();
  verticalLayout.addEventListener('change', updateOrientation);
  buttons.forEach((button, index) => {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', button.id);
    button.addEventListener('click', () => activate(index, { animate: true }));
    button.addEventListener('keydown', event => {
      const vertical = selector.getAttribute('aria-orientation') === 'vertical';
      const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
      const previousKey = vertical ? 'ArrowUp' : 'ArrowLeft';
      let next;
      if (event.key === nextKey) next = (index + 1) % buttons.length;
      if (event.key === previousKey) next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(next, { focus: true, animate: true });
    });
  });
  activate(0);
  selector.hidden = false;
  widget.classList.add('is-enhanced');
}

const story = document.getElementById('work');
const chapterNav = story.querySelector('.story-nav');
const chapters = Array.from(story.querySelectorAll(':scope > .case'));
const chapterButtons = Array.from(chapterNav.querySelectorAll('button'));
const chapterControls = story.querySelector('.story-controls');
const previousChapter = chapterControls.querySelector('.chapter-prev');
const nextChapter = chapterControls.querySelector('.chapter-next');
const chapterStatus = story.querySelector('.story-status');
let chapterIndex = 0;

function selectChapter(index, { focus = false, animate = true } = {}) {
  chapterIndex = index;
  chapters.forEach((chapter, position) => {
    chapter.hidden = position !== index;
    chapter.classList.toggle('chapter-enter', position === index && animate);
    chapter.setAttribute('role', 'tabpanel');
    chapter.setAttribute('aria-labelledby', chapterButtons[position].id);
    chapterButtons[position].setAttribute('aria-selected', String(position === index));
    chapterButtons[position].tabIndex = position === index ? 0 : -1;
  });
  chapterStatus.textContent = 'CHAPTER ' + String(index + 1).padStart(2, '0') + ' / ' + chapters[index].querySelector('h3').textContent;
  chapterControls.querySelector('.chapter-position').textContent = (index + 1) + ' / ' + chapters.length;
  previousChapter.disabled = index === 0;
  nextChapter.textContent = index === chapters.length - 1 ? 'Continue to case studies →' : 'Next chapter →';
  if (focus) chapterButtons[index].focus({preventScroll:true});
}

function navigateChapter(index, focus = true) {
  selectChapter(index, {focus});
  if (location.hash !== '#' + chapters[index].id) history.pushState(null, '', '#' + chapters[index].id);
  chapterNav.scrollIntoView({block:'start', behavior:'smooth'});
}

chapterButtons.forEach((button, index) => {
  button.addEventListener('click', () => navigateChapter(index, false));
  button.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % chapters.length;
    if (event.key === 'ArrowLeft') target = (index - 1 + chapters.length) % chapters.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = chapters.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    navigateChapter(target);
  });
});
previousChapter.addEventListener('click', () => navigateChapter(Math.max(0, chapterIndex - 1)));
nextChapter.addEventListener('click', () => {
  if (chapterIndex < chapters.length - 1) navigateChapter(chapterIndex + 1);
  else {
    document.getElementById('coursework').scrollIntoView({behavior:'smooth'});
    const heading = document.getElementById('coursework-title'); heading.tabIndex = -1; heading.focus({preventScroll:true});
    history.pushState(null, '', '#coursework');
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const index = chapters.findIndex(chapter => '#' + chapter.id === link.getAttribute('href'));
  if (index < 0) return;
  event.preventDefault();
  navigateChapter(index);
});
function restoreChapter() {
  const index = chapters.findIndex(chapter => '#' + chapter.id === location.hash);
  if (index >= 0) {
    selectChapter(index, {animate:false});
    requestAnimationFrame(() => chapterNav.scrollIntoView({block:'start'}));
  }
}
selectChapter(0, {animate:false});
chapterNav.hidden = false;
chapterControls.hidden = false;
chapterStatus.hidden = false;
story.classList.add('story-ready');
restoreChapter();
window.addEventListener('hashchange', restoreChapter);


window.addEventListener('popstate', restoreChapter);


const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const heroSection = document.querySelector('.hero');
const heroExhibit = document.querySelector('.hero-exhibit');
const motionControl = document.querySelector('.motion-control');
const flowCanvas = document.querySelector('.flow-canvas');
const flowContext = flowCanvas.getContext('2d');
let motionPaused = false;
let heroVisible = true;
let animationFrame = 0;
let lastFrame = 0;
let flowTime = 0;
let canvasWidth = 0;
let canvasHeight = 0;
const pointer = { x: .72, y: .42, targetX: .72, targetY: .42 };

function drawFlow(time) {
  if (!flowContext || !canvasWidth || !canvasHeight) return;
  const ctx = flowContext;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const originX = canvasWidth * .68;
  const originY = canvasHeight * .51;
  const spread = canvasWidth * .8;
  const height = canvasHeight * .44;
  for (let row = 0; row < 26; row++) {
    const depth = row / 25;
    ctx.beginPath();
    for (let col = 0; col <= 65; col++) {
      const u = col / 65;
      const x = originX + (u - .5) * spread * (.4 + depth * 1.15);
      const distance = Math.pow(u - pointer.x, 2) + Math.pow(depth - pointer.y, 2);
      const interaction = Math.exp(-distance * 14) * 42;
      const wave = Math.sin(u * 10 + depth * 4 + time * .22) * 16
        + Math.cos(u * 5 - time * .15) * 23;
      const y = originY + depth * height + wave * (.4 + depth) - interaction;
      if (col === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = row % 5 === 0 ? 'rgba(196,154,112,.16)' : 'rgba(127,175,199,.12)';
    ctx.lineWidth = row % 5 === 0 ? 1 : .6;
    ctx.stroke();
  }
  for (let i = 0; i < 11; i++) {
    const progress = (time * .012 + i * .091) % 1;
    const x = originX + (progress - .5) * spread;
    const y = originY + (i % 4) * height * .18 + Math.sin(progress * 10 + time * .22) * 16;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(228,178,129,.65)' : 'rgba(161,204,222,.48)';
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resizeFlow() {
  const bounds = heroSection.getBoundingClientRect();
  canvasWidth = bounds.width;
  canvasHeight = bounds.height;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  flowCanvas.width = Math.round(canvasWidth * ratio);
  flowCanvas.height = Math.round(canvasHeight * ratio);
  if (flowContext) flowContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFlow(flowTime);
}

function animateFlow(timestamp) {
  animationFrame = 0;
  if (motionPaused || motionPreference.matches || !heroVisible || document.hidden) return;
  if (timestamp - lastFrame > 32) {
    const elapsed = Math.min(timestamp - lastFrame, 60) / 1000;
    flowTime += elapsed;
    pointer.x += (pointer.targetX - pointer.x) * .07;
    pointer.y += (pointer.targetY - pointer.y) * .07;
    drawFlow(flowTime);
    lastFrame = timestamp;
  }
  animationFrame = requestAnimationFrame(animateFlow);
}

function syncMotion() {
  const enabled = !motionPaused && !motionPreference.matches;
  document.body.classList.toggle('motion-enabled', enabled);
  document.body.classList.toggle('motion-paused', !enabled);
  motionControl.hidden = motionPreference.matches;
  motionControl.textContent = motionPaused ? 'Resume motion' : 'Pause motion';
  motionControl.setAttribute('aria-pressed', String(motionPaused));
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  if (enabled && heroVisible && !document.hidden) {
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(animateFlow);
  } else {
    heroExhibit.style.removeProperty('--mx');
    heroExhibit.style.removeProperty('--my');
    for (const diagram of document.querySelectorAll('.skill-diagram')) {
      diagram.style.removeProperty('--skill-x');
      diagram.style.removeProperty('--skill-y');
    }
    for (const exhibit of document.querySelectorAll('.project-showcase')) {
      exhibit.style.removeProperty('--pitch');
      exhibit.style.removeProperty('--yaw');
    }
    drawFlow(flowTime);
  }
}

motionControl.addEventListener('click', () => {
  motionPaused = !motionPaused;
  syncMotion();
});
motionPreference.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
new ResizeObserver(resizeFlow).observe(heroSection);
new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  syncMotion();
}, {threshold:0}).observe(heroSection);

heroSection.addEventListener('pointermove', event => {
  if (motionPaused || motionPreference.matches || !precisePointer.matches) return;
  const bounds = heroSection.getBoundingClientRect();
  pointer.targetX = (event.clientX - bounds.left) / bounds.width;
  pointer.targetY = (event.clientY - bounds.top) / bounds.height;
  const exhibitBounds = heroExhibit.getBoundingClientRect();
  const x = Math.max(-1, Math.min(1, (event.clientX - exhibitBounds.left) / exhibitBounds.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - exhibitBounds.top) / exhibitBounds.height * 2 - 1));
  heroExhibit.style.setProperty('--mx', x);
  heroExhibit.style.setProperty('--my', y);
});
heroSection.addEventListener('pointerleave', () => {
  pointer.targetX = .72;
  pointer.targetY = .42;
  heroExhibit.style.setProperty('--mx', 0);
  heroExhibit.style.setProperty('--my', 0);
});
for (const exhibit of document.querySelectorAll('.project-showcase')) {
  exhibit.addEventListener('pointermove', event => {
    if (motionPaused || motionPreference.matches || !precisePointer.matches) return;
    const bounds = exhibit.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    exhibit.style.setProperty('--pitch', -y * 5 + 'deg');
    exhibit.style.setProperty('--yaw', x * 6 + 'deg');
  });
  exhibit.addEventListener('pointerleave', () => {
    exhibit.style.setProperty('--pitch', '0deg');
    exhibit.style.setProperty('--yaw', '0deg');
  });
}
resizeFlow();
syncMotion();

const imageViewer = document.querySelector('.image-viewer');
const viewerImage = imageViewer.querySelector('.viewer-image');
const viewerCaption = imageViewer.querySelector('.viewer-caption');
const viewerPrevious = imageViewer.querySelector('.viewer-prev');
const viewerNext = imageViewer.querySelector('.viewer-next');
let galleryImages = [];
let galleryIndex = 0;
let imageTrigger = null;

function renderViewer() {
  const image = galleryImages[galleryIndex].querySelector('img');
  viewerImage.src = image.src;
  viewerImage.alt = image.alt;
  viewerCaption.textContent = image.alt;
  imageViewer.querySelector('.viewer-count').textContent = (galleryIndex + 1) + ' / ' + galleryImages.length;
  viewerPrevious.disabled = galleryIndex === 0;
  viewerNext.disabled = galleryIndex === galleryImages.length - 1;
}
for (const gallery of document.querySelectorAll('.proof-gallery')) {
  gallery.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    galleryImages = Array.from(gallery.querySelectorAll('a'));
    galleryIndex = galleryImages.indexOf(link);
    imageTrigger = link;
    renderViewer();
    imageViewer.showModal();
    document.body.classList.add('viewer-open');
    imageViewer.querySelector('.viewer-close').focus();
  });
}
viewerPrevious.addEventListener('click', () => {
  if (galleryIndex > 0) { galleryIndex--; renderViewer(); }
});
viewerNext.addEventListener('click', () => {
  if (galleryIndex < galleryImages.length - 1) { galleryIndex++; renderViewer(); }
});
imageViewer.querySelector('.viewer-close').addEventListener('click', () => imageViewer.close());
imageViewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); viewerPrevious.click(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); viewerNext.click(); }
});
imageViewer.addEventListener('click', event => {
  if (event.target !== imageViewer) return;
  const bounds = imageViewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageViewer.close();
});
imageViewer.addEventListener('close', () => {
  document.body.classList.remove('viewer-open');
  if (imageTrigger) imageTrigger.focus({preventScroll:true});
});

const skillDiagrams = document.querySelectorAll('.skill-diagram');
const skillObserver = new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle('is-inview', entry.isIntersecting);
}, {threshold: .35});
for (const diagram of skillDiagrams) {
  skillObserver.observe(diagram);
  diagram.addEventListener('pointermove', event => {
    if (motionPaused || motionPreference.matches || !precisePointer.matches) return;
    const bounds = diagram.getBoundingClientRect();
    diagram.style.setProperty('--skill-x', ((.5 - (event.clientY - bounds.top) / bounds.height) * 7) + 'deg');
    diagram.style.setProperty('--skill-y', (((event.clientX - bounds.left) / bounds.width - .5) * 5) + 'deg');
  });
  diagram.addEventListener('pointerleave', () => {
    diagram.style.removeProperty('--skill-x');
    diagram.style.removeProperty('--skill-y');
  });
}
