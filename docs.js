/* ══════════════════════════════════════════════════════════════
   KY SpA Archivo — Documentos (facturas, comprobantes, fotos, PDF)
   Los archivos se guardan en este dispositivo, en IndexedDB (aguanta
   archivos grandes; localStorage no). Cada carpeta tiene su sección
   «Documentos». El respaldo de documentos es un archivo aparte.
   ══════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const $ = (s, c = document) => c.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const MAX = 25 * 1024 * 1024; // 25 MB por archivo
const TIPOS = ['Factura', 'Comprobante de pago', 'Boleta', 'Contrato', 'Captura', 'Foto', 'Otro'];

/* ─── Base de datos ─── */
let dbp;
function db() {
  if (!dbp) dbp = new Promise((ok, mal) => {
    const r = indexedDB.open('ky-archivo-docs', 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore('docs', { keyPath: 'id' }); s.createIndex('folder', 'folder'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
  });
  return dbp;
}
async function tx(modo, fn) { const d = await db(); return new Promise((ok, mal) => { const t = d.transaction('docs', modo); const s = t.objectStore('docs'); const res = fn(s); t.oncomplete = () => ok(res && res.result !== undefined ? res.result : res); t.onerror = () => mal(t.error); t.onabort = () => mal(t.error); }); }
const todos = () => tx('readonly', s => s.getAll());
const deCarpeta = f => tx('readonly', s => s.index('folder').getAll(f));
const guardar = d => tx('readwrite', s => s.put(d));
const borrar = id => tx('readwrite', s => s.delete(id));
const uno = id => tx('readonly', s => s.get(id));

/* ─── Utilidades ─── */
const peso = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const fecha = ts => new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
const esImg = t => /^image\//.test(t), esPdf = t => t === 'application/pdf';
const urls = new Map();
function url(d) { if (!urls.has(d.id)) urls.set(d.id, URL.createObjectURL(d.blob)); return urls.get(d.id); }
function limpiarUrls() { urls.forEach(u => URL.revokeObjectURL(u)); urls.clear(); }
function icono(t) { return esPdf(t) ? 'PDF' : /sheet|excel|csv/.test(t) ? 'XLS' : /word|document/.test(t) ? 'DOC' : 'ARCH'; }

/* ─── Sección dentro de la carpeta ─── */
let carpeta = null, conf = null;
async function pintarSeccion() {
  const K = window.KY; if (!K) return;
  const id = K.actual; const main = $('#deskIn .sheet.main');
  if (!main || !id || id === '_diario') return;
  carpeta = id;
  let sec = $('#docsSec', main);
  if (!sec) { sec = document.createElement('div'); sec.className = 'sec'; sec.id = 'docsSec'; const cfg = $('details.cfg', main); main.insertBefore(sec, cfg || $('.sign', main)); }
  let lista = [];
  try { lista = (await deCarpeta(id)).sort((a, b) => b.ts - a.ts); } catch (e) { sec.innerHTML = `<h3>Documentos</h3><p class="empty">Este navegador no permite guardar archivos (¿modo privado?).</p>`; return; }
  if (K.actual !== id) return;
  limpiarUrls();
  sec.innerHTML = `<h3>Documentos <small>${lista.length ? `${lista.length} archivo${lista.length > 1 ? 's' : ''}` : ''}</small></h3>
    <p class="dhelp">Facturas, comprobantes, contratos, fotos o capturas de esta carpeta. Se guardan en este dispositivo; para tenerlos en otro, usa <b>Respaldo → Documentos</b>.</p>
    <label class="dsube" tabindex="0"><input type="file" multiple accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" hidden><span class="dplus">+</span><span><b>Subir documentos</b><small>Imágenes o PDF · hasta 25 MB cada uno · también puedes arrastrarlos aquí</small></span></label>
    <div id="dPend"></div>
    ${lista.length ? `<ul class="dlist">${lista.map(d => itemHTML(d)).join('')}</ul>` : `<p class="empty">Todavía no hay documentos en esta carpeta.</p>`}`;
}
function itemHTML(d) {
  const c = conf === d.id;
  const mini = esImg(d.type) ? `<img src="${url(d)}" alt="" loading="lazy">` : `<span class="dico">${icono(d.type)}</span>`;
  return `<li data-doc="${esc(d.id)}"><button class="dmini" data-d="ver" aria-label="Ver ${esc(d.name)}">${mini}</button>
    <div class="dinfo"><b>${esc(d.title || d.name)}</b><small>${d.kind ? `<span class="dkind">${esc(d.kind)}</span> ` : ''}${esc(fecha(d.ts))} · ${esc(peso(d.size))}${d.title && d.title !== d.name ? ' · ' + esc(d.name) : ''}</small>${d.desc ? `<p>${esc(d.desc)}</p>` : ''}</div>
    <div class="dacc">${c ? `<span class="confirm">¿Borrar? <button class="pbtn danger" data-d="borrar-ok">Sí</button><button class="pbtn lite" data-d="no">No</button></span>` : `<button class="pbtn lite" data-d="ver">Ver</button><button class="pbtn lite" data-d="bajar">Descargar</button><button class="ico" data-d="editar" aria-label="Editar datos">✎</button><button class="ico" data-d="borrar" aria-label="Borrar documento">✕</button>`}</div></li>`;
}

/* ─── Subir: pide tipo y descripción antes de guardar ─── */
let pendientes = [];
function prepararSubida(files) {
  const ok = [...files].filter(f => f.size <= MAX), grandes = [...files].length - ok.length;
  if (grandes) window.KY.toast(`${grandes} archivo(s) pesan más de 25 MB y no se subieron`);
  if (!ok.length) return;
  pendientes = ok;
  const tipo = sugerirTipo(ok[0].name);
  $('#dPend').innerHTML = `<form class="dform" data-dform="nuevo"><p><b>${ok.length === 1 ? esc(ok[0].name) : ok.length + ' archivos'}</b> · ${esc(peso(ok.reduce((a, f) => a + f.size, 0)))}</p>
    <div class="grid2"><label>Tipo<select class="field" name="kind">${TIPOS.map(t => `<option${t === tipo ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Nombre ${ok.length > 1 ? '(se numera solo)' : ''}<input class="field" name="title" value="${esc(ok.length === 1 ? ok[0].name.replace(/\.[^.]+$/, '') : '')}" placeholder="Ej.: Factura NIC pulsoresto.cl"></label></div>
    <label style="display:block;margin-top:8px">Para qué es (opcional)<textarea class="area" name="desc" placeholder="Ej.: Dominio pulsoresto.cl, 1 año, pagado con Webpay el 27-11-2026"></textarea></label>
    <div class="btns"><button class="pbtn">Guardar en la carpeta</button><button type="button" class="pbtn lite" data-d="cancelar-subida">Cancelar</button></div></form>`;
  $('#dPend input[name=title]').focus();
}
function sugerirTipo(n) { n = n.toLowerCase(); return /factura|invoice|dte/.test(n) ? 'Factura' : /comprobante|recibo|receipt|pago|voucher/.test(n) ? 'Comprobante de pago' : /boleta/.test(n) ? 'Boleta' : /contrato/.test(n) ? 'Contrato' : /screenshot|captura|pantallazo/.test(n) ? 'Captura' : /\.(jpe?g|heic|png)$/.test(n) ? 'Foto' : 'Otro'; }
async function confirmarSubida(fm) {
  const kind = fm.kind.value, title = fm.title.value.trim(), desc = fm.desc.value.trim();
  const fs = pendientes; pendientes = [];
  $('#dPend').innerHTML = `<p class="dhelp">Guardando…</p>`;
  try {
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i];
      await guardar({ id: uid(), folder: carpeta, name: f.name, type: f.type || 'application/octet-stream', size: f.size, ts: Date.now() + i, kind, desc,
        title: title ? (fs.length > 1 ? `${title} (${i + 1})` : title) : f.name.replace(/\.[^.]+$/, ''), blob: f });
    }
    window.KY.toast(fs.length === 1 ? 'Documento guardado' : `${fs.length} documentos guardados`);
    pedirPersistencia();
  } catch (e) { window.KY.toast('No se pudo guardar: el dispositivo puede estar sin espacio'); }
  pintarSeccion();
}
function pedirPersistencia() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} }

/* ─── Visor ─── */
async function ver(id) {
  const d = await uno(id); if (!d) return;
  const m = $('#modal'); const u = url(d);
  const cuerpo = esImg(d.type) ? `<img class="dver-img" src="${u}" alt="${esc(d.title || d.name)}">`
    : esPdf(d.type) ? `<iframe class="dver-pdf" src="${u}" title="${esc(d.title || d.name)}"></iframe><p class="dhelp">¿No se ve bien el PDF? Usa «Abrir aparte».</p>`
    : `<p class="empty">Este tipo de archivo no se puede mostrar aquí. Descárgalo para abrirlo.</p>`;
  m.innerHTML = `<div class="card dver" role="dialog" aria-modal="true" aria-label="${esc(d.title || d.name)}"><button class="ico x2" data-m="close" aria-label="Cerrar">✕</button>
    <h2>${esc(d.title || d.name)}</h2><p class="dhelp">${d.kind ? esc(d.kind) + ' · ' : ''}${esc(fecha(d.ts))} · ${esc(peso(d.size))}</p>${d.desc ? `<p>${esc(d.desc)}</p>` : ''}
    ${cuerpo}<div class="btns"><a class="pbtn" href="${u}" target="_blank" rel="noopener">Abrir aparte</a><button class="pbtn lite" data-dv="bajar" data-id="${esc(d.id)}">Descargar</button></div></div>`;
  m.hidden = false;
  $('[data-dv="bajar"]', m).onclick = () => bajar(d);
}
function bajar(d) {
  const a = document.createElement('a'); a.href = url(d); a.download = d.name; document.body.appendChild(a); a.click(); a.remove();
}

/* ─── Eventos ─── */
const deskIn = $('#deskIn');
deskIn.addEventListener('change', e => { const i = e.target.closest('#docsSec input[type=file]'); if (i && i.files.length) { prepararSubida(i.files); i.value = ''; } });
deskIn.addEventListener('keydown', e => { const l = e.target.closest('.dsube'); if (l && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('input', l).click(); } });
deskIn.addEventListener('submit', e => {
  const fm = e.target.closest('[data-dform]'); if (!fm) return; e.preventDefault();
  if (fm.dataset.dform === 'nuevo') confirmarSubida(fm);
  else if (fm.dataset.dform === 'editar') uno(fm.dataset.id).then(d => { if (!d) return; d.kind = fm.kind.value; d.title = fm.title.value.trim() || d.name; d.desc = fm.desc.value.trim(); return guardar(d); }).then(() => { window.KY.toast('Datos guardados'); pintarSeccion(); });
}, true);
deskIn.addEventListener('click', async e => {
  const b = e.target.closest('#docsSec [data-d]'); if (!b) return;
  const li = b.closest('[data-doc]'), id = li && li.dataset.doc, a = b.dataset.d;
  if (a === 'cancelar-subida') { pendientes = []; $('#dPend').innerHTML = ''; return; }
  if (a === 'ver') return ver(id);
  if (a === 'bajar') { const d = await uno(id); if (d) bajar(d); return; }
  if (a === 'borrar') { conf = id; return pintarSeccion(); }
  if (a === 'no') { conf = null; return pintarSeccion(); }
  if (a === 'borrar-ok') {
    const d = await uno(id); conf = null; await borrar(id); pintarSeccion();
    window.KY.toast('Documento borrado', 'Deshacer', async () => { await guardar(d); pintarSeccion(); });
    return;
  }
  if (a === 'editar') {
    const d = await uno(id); if (!d) return;
    li.outerHTML = `<li><form class="dform" data-dform="editar" data-id="${esc(d.id)}" style="width:100%"><div class="grid2"><label>Tipo<select class="field" name="kind">${TIPOS.map(t => `<option${t === d.kind ? ' selected' : ''}>${t}</option>`).join('')}</select></label><label>Nombre<input class="field" name="title" value="${esc(d.title || '')}"></label></div>
      <label style="display:block;margin-top:8px">Para qué es<textarea class="area" name="desc">${esc(d.desc || '')}</textarea></label><div class="btns"><button class="pbtn">Guardar</button><button type="button" class="pbtn lite" data-d="no">Cancelar</button></div></form></li>`;
  }
});
// Arrastrar y soltar archivos sobre la sección
['dragover', 'drop'].forEach(t => deskIn.addEventListener(t, e => {
  const s = e.target.closest('#docsSec'); if (!s || !e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault(); if (t === 'drop') prepararSubida(e.dataTransfer.files);
}));
addEventListener('ky:pintado', () => { conf = null; pendientes = []; pintarSeccion(); });
addEventListener('ky:cerrado', limpiarUrls);

/* ─── Respaldo de documentos (archivo aparte, porque pesa) ─── */
const aB64 = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(b); });
const deB64 = (s, t) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: t }); };
async function exportar() {
  const ds = await todos(); if (!ds.length) { window.KY.toast('No hay documentos para respaldar'); return; }
  window.KY.toast('Preparando respaldo de documentos…');
  const out = []; for (const d of ds) { const { blob, ...m } = d; out.push({ ...m, data: await aB64(blob) }); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ tipo: 'ky-archivo-documentos', v: 1, fecha: Date.now(), docs: out })], { type: 'application/json' }));
  a.download = `ky-archivo-documentos-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  window.KY.toast(`Respaldo descargado: ${ds.length} documento(s)`);
}
async function importar(file) {
  let j; try { j = JSON.parse(await file.text()); } catch (e) { window.KY.toast('Ese archivo no es un respaldo de documentos'); return; }
  if (!j || j.tipo !== 'ky-archivo-documentos' || !Array.isArray(j.docs)) { window.KY.toast('Ese archivo no es un respaldo de documentos'); return; }
  const ya = new Set((await todos()).map(d => d.id)); let n = 0;
  for (const d of j.docs) { if (ya.has(d.id)) continue; const { data, ...m } = d; await guardar({ ...m, blob: deB64(data, m.type) }); n++; }
  window.KY.toast(n ? `${n} documento(s) agregados` : 'Ya tenías todos esos documentos'); pintarSeccion();
}
$('#bResp').addEventListener('click', () => setTimeout(async () => {
  const card = $('#modal .card'); if (!card || $('#dResp', card)) return;
  let n = 0, b = 0; try { const ds = await todos(); n = ds.length; b = ds.reduce((a, d) => a + d.size, 0); } catch (e) {}
  const div = document.createElement('div'); div.id = 'dResp';
  div.innerHTML = `<h3 style="margin-top:18px">Documentos</h3><p>Las facturas, PDF e imágenes van en un respaldo aparte porque pesan más. ${n ? `Tienes ${n} documento${n > 1 ? 's' : ''} (${peso(b)}).` : 'Todavía no hay documentos.'}</p>
    <div class="btns"><button class="pbtn" id="dExp"${n ? '' : ' disabled'}>Descargar documentos</button><label class="pbtn lite" style="cursor:pointer">Importar documentos<input type="file" accept="application/json,.json" id="dImp" hidden></label></div>`;
  card.appendChild(div);
  $('#dExp', div).onclick = exportar;
  $('#dImp', div).onchange = e => { const f = e.target.files[0]; if (f) importar(f); };
}, 0));

/* Si la carpeta ya estaba abierta al cargar */
if (window.KY && window.KY.actual) pintarSeccion();
})();
