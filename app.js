/* ══════════════════════════════════════════════════════════════
   KY SpA Archivo — bitácora de la empresa
   Todo se guarda en este dispositivo (localStorage). Respaldo:
   botón «Respaldo» → exportar / importar un archivo .json.
   ══════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const KEY = 'ky-archivo';
const SEED = window.KY_SEED;
const COLORS = ['#5D1650','#EB5B1E','#11735A','#D6262B','#4A1C74','#C93F78','#0F6E7A','#2342D6','#8A5A12','#3B3B3B'];
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fecha = ts => new Date(ts).toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fechaCorta = ts => new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

/* ═══ DATOS ═══ */
function desdeSemilla(f) {
  return { id: f.id, seed: true, name: f.name, color: f.color, date: f.date || '', peek: f.peek || '', title: f.title || f.name, lead: f.lead || '',
    sections: f.sections || [], ficha: f.ficha ? f.ficha.map(r => [...r]) : null, ex: f.ex || null, desc: '',
    tasks: (f.tasks || []).map(([g, t, s]) => ({ id: uid(), g, t, s, done: false })), notes: [] };
}
function nuevoEstado() { return { v: 1, seedVersion: SEED.version, folders: SEED.folders.map(desdeSemilla), deleted: [], updated: Date.now() }; }
let st;
try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
if (!st || !Array.isArray(st.folders)) st = nuevoEstado();
// Carpetas base nuevas de una versión futura: se agregan sin tocar lo tuyo
SEED.folders.forEach(f => { if (!st.folders.some(x => x.id === f.id) && !(st.deleted || []).includes(f.id)) st.folders.push(desdeSemilla(f)); });
// El contenido base (texto fijo) se refresca desde la semilla
st.folders.forEach(x => { const s = SEED.folders.find(f => f.id === x.id); if (s && x.seed) { x.sections = s.sections || []; x.ex = s.ex || null; } });
let guardadoOk = true;
function save() {
  st.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(st)); guardadoOk = true; } catch (e) { guardadoOk = false; toast('No se pudo guardar en este dispositivo. Exporta un respaldo.'); }
  pie();
}
const F = id => st.folders.find(f => f.id === id);
function pie() { $('#fupd').textContent = (guardadoOk ? 'Guardado en este dispositivo · ' : 'Sin guardar · ') + fecha(st.updated); }

/* ═══ AVISOS ═══ */
let tTimer;
function toast(msg, accion, fn) {
  const t = $('#toast'); clearTimeout(tTimer);
  t.innerHTML = esc(msg) + (accion ? ` <button class="tbtn" style="min-height:32px;margin-left:10px;color:#151515;border-color:#151515">${esc(accion)}</button>` : '');
  t.hidden = false;
  if (accion) $('button', t).onclick = () => { fn(); t.hidden = true; };
  tTimer = setTimeout(() => { t.hidden = true; }, accion ? 6000 : 2600);
}

/* ═══ ARCHIVADOR ═══ */
const cab = $('#cabinet');
const TX = ['0%', '30%', '60%'];
function pintarArchivador() {
  const fs = st.folders;
  cab.innerHTML = fs.map((f, i) => {
    const pend = f.tasks.filter(t => !t.done).length;
    const dt = f.date || (pend ? `${pend} pendiente${pend > 1 ? 's' : ''}` : '');
    return `<article class="folder${i === fs.length - 1 ? ' last' : ''}" data-id="${esc(f.id)}" style="--c:${esc(f.color)};--tx:${TX[i % 3]};--z:${i + 1}">
      <div class="tab"${f.tabX != null ? ` style="left:${f.tabX}%;right:auto"` : ''} title="Arrastra la pestaña hacia los lados para moverla">${esc(f.name)}</div>
      <div class="strip"><div class="peek"><span class="n">${String(i + 1).padStart(2, '0')}</span><div class="d">${esc(f.peek || f.lead || 'Carpeta nueva.')}<br><span class="go">Abrir carpeta</span></div><span class="dt">${esc(dt)}</span></div></div>
      <button class="hit" aria-label="Abrir ${esc(f.name)}"></button></article>`;
  }).join('');
  const last = fs[fs.length - 1];
  document.documentElement.style.setProperty('--last-c', last ? last.color : '#2342D6');
  $('#hmeta').innerHTML = `Carpetas 01–${String(fs.length).padStart(2, '0')}<br>${esc(SEED.empresa.lugar)}`;
  $('#spines').innerHTML = `<button class="spine" data-id="_diario" style="--sc:#2A2A2A">Diario</button>` + fs.map(f => `<button class="spine" data-id="${esc(f.id)}" style="--sc:${esc(f.color)}">${esc(f.name)}</button>`).join('');
  pie();
}
let tabArr = null, tabSolto = 0;
cab.addEventListener('pointerdown', e => { const t = e.target.closest('.tab'); if (t) tabArr = { t, fo: t.closest('.folder'), x0: e.clientX, l0: t.offsetLeft, pid: e.pointerId, mov: false }; });
cab.addEventListener('pointermove', e => {
  const a = tabArr; if (!a || e.pointerId !== a.pid) return;
  const dx = e.clientX - a.x0;
  if (!a.mov) { if (Math.abs(dx) < 8) return; a.mov = true; a.t.classList.add('moviendo'); try { a.t.setPointerCapture(e.pointerId); } catch (er) {} }
  a.t.style.left = Math.min(a.fo.clientWidth - a.t.offsetWidth, Math.max(0, a.l0 + dx)) + 'px'; a.t.style.right = 'auto';
});
const finTab = e => {
  const a = tabArr; tabArr = null; if (!a || !a.mov) return;
  a.t.classList.remove('moviendo'); tabSolto = Date.now();
  const f = F(a.fo.dataset.id); if (f) { f.tabX = Math.round(a.t.offsetLeft / a.fo.clientWidth * 1000) / 10; save(); pintarArchivador(); }
};
cab.addEventListener('pointerup', finTab); cab.addEventListener('pointercancel', finTab);
cab.addEventListener('click', e => { if (Date.now() - tabSolto < 500) return; const h = e.target.closest('.hit,.tab'); if (h) abrir(h.closest('.folder').dataset.id, h.closest('.folder')); });

/* ═══ EXPEDIENTE ═══ */
const dos = $('#dossier'), grow = $('#grow'), deskIn = $('#deskIn'), desk = $('#desk');
let actual = null, ultimoFoco = null, editFicha = false, editNota = null, confirmar = null, filtro = '';
$('#spines').addEventListener('click', e => { const b = e.target.closest('.spine'); if (b && b.dataset.id !== actual) { editFicha = false; editNota = null; confirmar = null; pintar(b.dataset.id, true); } });

const L = a => `<ul class="lst">${a.map(x => Array.isArray(x) ? `<li class="${esc(x[0])}">${esc(x[1])}</li>` : `<li>${esc(x)}</li>`).join('')}</ul>`;
const T = t => `<div style="overflow-x:auto"><table><thead><tr>${t.head.map((h, i) => `<th${(t.num || []).includes(i) ? ' class="n"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((c, i) => `<td${(t.num || []).includes(i) ? ' class="n"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const sello = () => `<div class="stamp"><small class="t">ARCHIVO</small>KY SpA<small>— ${new Date().getFullYear()} —</small></div>`;
const parrafos = txt => String(txt || '').split(/\n{2,}/).filter(Boolean).map(p => `<p style="white-space:pre-wrap">${esc(p)}</p>`).join('');

function extracto(x) {
  if (!x) return '';
  const logo = `<svg viewBox="0 0 220 120" width="100%" role="img" aria-label="Logo de Pulso: ticket coral con latido y la palabra pulso"><rect width="220" height="120" rx="10" fill="#141416"/><g transform="translate(26,24) scale(1.12)"><path d="M4 11 Q4 3 12 3 H36 Q44 3 44 11 V57 L39 61 L34 57 L29 61 L24 57 L19 61 L14 57 L9 61 L4 57 Z" fill="#E8553D" stroke="#E8553D" stroke-width="2" stroke-linejoin="round"/><path d="M10 31 H18 L22 22 L28 41 L32 31 H38" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></g><text x="92" y="74" fill="#fff" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="38" letter-spacing="-1.5">pulso</text></svg>`;
  return `<div class="sheet excerpt anim a2"><h3>${esc(x.h)}</h3>${x.big ? `<div class="big">${esc(x.big[0])}<small>${esc(x.big[1])}</small></div>` : ''}${x.swatch ? logo : ''}${(x.rows || []).map(r => `<div class="row"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div>`;
}
function ficha(f) {
  const rows = f.ficha || [];
  if (!editFicha) {
    return `<div class="sheet receipt anim a3"><button class="ico edit" data-act="ficha-edit" aria-label="Editar ficha">✎</button><div class="ttl">FICHA</div>${rows.length ? `<dl>${rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>` : `<p style="font-family:var(--mono);font-size:.8rem;color:#3A3214">Sin datos todavía. Toca ✎ para agregar.</p>`}</div>`;
  }
  return `<div class="sheet receipt anim a3" style="transform:none"><div class="ttl">FICHA</div><div id="fRows">${rows.map(([a, b]) => filaFicha(a, b)).join('')}</div>
    <div class="btns"><button class="pbtn lite" data-act="ficha-add">+ Fila</button><button class="pbtn" data-act="ficha-save">Guardar</button><button class="pbtn lite" data-act="ficha-cancel">Cancelar</button></div></div>`;
}
const filaFicha = (a = '', b = '') => `<div class="frow"><input aria-label="Dato" value="${esc(a)}" placeholder="Dato"><input aria-label="Valor" value="${esc(b)}" placeholder="Valor"><button class="ico" data-act="ficha-del" aria-label="Quitar fila">✕</button></div>`;

function tareas(f) {
  const total = f.tasks.length, hechas = f.tasks.filter(t => t.done).length;
  const grupos = [...new Set(f.tasks.map(t => t.g || ''))];
  const lista = grupos.map(g => {
    const items = f.tasks.filter(t => (t.g || '') === g);
    return `${g ? `<p class="gtitle">${esc(g)}</p>` : ''}<ul class="check">${items.map(t => `<li><label><input type="checkbox" data-task="${esc(t.id)}"${t.done ? ' checked' : ''}><span>${esc(t.t)}${t.s ? `<small>${esc(t.s)}</small>` : ''}</span></label><button class="ico" data-act="task-del" data-id="${esc(t.id)}" aria-label="Borrar tarea">✕</button></li>`).join('')}</ul>`;
  }).join('');
  return `<div class="sec"><h3>Tareas <small>${total ? `${hechas} de ${total} hechas` : 'ninguna todavía'}</small></h3>${lista}
    <form class="addrow" data-form="task"><input class="field" name="t" placeholder="Nueva tarea" aria-label="Nueva tarea" autocomplete="off"><input class="field" name="g" placeholder="Grupo (opcional)" aria-label="Grupo" list="dl-grupos" autocomplete="off"><button class="pbtn">Agregar</button></form>
    <datalist id="dl-grupos">${grupos.filter(Boolean).map(g => `<option value="${esc(g)}">`).join('')}</datalist></div>`;
}
function notas(f) {
  const ns = [...f.notes].sort((a, b) => b.ts - a.ts);
  return `<div class="sec"><h3>Bitácora <small>${ns.length ? `${ns.length} nota${ns.length > 1 ? 's' : ''}` : ''}</small></h3>
    <form data-form="note"><textarea class="area" name="txt" placeholder="¿Qué pasó hoy? Ideas, decisiones, llamadas, avances…" aria-label="Nueva nota"></textarea><div class="btns"><button class="pbtn">Guardar nota</button></div></form>
    ${ns.length ? `<ul class="notes">${ns.map(n => notaHTML(n)).join('')}</ul>` : `<p class="empty">Todavía no hay notas en esta carpeta.</p>`}</div>`;
}
function notaHTML(n, chip) {
  if (editNota === n.id) return `<li><form data-form="note-edit" data-id="${esc(n.id)}"><textarea class="area" name="txt">${esc(n.txt)}</textarea><div class="btns"><button class="pbtn">Guardar</button><button type="button" class="pbtn lite" data-act="note-cancel">Cancelar</button></div></form></li>`;
  const conf = confirmar === 'n:' + n.id;
  return `<li><div class="meta"><span>${chip || ''}${esc(fecha(n.ts))}${n.edit ? ' · editada' : ''}</span><span>${conf ? `<span class="confirm">¿Borrar? <button class="pbtn danger" data-act="note-del-ok" data-id="${esc(n.id)}" data-f="${esc(n._f || '')}">Sí</button><button class="pbtn lite" data-act="cancel-confirm">No</button></span>` : `<button class="ico" data-act="note-edit" data-id="${esc(n.id)}" data-f="${esc(n._f || '')}" aria-label="Editar nota">✎</button><button class="ico" data-act="note-del" data-id="${esc(n.id)}" aria-label="Borrar nota">✕</button>`}</span></div><div class="txt">${esc(n.txt)}</div></li>`;
}
function ajustes(f, idx) {
  const conf = confirmar === 'f:' + f.id;
  return `<details class="cfg"${conf ? ' open' : ''}><summary>Ajustes de la carpeta</summary>
    <form data-form="cfg"><div class="grid2"><label>Nombre de la pestaña<input class="field" name="name" value="${esc(f.name)}" maxlength="28" required></label><label>Etiqueta (fecha, versión…)<input class="field" name="date" value="${esc(f.date)}" maxlength="24"></label></div>
    <div class="grid2"><label>Título de la hoja<input class="field" name="title" value="${esc(f.title)}" maxlength="60"></label><label>Resumen (se ve al pasar por la carpeta)<input class="field" name="peek" value="${esc(f.peek)}" maxlength="160"></label></div>
    <div style="margin-top:10px"><label>Texto de la hoja${f.seed ? ' (se suma al contenido base)' : ''}<textarea class="area" name="desc" placeholder="Escribe lo que quieras que quede fijo en esta carpeta.">${esc(f.desc)}</textarea></label></div>
    <div style="margin-top:10px;font-family:var(--mono);font-size:.76rem;color:var(--paper-2)">Color</div>
    <div class="swatches" role="group" aria-label="Color de la carpeta">${COLORS.map(c => `<button type="button" class="sw" data-act="color" data-c="${c}" style="--s:${c}" aria-label="Color ${c}" aria-pressed="${c === f.color}"></button>`).join('')}</div>
    <div class="btns"><button class="pbtn">Guardar cambios</button><button type="button" class="pbtn lite" data-act="move" data-d="-1"${idx === 0 ? ' disabled' : ''}>↑ Subir</button><button type="button" class="pbtn lite" data-act="move" data-d="1"${idx === st.folders.length - 1 ? ' disabled' : ''}>↓ Bajar</button>${f.tabX != null ? '<button type="button" class="pbtn lite" data-act="tab-reset">Pestaña a su lugar</button>' : ''}
    ${conf ? `<span class="confirm">¿Borrar la carpeta con sus notas y tareas? <button type="button" class="pbtn danger" data-act="folder-del-ok">Sí, borrar</button><button type="button" class="pbtn lite" data-act="cancel-confirm">No</button></span>` : `<button type="button" class="pbtn danger" data-act="folder-del">Borrar carpeta</button>`}</div></form></details>`;
}
function seccionesBase(f) {
  return (f.sections || []).map(s => `${s.h ? `<h3>${esc(s.h)}</h3>` : ''}${s.list ? L(s.list) : ''}${s.table ? T(s.table) : ''}${s.p ? `<p>${esc(s.p)}</p>` : ''}`).join('');
}

function pintar(id, swap) {
  if (id === '_diario') return pintarDiario(swap);
  const f = F(id); if (!f) return;
  const idx = st.folders.indexOf(f);
  actual = id; dos.style.setProperty('--c', f.color);
  $('#dCrumbs').innerHTML = ['Archivo', 'KY SpA', f.name].map(s => `<span>${esc(s)}</span>`).join('');
  $$('.spine').forEach(s => s.toggleAttribute('aria-current', s.dataset.id === id));
  const html = `<div class="side">${extracto(f.ex)}${ficha(f)}</div>
    <div class="sheet main anim"><div class="holes" aria-hidden="true"><i></i><i></i><i></i></div><div class="margin" aria-hidden="true"></div><div class="file">Carpeta #${String(idx + 1).padStart(2, '0')}</div>
    <div class="note">Nota interna · KY SpA<br>${esc(f.name)}${f.date ? ' · ' + esc(f.date) : ''}</div>
    <h2 id="dTitle">${esc(f.title || f.name)}</h2>${f.lead ? `<p>${esc(f.lead)}</p>` : ''}${seccionesBase(f)}${parrafos(f.desc)}
    ${tareas(f)}${notas(f)}${ajustes(f, idx)}
    <div class="sign"><span>Yojhan Furuya · KY SpA</span>${sello()}</div></div>`;
  poner(html, swap);
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
}
function pintarDiario(swap) {
  actual = '_diario'; dos.style.setProperty('--c', '#2A2A2A');
  $('#dCrumbs').innerHTML = ['Archivo', 'KY SpA', 'Diario'].map(s => `<span>${s}</span>`).join('');
  $$('.spine').forEach(s => s.toggleAttribute('aria-current', s.dataset.id === '_diario'));
  const q = filtro.trim().toLowerCase();
  const todas = st.folders.flatMap(f => f.notes.map(n => ({ ...n, _f: f.id, _fn: f.name, _fc: f.color }))).sort((a, b) => b.ts - a.ts);
  const ns = q ? todas.filter(n => n.txt.toLowerCase().includes(q) || n._fn.toLowerCase().includes(q)) : todas;
  const pend = st.folders.flatMap(f => f.tasks.filter(t => !t.done).map(t => ({ ...t, _fn: f.name, _fc: f.color, _f: f.id })));
  // Las que se tachan siguen a la vista (14 días), tachadas, para poder destacharlas
  const hace = Date.now() - 14 * 864e5;
  const lista = st.folders.flatMap(f => f.tasks.filter(t => !t.done || (t.at || 0) > hace).map(t => ({ ...t, _fn: f.name, _f: f.id })));
  const html = `<div class="side"><div class="sheet excerpt anim a2"><h3>Resumen</h3><div class="big">${pend.length}<small>tareas pendientes en todas las carpetas</small></div>
      ${st.folders.map(f => { const p = f.tasks.filter(t => !t.done).length; return `<div class="row"><span>${esc(f.name)}</span><b>${p} · ${f.notes.length} notas</b></div>`; }).join('')}</div></div>
    <div class="sheet main anim"><div class="holes" aria-hidden="true"><i></i><i></i><i></i></div><div class="margin" aria-hidden="true"></div><div class="file">Diario</div>
    <div class="note">Todas las notas de todas las carpetas,<br>de la más nueva a la más antigua.</div>
    <h2 id="dTitle">Diario</h2>
    <input class="field" id="qDiario" type="search" placeholder="Buscar en las notas…" aria-label="Buscar en las notas" value="${esc(filtro)}">
    ${ns.length ? `<ul class="notes">${ns.map(n => notaHTML(n, `<span class="chip" style="background:${esc(n._fc)}">${esc(n._fn)}</span>`)).join('')}</ul>` : `<p class="empty">${q ? 'Nada coincide con la búsqueda.' : 'Todavía no hay notas. Abre una carpeta y escribe la primera.'}</p>`}
    ${lista.length ? `<div class="sec"><h3>Tareas de todas las carpetas <small id="dCuenta">${pend.length} pendiente${pend.length === 1 ? '' : 's'}</small></h3><ul class="check">${lista.map(t => `<li><label><input type="checkbox" data-task="${esc(t.id)}" data-f="${esc(t._f)}"${t.done ? ' checked' : ''}><span>${esc(t.t)}<small>${esc(t._fn)}${t.g ? ' · ' + esc(t.g) : ''}</small></span></label></li>`).join('')}</ul></div>` : ''}
    <div class="sign"><span>Yojhan Furuya · KY SpA</span>${sello()}</div></div>`;
  poner(html, swap);
  if (location.hash !== '#diario') history.replaceState(null, '', '#diario');
}
function poner(html, swap) {
  const put = () => { const y = desk.scrollTop; deskIn.innerHTML = html; desk.scrollTop = swap ? 0 : y; dispatchEvent(new CustomEvent('ky:pintado', { detail: { id: actual } })); };
  if (swap && !reduced) { dos.classList.remove('shown'); setTimeout(() => { put(); requestAnimationFrame(() => requestAnimationFrame(() => dos.classList.add('shown'))); }, 160); }
  else { put(); dos.classList.add('shown'); }
}
const refrescar = () => { pintarArchivador(); pintar(actual, false); };

/* ═══ ACCIONES DENTRO DE LA CARPETA ═══ */
deskIn.addEventListener('change', e => {
  const c = e.target.closest('input[data-task]'); if (!c) return;
  const f = F(c.dataset.f || actual); const t = f && f.tasks.find(x => x.id === c.dataset.task); if (!t) return;
  t.done = c.checked; t.at = Date.now(); save(); pintarArchivador();
  if (t.done) toast('Tarea tachada', 'Destachar', () => { t.done = false; t.at = Date.now(); c.checked = false; save(); pintarArchivador(); });
  if (actual === '_diario') { const n = st.folders.reduce((a, x) => a + x.tasks.filter(y => !y.done).length, 0), h = $('#dCuenta'); if (h) h.textContent = `${n} pendiente${n === 1 ? '' : 's'}`; }
  else { const h = $('.sec h3 small', deskIn); if (h) h.textContent = `${f.tasks.filter(x => x.done).length} de ${f.tasks.length} hechas`; }
});
deskIn.addEventListener('input', e => { if (e.target.id === 'qDiario') { filtro = e.target.value; const pos = e.target.selectionStart; pintar('_diario', false); const i = $('#qDiario'); i.focus(); i.setSelectionRange(pos, pos); } });
deskIn.addEventListener('submit', e => {
  e.preventDefault();
  const fm = e.target, tipo = fm.dataset.form, f = F(actual);
  if (tipo === 'task') {
    const t = fm.t.value.trim(); if (!t) { fm.t.focus(); return; }
    f.tasks.push({ id: uid(), t, s: '', g: fm.g.value.trim(), done: false }); save(); refrescar();
    const n = $('form[data-form="task"] input[name="t"]', deskIn); n && n.focus();
  } else if (tipo === 'note') {
    const txt = fm.txt.value.trim(); if (!txt) { fm.txt.focus(); return; }
    f.notes.push({ id: uid(), ts: Date.now(), txt }); save(); refrescar(); toast('Nota guardada');
  } else if (tipo === 'note-edit') {
    const fo = st.folders.find(x => x.notes.some(n => n.id === fm.dataset.id)); const n = fo && fo.notes.find(x => x.id === fm.dataset.id);
    if (n) { n.txt = fm.txt.value.trim() || n.txt; n.edit = true; } editNota = null; save(); refrescar();
  } else if (tipo === 'cfg') {
    f.name = fm.name.value.trim() || f.name; f.date = fm.date.value.trim(); f.title = fm.title.value.trim() || f.name; f.peek = fm.peek.value.trim(); f.desc = fm.desc.value.trim();
    save(); refrescar(); toast('Carpeta actualizada');
  }
});
deskIn.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, f = F(actual);
  if (act === 'ficha-edit') { editFicha = true; refrescar(); }
  else if (act === 'ficha-cancel') { editFicha = false; refrescar(); }
  else if (act === 'ficha-add') { $('#fRows').insertAdjacentHTML('beforeend', filaFicha()); $$('#fRows .frow').pop().querySelector('input').focus(); }
  else if (act === 'ficha-del') { b.closest('.frow').remove(); }
  else if (act === 'ficha-save') { f.ficha = $$('#fRows .frow').map(r => $$('input', r).map(i => i.value.trim())).filter(([a, v]) => a || v); editFicha = false; save(); refrescar(); }
  else if (act === 'task-del') {
    const i = f.tasks.findIndex(t => t.id === b.dataset.id); if (i < 0) return;
    const [t] = f.tasks.splice(i, 1); save(); refrescar();
    toast('Tarea borrada', 'Deshacer', () => { f.tasks.splice(i, 0, t); save(); refrescar(); });
  }
  else if (act === 'note-edit') { editNota = b.dataset.id; confirmar = null; refrescar(); const a = $('form[data-form="note-edit"] textarea', deskIn); if (a) { a.focus(); a.setSelectionRange(a.value.length, a.value.length); } }
  else if (act === 'note-cancel') { editNota = null; refrescar(); }
  else if (act === 'note-del') { confirmar = 'n:' + b.dataset.id; refrescar(); }
  else if (act === 'note-del-ok') {
    const fo = st.folders.find(x => x.notes.some(n => n.id === b.dataset.id)); if (!fo) return;
    const i = fo.notes.findIndex(n => n.id === b.dataset.id); const [n] = fo.notes.splice(i, 1); confirmar = null; save(); refrescar();
    toast('Nota borrada', 'Deshacer', () => { fo.notes.push(n); save(); refrescar(); });
  }
  else if (act === 'cancel-confirm') { confirmar = null; refrescar(); }
  else if (act === 'color') { f.color = b.dataset.c; save(); refrescar(); dos.style.setProperty('--c', f.color); $('details.cfg', deskIn).open = true; }
  else if (act === 'move') {
    const i = st.folders.indexOf(f), j = i + Number(b.dataset.d); if (j < 0 || j >= st.folders.length) return;
    [st.folders[i], st.folders[j]] = [st.folders[j], st.folders[i]]; save(); refrescar(); $('details.cfg', deskIn).open = true;
  }
  else if (act === 'tab-reset') { delete f.tabX; save(); refrescar(); $('details.cfg', deskIn).open = true; }
  else if (act === 'folder-del') { confirmar = 'f:' + f.id; refrescar(); }
  else if (act === 'folder-del-ok') {
    const i = st.folders.indexOf(f); st.folders.splice(i, 1); if (f.seed) (st.deleted = st.deleted || []).push(f.id);
    confirmar = null; save(); cerrar(); pintarArchivador();
    toast(`Carpeta «${f.name}» borrada`, 'Deshacer', () => { st.folders.splice(i, 0, f); st.deleted = (st.deleted || []).filter(x => x !== f.id); save(); pintarArchivador(); });
  }
});
deskIn.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.matches('textarea')) e.target.form.requestSubmit(); });

/* ═══ ABRIR Y CERRAR ═══ */
function abrir(id, el) {
  if (id !== '_diario' && !F(id)) return;
  ultimoFoco = document.activeElement; editFicha = false; editNota = null; confirmar = null;
  pintar(id, false); document.body.classList.add('lock');
  const color = id === '_diario' ? '#2A2A2A' : F(id).color;
  if (el && !reduced) {
    const r = el.getBoundingClientRect(); grow.hidden = false; grow.style.setProperty('--c', color);
    Object.assign(grow.style, { transition: 'none', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: Math.max(r.height, 60) + 'px', borderRadius: '12px 12px 0 0' });
    void grow.offsetWidth; grow.style.transition = '';
    Object.assign(grow.style, { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', borderRadius: '0' });
    setTimeout(() => { dos.classList.add('open'); requestAnimationFrame(() => { dos.classList.add('shown'); grow.hidden = true; }); $('#dClose').focus(); }, 620);
  } else { dos.classList.add('open', 'shown'); $('#dClose').focus(); }
}
function cerrar() {
  dos.classList.remove('shown', 'open'); document.body.classList.remove('lock'); actual = null; dispatchEvent(new CustomEvent('ky:cerrado'));
  history.replaceState(null, '', location.pathname + location.search);
  ultimoFoco && ultimoFoco.focus && ultimoFoco.focus();
}
$('#dClose').addEventListener('click', cerrar);
$$('[data-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const id = a.dataset.open; abrir(id, id === '_diario' ? null : $(`.folder[data-id="${id}"]`)); }));
$('.seal').addEventListener('click', e => { e.preventDefault(); if (actual) cerrar(); scrollTo({ top: 0, behavior: 'smooth' }); });
addEventListener('hashchange', () => { const h = location.hash.slice(1); const id = h === 'diario' ? '_diario' : h; if (id === '_diario' || F(id)) { if (!actual) abrir(id, null); else if (id !== actual) pintar(id, true); } else if (actual) cerrar(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#modal').hidden) cerrarModal(); else if (actual) cerrar(); } });

/* ═══ VENTANAS: carpeta nueva y respaldo ═══ */
const modal = $('#modal');
function abrirModal(html) { modal.innerHTML = `<div class="card" role="dialog" aria-modal="true"><button class="ico x2" data-m="close" aria-label="Cerrar">✕</button>${html}</div>`; modal.hidden = false; const i = $('input,textarea,button.pbtn', modal); i && i.focus(); }
function cerrarModal() { modal.hidden = true; modal.innerHTML = ''; }
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-m="close"]')) cerrarModal(); });
let colorNuevo = COLORS[st.folders.length % COLORS.length];
$('#bNueva').addEventListener('click', () => {
  colorNuevo = COLORS[st.folders.length % COLORS.length];
  abrirModal(`<h2>Carpeta nueva</h2><p>Un área de la empresa: un cliente, un producto, una idea, un trámite…</p>
    <form id="fNueva"><input class="field" name="name" placeholder="Nombre (ej. KY Studio)" maxlength="28" required aria-label="Nombre de la carpeta">
    <div class="swatches" style="margin-top:12px" role="group" aria-label="Color">${COLORS.map(c => `<button type="button" class="sw" data-c="${c}" style="--s:${c}" aria-label="Color ${c}" aria-pressed="${c === colorNuevo}"></button>`).join('')}</div>
    <div class="btns"><button class="pbtn">Crear carpeta</button><button type="button" class="pbtn lite" data-m="close">Cancelar</button></div></form>`);
  $('#fNueva').addEventListener('click', e => { const s = e.target.closest('.sw'); if (!s) return; colorNuevo = s.dataset.c; $$('.sw', modal).forEach(x => x.setAttribute('aria-pressed', x === s)); });
  $('#fNueva').addEventListener('submit', e => {
    e.preventDefault(); const name = e.target.name.value.trim(); if (!name) return;
    const f = { id: 'c-' + uid(), seed: false, name, color: colorNuevo, date: fechaCorta(Date.now()), peek: '', title: name, lead: '', sections: [], ficha: [], ex: null, desc: '', tasks: [], notes: [] };
    st.folders.push(f); save(); cerrarModal(); pintarArchivador(); abrir(f.id, $(`.folder[data-id="${f.id}"]`));
  });
});
$('#bResp').addEventListener('click', () => {
  const nN = st.folders.reduce((a, f) => a + f.notes.length, 0), nT = st.folders.reduce((a, f) => a + f.tasks.length, 0);
  abrirModal(`<h2>Respaldo</h2><p>Tus notas y tareas se guardan solo en este dispositivo. Exporta un respaldo de vez en cuando y guárdalo en Drive o en tu correo: con él recuperas todo en otra tablet o computador.</p>
    <p style="font-family:var(--mono);font-size:.82rem;color:var(--paper-2)">${st.folders.length} carpetas · ${nT} tareas · ${nN} notas · ${esc(fecha(st.updated))}</p>
    <div class="btns"><button class="pbtn" data-r="exp">Descargar respaldo</button><button class="pbtn lite" data-r="copy">Copiar respaldo</button><label class="pbtn lite" style="cursor:pointer">Importar respaldo<input type="file" accept="application/json,.json" data-r="imp" hidden></label></div>
    <div class="btns" id="rConf"></div>`);
  modal.onclick = null;
  $('.card', modal).addEventListener('click', async e => {
    const r = e.target.closest('[data-r]'); if (!r) return;
    const json = JSON.stringify(st, null, 1);
    if (r.dataset.r === 'exp') {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `ky-archivo-respaldo-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Respaldo descargado');
    } else if (r.dataset.r === 'copy') {
      try { await navigator.clipboard.writeText(json); toast('Respaldo copiado: pégalo en una nota o correo'); } catch (err) { toast('No se pudo copiar en este navegador'); }
    }
  });
  $('input[data-r="imp"]', modal).addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    let d; try { d = JSON.parse(await file.text()); } catch (err) { toast('Ese archivo no es un respaldo válido'); return; }
    if (!d || !Array.isArray(d.folders)) { toast('Ese archivo no es un respaldo de KY Archivo'); return; }
    const n = d.folders.reduce((a, f) => a + (f.notes || []).length, 0);
    $('#rConf').innerHTML = `<span class="confirm">¿Reemplazar todo por el respaldo (${d.folders.length} carpetas, ${n} notas)? <button class="pbtn danger" id="rSi">Sí, reemplazar</button><button class="pbtn lite" id="rNo">No</button></span>`;
    $('#rNo').onclick = () => { $('#rConf').innerHTML = ''; };
    $('#rSi').onclick = () => { st = d; st.folders.forEach(f => { f.tasks = f.tasks || []; f.notes = f.notes || []; }); save(); cerrarModal(); if (actual) cerrar(); pintarArchivador(); toast('Respaldo importado'); };
  });
});

/* ═══ PUENTE CON LA MESA (mesa.js) ═══ */
window.KY = { get st() { return st; }, save, toast, get actual() { return actual; } };

/* ═══ INICIO ═══ */
pintarArchivador();
const h0 = location.hash.slice(1), id0 = h0 === 'diario' ? '_diario' : h0;
if (id0 === '_diario' || F(id0)) { pintar(id0, false); dos.classList.add('open', 'shown'); document.body.classList.add('lock'); }
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

/* ═══ NOVEDADES: tareas y notas que llegan desde novedades.json ═══
   Cada novedad tiene un id y se aplica una sola vez por dispositivo.
   tipos: tarea (agrega) · hecha (tacha) · editar (cambia texto) · nota (agrega a la bitácora) · ficha (cambia un dato de la ficha) */
function buscarTarea(f, txt) { const t = (txt || '').toLowerCase(); return f.tasks.find(x => x.t.toLowerCase() === t) || f.tasks.find(x => x.t.toLowerCase().startsWith(t)); }
function aplicarNovedades(lista) {
  st.aplicadas = st.aplicadas || [];
  let n = 0;
  lista.forEach(o => {
    if (!o || !o.id || st.aplicadas.includes(o.id)) return;
    const f = F(o.carpeta);
    if (f) {
      if (o.tipo === 'tarea' && !buscarTarea(f, o.t)) { f.tasks.push({ id: uid(), g: o.g || '', t: o.t, s: o.s || '', done: !!o.hecha, at: o.hecha ? Date.now() : undefined }); n++; }
      else if (o.tipo === 'hecha') { const t = buscarTarea(f, o.t); if (t && !t.done) { t.done = true; t.at = Date.now(); n++; } }
      else if (o.tipo === 'editar') { const t = buscarTarea(f, o.t); if (t) { if (o.nuevo) t.t = o.nuevo; if (o.s != null) t.s = o.s; if (o.g) t.g = o.g; n++; } }
      else if (o.tipo === 'nota') { f.notes.push({ id: uid(), ts: o.ts ? Date.parse(o.ts) : Date.now(), txt: o.txt }); n++; }
      else if (o.tipo === 'ficha' && Array.isArray(f.ficha)) { const r = f.ficha.find(x => x[0] === o.campo); if (r) r[1] = o.valor; else f.ficha.push([o.campo, o.valor]); n++; }
    }
    st.aplicadas.push(o.id);
  });
  if (n) { save(); refrescar(); toast(n === 1 ? '1 novedad agregada al archivo' : n + ' novedades agregadas al archivo'); }
  else save();
}
function traerNovedades() {
  if (!navigator.onLine) return;
  fetch('novedades.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { if (j && Array.isArray(j.novedades)) aplicarNovedades(j.novedades); }).catch(() => {});
}
traerNovedades();
addEventListener('online', traerNovedades);
document.addEventListener('visibilitychange', () => { if (!document.hidden) traerNovedades(); });
})();
