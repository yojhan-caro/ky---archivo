/* ══════════════════════════════════════════════════════════════
   KY SpA Archivo — Mesa de trabajo
   Sobre cada carpeta: lápiz (con presión del lápiz de la tablet),
   marcador, goma, post-its, etiquetas movibles y hojas en blanco.
   Las coordenadas se guardan relativas al ancho de la hoja
   (0–10000), así el dibujo se mantiene al girar la tablet.
   ══════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const KY = window.KY; if (!KY) return;
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const NS = 'http://www.w3.org/2000/svg';
const N = 10000;            // ancho de la hoja en unidades internas
const HOJA = 8000;          // alto de una hoja en blanco (80 % del ancho)

const PLUMA = [['#1D1B19', 'Tinta'], ['#2342D6', 'Azul'], ['#D6262B', 'Rojo'], ['#11735A', 'Verde'], ['#E8553D', 'Coral']];
const MARCA = [['#FFE14D', 'Amarillo'], ['#9BF29B', 'Verde'], ['#FF9AD0', 'Rosa'], ['#8FD8FF', 'Celeste']];
const GROSOR = { pluma: [1.4, 2.6, 4.8], marca: [10, 17, 26] };   // px en pantalla
const POSTIT = ['#FFE680', '#FFB8CB', '#A9E2FF', '#BDF2B4', '#FFD2A3'];
const SELLOS = [['IDEA', '#2342D6'], ['URGENTE', '#D6262B'], ['HECHO', '#11735A'], ['OJO', '#E8553D'], ['PENDIENTE', '#4A1C74'], ['DECIDIDO', '#1D1B19'], ['PREGUNTAR', '#0F6E7A'], ['COBRAR', '#8A5A12']];

const desk = $('#desk'), wrap = $('#mesaWrap'), deskIn = $('#deskIn'), hojas = $('#hojas'), peg = $('#pegados'), herr = $('#herr'), menu = $('#sellosMenu');
const svg = $('#trazos');
const capa = {};
['p', 'h'].forEach(z => { const g = document.createElementNS(NS, 'g'); g.dataset.z = z; const gm = document.createElementNS(NS, 'g'); gm.setAttribute('class', 'marcas'); const gp = document.createElementNS(NS, 'g'); g.append(gm, gp); svg.append(g); capa[z] = { g, marca: gm, pluma: gp }; });

/* ═══ PREFERENCIAS DE ESTE DISPOSITIVO ═══ */
let pref = { solo: true, cp: 0, cm: 0, gp: 1, gm: 1 };
try { Object.assign(pref, JSON.parse(localStorage.getItem('ky-mesa') || '{}')); } catch (e) {}
const guardarPref = () => { try { localStorage.setItem('ky-mesa', JSON.stringify(pref)); } catch (e) {} };

/* ═══ ESTADO ═══ */
let id = null, B = null, W = 1, H0 = 0, modo = 'leer', hist = [], rehacer = [], act = null, tTxt;
function tablero(k) { const st = KY.st; st.boards = st.boards || {}; return st.boards[k] || (st.boards[k] = { s: [], n: [], t: [], x: 0 }); }
const px = u => u * W / N, un = p => p * N / W;
const zonaTop = z => (z === 'h' ? H0 : 0);
const zonaDe = ypx => (B.x > 0 && ypx >= H0 ? 'h' : 'p');
function foto() { hist.push(JSON.stringify(B)); if (hist.length > 50) hist.shift(); rehacer = []; botonesHist(); }
function guardar() { KY.save(); }
function volver(desde, hacia) {
  if (!desde.length) return;
  hacia.push(JSON.stringify(B)); B = JSON.parse(desde.pop()); KY.st.boards[id] = B; guardar(); todo(); botonesHist();
}

/* ═══ MEDIDAS ═══ */
function medir() {
  W = wrap.clientWidth || 1;
  const hH = px(HOJA);
  hojas.hidden = !B.x;
  hojas.innerHTML = Array.from({ length: B.x }, (_, i) => `<div class="hoja" style="height:${hH}px"><span class="hoja-n">Hoja en blanco ${i + 1}</span>${i === B.x - 1 ? '<button class="hoja-q" data-hq aria-label="Quitar la última hoja en blanco">Quitar hoja</button>' : ''}</div>`).join('');
  H0 = B.x ? hojas.offsetTop : deskIn.offsetHeight;
  const alto = B.x ? hojas.offsetTop + hojas.offsetHeight : deskIn.offsetHeight;
  svg.setAttribute('viewBox', `0 0 ${N} ${Math.max(1, Math.round(un(alto)))}`);
  svg.style.height = alto + 'px';
  capa.h.g.setAttribute('transform', `translate(0 ${Math.round(un(H0))})`);
}
let pend = 0, ultW = 0, ultH = 0;
function quizas() {
  if (!B || pend) return;
  pend = requestAnimationFrame(() => {
    pend = 0;
    const w = wrap.clientWidth, h = deskIn.offsetHeight;
    if (w === ultW && h === ultH) return;
    ultW = w; ultH = h; medir(); ubicar();
  });
}
new ResizeObserver(quizas).observe(deskIn);
addEventListener('resize', quizas);
function todo() { if (!B) return; medir(); ultW = wrap.clientWidth; ultH = deskIn.offsetHeight; trazos(); pegados(); }

/* ═══ TRAZOS ═══ */
const r1 = v => Math.round(v);
function circulo(x, y, r) { return `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`; }
function curva(P, mover) {
  let d = (mover ? 'M' : 'L') + r1(P[0][0]) + ' ' + r1(P[0][1]);
  for (let i = 1; i < P.length - 1; i++) d += `Q${r1(P[i][0])} ${r1(P[i][1])} ${r1((P[i][0] + P[i + 1][0]) / 2)} ${r1((P[i][1] + P[i + 1][1]) / 2)}`;
  const u = P[P.length - 1]; return d + `L${r1(u[0])} ${r1(u[1])}`;
}
// Trazo de lápiz: contorno relleno con grosor según la presión
function contorno(p, w) {
  const n = p.length / 3, pts = [];
  for (let i = 0; i < n; i++) pts.push([p[i * 3], p[i * 3 + 1], p[i * 3 + 2] / 100]);
  const r = []; let prev = null;
  pts.forEach(q => { const t = w * (0.38 + 1.05 * q[2]) / 2; prev = prev == null ? t : prev * 0.6 + t * 0.4; r.push(prev); });
  if (n === 1) return circulo(pts[0][0], pts[0][1], r[0]);
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    L.push([pts[i][0] + nx * r[i], pts[i][1] + ny * r[i]]); R.push([pts[i][0] - nx * r[i], pts[i][1] - ny * r[i]]);
  }
  return curva(L, true) + curva(R.reverse(), false) + 'Z' + circulo(pts[0][0], pts[0][1], r[0]) + circulo(pts[n - 1][0], pts[n - 1][1], r[n - 1]);
}
function linea(p) {
  const P = []; for (let i = 0; i < p.length; i += 3) P.push([p[i], p[i + 1]]);
  if (P.length === 1) P.push([P[0][0] + 1, P[0][1]]);
  return curva(P, true);
}
function nodo(s) {
  const e = document.createElementNS(NS, 'path');
  if (s.m === 'h') { e.setAttribute('class', 'tm'); e.setAttribute('stroke', s.c); e.setAttribute('stroke-width', s.w); e.setAttribute('d', linea(s.p)); }
  else { e.setAttribute('class', 'tp'); e.setAttribute('fill', s.c); e.setAttribute('d', contorno(s.p, s.w)); }
  return e;
}
function trazos() {
  ['p', 'h'].forEach(z => { capa[z].marca.replaceChildren(); capa[z].pluma.replaceChildren(); });
  B.s.forEach(s => { const c = capa[s.z === 'h' ? 'h' : 'p']; (s.m === 'h' ? c.marca : c.pluma).append(nodo(s)); });
}

/* ═══ DIBUJAR ═══ */
function punto(e) {
  const r = wrap.getBoundingClientRect();
  const pr = e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5;
  return { xpx: e.clientX - r.left, ypx: e.clientY - r.top, pr };
}
function distSeg(px0, py0, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((px0 - ax) * dx + (py0 - ay) * dy) / l)) : 0;
  return Math.hypot(px0 - (ax + t * dx), py0 - (ay + t * dy));
}
function borrarEn(q) {
  const lim = un(14), antes = B.s.length;
  B.s = B.s.filter(s => {
    const x = un(q.xpx), y = un(q.ypx - zonaTop(s.z)), p = s.p, extra = s.m === 'h' ? s.w / 2 : s.w / 2;
    for (let i = 0; i < p.length; i += 3) {
      const j = i + 3 < p.length ? i + 3 : i;
      if (distSeg(x, y, p[i], p[i + 1], p[j], p[j + 1]) < lim + extra) return false;
    }
    return true;
  });
  if (B.s.length !== antes) { act.borro = true; trazos(); }
}
function reenviarToque(e) {
  svg.style.pointerEvents = 'none'; peg.style.pointerEvents = 'none';
  const el = document.elementFromPoint(e.clientX, e.clientY);
  svg.style.pointerEvents = ''; peg.style.pointerEvents = '';
  if (!el) return;
  const f = el.closest('input,textarea,select,button,summary,label,a,[data-act]');
  if (f && f.matches('input:not([type=checkbox]):not([type=radio]),textarea,select')) f.focus(); else if (f) f.click(); else el.click();
}
svg.addEventListener('pointerdown', e => {
  if (modo === 'leer' || act || !B) return;
  if (e.pointerType === 'touch' && pref.solo) {
    act = { pid: e.pointerId, tipo: 'pan', y0: e.clientY, x0: e.clientX, s0: desk.scrollTop, mov: false };
    try { svg.setPointerCapture(e.pointerId); } catch (er) {}
    return;
  }
  if (e.button > 0) return;
  e.preventDefault();
  try { svg.setPointerCapture(e.pointerId); } catch (er) {}
  menu.hidden = true;
  const q = punto(e);
  if (modo === 'goma') { foto(); act = { pid: e.pointerId, tipo: 'goma', borro: false }; borrarEn(q); return; }
  const m = modo === 'marca' ? 'h' : 'p', z = zonaDe(q.ypx);
  const color = m === 'h' ? MARCA[pref.cm][0] : PLUMA[pref.cp][0];
  const s = { c: color, w: r1(un(m === 'h' ? GROSOR.marca[pref.gm] : GROSOR.pluma[pref.gp])), m, z, p: [] };
  const el = nodo({ ...s, p: [r1(un(q.xpx)), r1(un(q.ypx - zonaTop(z))), r1(q.pr * 100)] });
  (m === 'h' ? capa[z].marca : capa[z].pluma).append(el);
  act = { pid: e.pointerId, tipo: 'trazo', s, el, lx: -1e9, ly: -1e9 };
  sumar(q);
});
function sumar(q) {
  const s = act.s, x = un(q.xpx), y = un(q.ypx - zonaTop(s.z));
  if (Math.hypot(x - act.lx, y - act.ly) < un(1.1)) { if (s.p.length) s.p[s.p.length - 1] = Math.max(s.p[s.p.length - 1], r1(q.pr * 100)); return; }
  act.lx = x; act.ly = y; s.p.push(r1(x), r1(y), r1(q.pr * 100));
}
svg.addEventListener('pointermove', e => {
  if (!act || e.pointerId !== act.pid) return;
  if (act.tipo === 'pan') {
    const dy = e.clientY - act.y0;
    if (!act.mov && Math.abs(dy) < 6 && Math.abs(e.clientX - act.x0) < 6) return;
    act.mov = true; desk.scrollTop = act.s0 - dy; return;
  }
  e.preventDefault();
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  if (act.tipo === 'goma') { (evs.length ? evs : [e]).forEach(ev => borrarEn(punto(ev))); return; }
  (evs.length ? evs : [e]).forEach(ev => sumar(punto(ev)));
  act.el.setAttribute('d', act.s.m === 'h' ? linea(act.s.p) : contorno(act.s.p, act.s.w));
});
function terminar(e) {
  if (!act || e.pointerId !== act.pid) return;
  const a = act; act = null;
  if (a.tipo === 'pan') { if (!a.mov && e.type === 'pointerup') reenviarToque(e); return; }
  if (a.tipo === 'goma') { if (a.borro) guardar(); else { hist.pop(); botonesHist(); } return; }
  if (!a.s.p.length) { a.el.remove(); return; }
  foto(); B.s.push(a.s); guardar();
  a.el.setAttribute('d', a.s.m === 'h' ? linea(a.s.p) : contorno(a.s.p, a.s.w));
}
svg.addEventListener('pointerup', terminar);
svg.addEventListener('pointercancel', terminar);

/* ═══ POST-ITS Y ETIQUETAS ═══ */
function pegados() {
  peg.innerHTML = B.n.map(n => `<div class="postit" data-n="${esc(n.id)}" style="--pc:${esc(n.c)};--rot:${n.r || 0}deg">
      <div class="pgrip" title="Arrastra para mover"><button class="pb" data-pa="col" aria-label="Cambiar color del post-it"><i style="background:${esc(POSTIT[(POSTIT.indexOf(n.c) + 1) % POSTIT.length])}"></i></button><span class="pdots" aria-hidden="true"></span><button class="pb" data-pa="del" aria-label="Borrar post-it">✕</button></div>
      <textarea aria-label="Texto del post-it" placeholder="Escribe aquí…" spellcheck="true">${esc(n.txt)}</textarea></div>`).join('')
    + B.t.map(t => `<div class="sello2" data-t="${esc(t.id)}" style="--tc:${esc(t.c)};--rot:${t.r || 0}deg" role="button" tabindex="0" aria-label="Etiqueta ${esc(t.t)}, arrastra para mover o toca para quitar"><span>${esc(t.t)}</span><button class="tdel" data-ta="del" aria-label="Quitar etiqueta ${esc(t.t)}">✕</button></div>`).join('');
  ubicar(); $$('.postit textarea', peg).forEach(autoAlto);
}
function ubicar() {
  if (!B) return;
  $$('.postit', peg).forEach(el => { const n = B.n.find(x => x.id === el.dataset.n); if (n) { el.style.left = px(n.x) + 'px'; el.style.top = (zonaTop(n.z) + px(n.y)) + 'px'; } });
  $$('.sello2', peg).forEach(el => { const t = B.t.find(x => x.id === el.dataset.t); if (t) { el.style.left = px(t.x) + 'px'; el.style.top = (zonaTop(t.z) + px(t.y)) + 'px'; } });
}
function autoAlto(a) { a.style.height = 'auto'; a.style.height = Math.max(96, a.scrollHeight) + 'px'; }
function enVista() { return { xpx: W / 2, ypx: desk.scrollTop + desk.clientHeight * 0.32 }; }
function colocar(obj, xpx, ypx, ancho) {
  xpx = Math.max(4, Math.min(W - ancho - 4, xpx)); ypx = Math.max(4, ypx);
  obj.z = zonaDe(ypx); obj.x = r1(un(xpx)); obj.y = r1(un(ypx - zonaTop(obj.z)));
}
function nuevoPostit() {
  foto();
  const v = enVista(), n = { id: uid(), c: POSTIT[B.n.length % POSTIT.length], r: r1((Math.random() * 6 - 3) * 10) / 10, txt: '' };
  colocar(n, v.xpx - 110 + (Math.random() * 60 - 30), v.ypx, 220); B.n.push(n); guardar(); pegados();
  const a = $(`.postit[data-n="${n.id}"] textarea`, peg); a && a.focus({ preventScroll: true });
}
function nuevoSello(txt, color) {
  foto();
  const v = enVista(), t = { id: uid(), t: txt.toUpperCase().slice(0, 24), c: color, r: r1((Math.random() * 10 - 7) * 10) / 10 };
  colocar(t, v.xpx - 70 + (Math.random() * 80 - 40), v.ypx + 40, 140); B.t.push(t); guardar(); pegados();
}
peg.addEventListener('input', e => {
  const a = e.target.closest('.postit textarea'); if (!a) return;
  const n = B.n.find(x => x.id === a.closest('.postit').dataset.n); if (!n) return;
  n.txt = a.value; autoAlto(a); clearTimeout(tTxt); tTxt = setTimeout(guardar, 400);
});
peg.addEventListener('focusin', e => { if (e.target.matches('.postit textarea')) { e.target.dataset.antes = JSON.stringify(B); } });
peg.addEventListener('focusout', e => {
  const a = e.target; if (!a.matches('.postit textarea') || !a.dataset.antes) return;
  if (a.dataset.antes !== JSON.stringify(B)) { hist.push(a.dataset.antes); rehacer = []; botonesHist(); }
  delete a.dataset.antes; clearTimeout(tTxt); guardar();
});
peg.addEventListener('click', e => {
  const b = e.target.closest('[data-pa],[data-ta]'); if (!b) return;
  if (b.dataset.pa === 'del') { const i = B.n.findIndex(x => x.id === b.closest('.postit').dataset.n); if (i > -1) { foto(); B.n.splice(i, 1); guardar(); pegados(); } }
  else if (b.dataset.pa === 'col') { const n = B.n.find(x => x.id === b.closest('.postit').dataset.n); if (n) { foto(); n.c = POSTIT[(POSTIT.indexOf(n.c) + 1) % POSTIT.length]; guardar(); pegados(); } }
  else if (b.dataset.ta === 'del') { const i = B.t.findIndex(x => x.id === b.closest('.sello2').dataset.t); if (i > -1) { foto(); B.t.splice(i, 1); guardar(); pegados(); } }
});
// Arrastrar post-its (desde la barra superior) y etiquetas (desde cualquier parte)
let arr = null;
peg.addEventListener('pointerdown', e => {
  if (e.target.closest('button,textarea')) return;
  const el = e.target.closest('.pgrip') ? e.target.closest('.postit') : e.target.closest('.sello2'); if (!el) return;
  e.preventDefault();
  arr = { el, pid: e.pointerId, x0: e.clientX, y0: e.clientY, l0: el.offsetLeft, t0: el.offsetTop, mov: false };
  try { el.setPointerCapture(e.pointerId); } catch (er) {}
});
peg.addEventListener('pointermove', e => {
  if (!arr || e.pointerId !== arr.pid) return;
  const dx = e.clientX - arr.x0, dy = e.clientY - arr.y0;
  if (!arr.mov && Math.hypot(dx, dy) < 5) return;
  if (!arr.mov) { arr.mov = true; arr.el.classList.add('arrastrando'); arr.foto = JSON.stringify(B); peg.append(arr.el); }
  arr.el.style.left = (arr.l0 + dx) + 'px'; arr.el.style.top = Math.max(0, arr.t0 + dy) + 'px';
  // Al acercarse al borde de la pantalla, la mesa se desplaza
  const r = desk.getBoundingClientRect();
  if (e.clientY > r.bottom - 70) desk.scrollTop += 12; else if (e.clientY < r.top + 50) desk.scrollTop -= 12;
});
function soltar(e) {
  if (!arr || e.pointerId !== arr.pid) return;
  const a = arr; arr = null; a.el.classList.remove('arrastrando');
  if (!a.mov) { if (a.el.classList.contains('sello2')) { $$('.sello2.sel', peg).forEach(x => x !== a.el && x.classList.remove('sel')); a.el.classList.toggle('sel'); } return; }
  const esPost = a.el.classList.contains('postit');
  const obj = esPost ? B.n.find(x => x.id === a.el.dataset.n) : B.t.find(x => x.id === a.el.dataset.t); if (!obj) return;
  hist.push(a.foto); if (hist.length > 50) hist.shift(); rehacer = []; botonesHist();
  colocar(obj, a.el.offsetLeft, a.el.offsetTop, a.el.offsetWidth); guardar(); ubicar();
}
peg.addEventListener('pointerup', soltar);
peg.addEventListener('pointercancel', soltar);
peg.addEventListener('keydown', e => { const s = e.target.closest('.sello2'); if (s && (e.key === 'Delete' || e.key === 'Backspace')) $('.tdel', s).click(); });

/* ═══ HOJAS EN BLANCO ═══ */
function nuevaHoja() {
  foto(); B.x++; guardar(); medir(); ubicar();
  const ult = $$('.hoja', hojas).pop(); if (ult) desk.scrollTo({ top: ult.offsetTop - 20, behavior: 'smooth' });
}
hojas.addEventListener('click', e => {
  if (!e.target.closest('[data-hq]')) return;
  foto(); const lim = (B.x - 1) * HOJA;
  B.s = B.s.filter(s => s.z !== 'h' || s.p[1] < lim); B.n = B.n.filter(n => n.z !== 'h' || n.y < lim); B.t = B.t.filter(t => t.z !== 'h' || t.y < lim);
  B.x = Math.max(0, B.x - 1); guardar(); todo();
  KY.toast('Hoja quitada', 'Deshacer', () => volver(hist, rehacer));
});

/* ═══ BARRA DE HERRAMIENTAS ═══ */
const I = {
  leer: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1.5v-2a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-6.5 6.5h-1.3a6 6 0 0 1-4.6-2.2L4.3 15.6a1.6 1.6 0 0 1 2.4-2.1L8 15"/>',
  pluma: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
  marca: '<path d="M9 15l-3 3h5l1.5-1.5"/><path d="M9.5 14.5l7-9a2 2 0 0 1 3 2.6l-7.4 8.8z"/><path d="M4 21h16" stroke-width="3" opacity=".5"/>',
  goma: '<path d="M7 21h12"/><path d="M5.6 15.4l8.8-8.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 19H8.2z"/><path d="M9.5 11.5l5 5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'
};
const ico = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
herr.innerHTML = `
  <div class="hg" role="group" aria-label="Herramienta">
    <button class="hb" data-m="leer" aria-label="Leer y tocar">${ico('leer')}<span>Leer</span></button>
    <button class="hb" data-m="pluma" aria-label="Lápiz">${ico('pluma')}<span>Lápiz</span></button>
    <button class="hb" data-m="marca" aria-label="Marcador">${ico('marca')}<span>Marcador</span></button>
    <button class="hb" data-m="goma" aria-label="Goma">${ico('goma')}<span>Goma</span></button>
  </div>
  <div class="hg hcol" id="hCol" role="group" aria-label="Color"></div>
  <div class="hg" id="hGro" role="group" aria-label="Grosor"></div>
  <div class="hg"><button class="hb" data-h="undo" aria-label="Deshacer">${ico('undo')}</button><button class="hb" data-h="redo" aria-label="Rehacer">${ico('redo')}</button></div>
  <div class="hg"><button class="hb txt" data-h="postit">+ Post-it</button><button class="hb txt" data-h="sello" aria-expanded="false">+ Etiqueta</button><button class="hb txt" data-h="hoja">+ Hoja</button></div>
  <div class="hg"><button class="hb txt" data-h="solo" title="Con esto activo, el dedo mueve la página y solo el lápiz dibuja">Solo lápiz</button></div>`;
menu.innerHTML = `<div class="sm-t">Etiqueta</div><div class="sm-g">${SELLOS.map(([t, c]) => `<button class="sello2 mini" data-s="${t}" data-c="${c}" style="--tc:${c}"><span>${t}</span></button>`).join('')}</div>
  <form class="sm-f" id="sForm"><input class="field" name="t" maxlength="24" placeholder="Otra (ej. CLIENTE)" aria-label="Texto de la etiqueta" autocomplete="off"><button class="pbtn">Poner</button></form>`;
function pintarHerr() {
  $$('[data-m]', herr).forEach(b => b.setAttribute('aria-pressed', b.dataset.m === modo));
  const esM = modo === 'marca', cols = esM ? MARCA : PLUMA, sel = esM ? pref.cm : pref.cp;
  $('#hCol').innerHTML = cols.map(([c, n], i) => `<button class="hc" data-c="${i}" style="--hc:${c}" aria-label="Color ${n}" aria-pressed="${i === sel}"></button>`).join('');
  const gs = esM ? GROSOR.marca : GROSOR.pluma, gsel = esM ? pref.gm : pref.gp;
  $('#hGro').innerHTML = gs.map((g, i) => `<button class="hb hgro" data-g="${i}" aria-label="Grosor ${['fino', 'medio', 'grueso'][i]}" aria-pressed="${i === gsel}"><i style="width:${Math.min(22, 4 + i * 6)}px;height:${Math.min(22, 4 + i * 6)}px;background:${esM ? cols[sel][0] : cols[sel][0]}"></i></button>`).join('');
  $('#hCol').hidden = $('#hGro').hidden = !(modo === 'pluma' || modo === 'marca');
  $('[data-h="solo"]', herr).setAttribute('aria-pressed', pref.solo);
  wrap.classList.toggle('dibujando', modo !== 'leer');
  wrap.dataset.modo = modo;
  botonesHist();
}
function botonesHist() { const u = $('[data-h="undo"]', herr), r = $('[data-h="redo"]', herr); if (u) u.disabled = !hist.length; if (r) r.disabled = !rehacer.length; }
herr.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.m) { modo = b.dataset.m; menu.hidden = true; }
  else if (b.dataset.c) { if (modo === 'marca') pref.cm = +b.dataset.c; else pref.cp = +b.dataset.c; guardarPref(); }
  else if (b.dataset.g) { if (modo === 'marca') pref.gm = +b.dataset.g; else pref.gp = +b.dataset.g; guardarPref(); }
  else if (b.dataset.h === 'undo') volver(hist, rehacer);
  else if (b.dataset.h === 'redo') volver(rehacer, hist);
  else if (b.dataset.h === 'postit') { menu.hidden = true; nuevoPostit(); }
  else if (b.dataset.h === 'hoja') { menu.hidden = true; nuevaHoja(); }
  else if (b.dataset.h === 'solo') { pref.solo = !pref.solo; guardarPref(); KY.toast(pref.solo ? 'Solo lápiz: el dedo mueve la página' : 'El dedo también dibuja'); }
  else if (b.dataset.h === 'sello') { menu.hidden = !menu.hidden; b.setAttribute('aria-expanded', !menu.hidden); if (!menu.hidden) { const r = b.getBoundingClientRect(); menu.style.left = Math.max(12, Math.min(innerWidth - menu.offsetWidth - 12, r.left + r.width / 2 - menu.offsetWidth / 2)) + 'px'; } return; }
  pintarHerr();
});
menu.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; nuevoSello(b.dataset.s, b.dataset.c); menu.hidden = true; });
$('#sForm').addEventListener('submit', e => { e.preventDefault(); const t = e.target.t.value.trim(); if (!t) return; nuevoSello(t, '#D6262B'); e.target.reset(); menu.hidden = true; });
addEventListener('keydown', e => {
  if (!id || e.target.matches('input,textarea')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? volver(rehacer, hist) : volver(hist, rehacer); }
});

/* ═══ CONEXIÓN CON EL ARCHIVO ═══ */
function cargar(k) {
  if (!k) return;
  herr.hidden = false;
  const nuevo = tablero(k);
  if (k !== id || nuevo !== B) { id = k; B = nuevo; hist = []; rehacer = []; menu.hidden = true; todo(); }
  else quizas();
  pintarHerr();
}
addEventListener('ky:pintado', e => cargar(e.detail.id));
addEventListener('ky:cerrado', () => { herr.hidden = true; menu.hidden = true; modo = 'leer'; pintarHerr(); id = null; B = null; peg.innerHTML = ''; ['p', 'h'].forEach(z => { capa[z].marca.replaceChildren(); capa[z].pluma.replaceChildren(); }); });
if (KY.actual) cargar(KY.actual);
pintarHerr();
})();
