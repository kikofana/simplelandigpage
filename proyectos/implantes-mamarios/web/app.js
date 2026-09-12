// Buscador de implantes por base mamaria.
// Los datos vienen de datos.js (const IMPLANTES), generado por construir.py.

// Escala fija en px/cm: cada esquema ocupa justo lo que mide su implante, así
// dos tarjetas se pueden comparar visualmente sin leer los números.
const ESCALA = 8;
const PAD_SUP = 8;
const PAD_INF = 26;   // hueco para la cota inferior
const CLAVE_ESTADO = "buscador-implantes-v1";

const $ = (id) => document.getElementById(id);

const el = {
  base: $("base"),
  tolerancia: $("tolerancia"),
  volMin: $("volMin"),
  volMax: $("volMax"),
  proyeccion: $("proyeccion"),
  forma: $("forma"),
  superficie: $("superficie"),
  orden: $("orden"),
  listaMarcas: $("listaMarcas"),
  comparador: $("comparador"),
  comparadorEsquemas: $("comparadorEsquemas"),
  comparadorTabla: $("comparadorTabla"),
  limpiarComparacion: $("limpiarComparacion"),
  resumen: $("resumen"),
  resultados: $("resultados"),
  avisoDemo: $("avisoDemo"),
  avisoDemoTexto: $("avisoDemoTexto"),
};

const unicos = (campo) => [...new Set(IMPLANTES.map((i) => i[campo]))].sort();
const num = (n, dec = 1) => n.toFixed(dec).replace(".", ",");

// Cada marca nombra la proyección a su manera y los nombres no se traducen
// entre sí, así que el grupo se calcula del índice (proyección ÷ base), que sí
// es comparable. Los dos cortes caen en huecos reales del catálogo: entre 0,370
// y 0,407 no hay ningún implante, y entre 0,445 y 0,456 tampoco. Cada perfil de
// cada marca cae entero en un grupo, salvo el CPG 313 de Mentor, que se reparte.
const CORTE_MEDIA = 0.39;
const CORTE_ALTA = 0.45;

const indiceProyeccion = (imp) => imp.proyeccionCm / imp.baseCm;

function grupoProyeccion(imp) {
  const i = indiceProyeccion(imp);
  if (i < CORTE_MEDIA) return "baja";
  return i < CORTE_ALTA ? "media" : "alta";
}

// El CSV guarda los valores sin tildes para no complicar la edición a mano;
// al mostrarlos se acentúan.
const ACENTOS = { anatomica: "Anatómica" };
const cap = (s) => ACENTOS[s] || s.charAt(0).toUpperCase() + s.slice(1);

// --- Esquemas ---------------------------------------------------------------
// Se dibujan a partir de las medidas de cada fila, así el esquema nunca puede
// contradecir a la tabla.

function cota(x1, y1, x2, y2, texto, anclaX, anclaY, rotar) {
  const tope = 3;
  const vertical = x1 === x2;
  const marcas = vertical
    ? `<path d="M${x1 - tope},${y1} H${x1 + tope} M${x2 - tope},${y2} H${x2 + tope}"/>`
    : `<path d="M${x1},${y1 - tope} V${y1 + tope} M${x2},${y2 - tope} V${y2 + tope}"/>`;
  const transform = rotar ? ` transform="rotate(-90 ${anclaX} ${anclaY})"` : "";
  return `<g class="cota" stroke="var(--cota)" stroke-width="1" fill="none">
      <path d="M${x1},${y1} L${x2},${y2}"/>${marcas}
    </g>
    <text x="${anclaX}" y="${anclaY}" text-anchor="middle" font-size="9"
      fill="var(--cota)" font-family="ui-monospace, Menlo, monospace"${transform}>${texto}</text>`;
}

function vistaFrontal({ baseCm, alturaCm }) {
  const ancho = baseCm * ESCALA;
  const alto = alturaCm * ESCALA;
  const padIzq = 4;
  const padDer = 32;             // hueco para la cota de altura
  const w = ancho + padIzq + padDer;
  const h = alto + PAD_SUP + PAD_INF;

  const izq = padIzq;
  const der = padIzq + ancho;
  const cx = padIzq + ancho / 2;
  const cy = PAD_SUP + alto / 2;
  const abajo = PAD_SUP + alto;

  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"
      aria-label="Vista frontal: base ${num(baseCm)} por ${num(alturaCm)} centímetros">
    <ellipse cx="${cx}" cy="${cy}" rx="${ancho / 2}" ry="${alto / 2}"
      fill="var(--implante)" stroke="var(--implante-borde)" stroke-width="1.5"/>
    ${cota(izq, abajo + 11, der, abajo + 11, num(baseCm), cx, abajo + 22, false)}
    ${cota(der + 11, PAD_SUP, der + 11, abajo, num(alturaCm), der + 21, cy, true)}
  </svg>`;
}

// Silueta de perfil. En anatómica el punto de máxima proyección cae en el polo
// inferior y el superior se afina; en redonda es una cúpula simétrica.
function perfilPath(x0, yTop, alto, proy, anatomica) {
  const yBot = yTop + alto;
  const apexY = yTop + alto * (anatomica ? 0.68 : 0.5);
  const apexX = x0 + proy;
  const dArriba = (apexY - yTop) * 0.78;
  const dAbajo = (yBot - apexY) * 0.78;
  // Cuánto se separa la curva de la pared torácica al arrancar: si el polo
  // superior sale recto hacia fuera, la anatómica se ve como una cúpula.
  const salidaSup = proy * (anatomica ? 0.30 : 0.72);
  const salidaInf = proy * (anatomica ? 0.50 : 0.62);

  return `M${x0},${yTop}
    C${x0 + salidaSup},${yTop} ${apexX},${apexY - dArriba} ${apexX},${apexY}
    C${apexX},${apexY + dAbajo} ${x0 + salidaInf},${yBot} ${x0},${yBot} Z`;
}

function vistaLateral({ alturaCm, proyeccionCm, forma }) {
  const alto = alturaCm * ESCALA;
  const proy = proyeccionCm * ESCALA;
  const padIzq = 8;
  const padDer = 10;
  const w = proy + padIzq + padDer;
  const h = alto + PAD_SUP + PAD_INF;

  const x0 = padIzq;             // pared torácica
  const yTop = PAD_SUP;
  const yBot = yTop + alto;
  const apexX = x0 + proy;
  const perfil = perfilPath(x0, yTop, alto, proy, forma === "anatomica");

  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"
      aria-label="Vista lateral: proyección ${num(proyeccionCm)} centímetros">
    <path d="M${x0},${yTop - 5} V${yBot + 5}" stroke="var(--cota)" stroke-width="1.5"
      stroke-dasharray="3 2" fill="none"/>
    <path d="${perfil}" fill="var(--implante)" stroke="var(--implante-borde)" stroke-width="1.5"/>
    ${cota(x0, yBot + 11, apexX, yBot + 11, num(proyeccionCm), x0 + proy / 2, yBot + 22, false)}
  </svg>`;
}

// --- Tarjeta ----------------------------------------------------------------

function medida(etiqueta, valor, unidad) {
  if (valor == null) {
    return `<div class="medida"><dt>${etiqueta}</dt><dd class="vacio">—</dd></div>`;
  }
  return `<div class="medida"><dt>${etiqueta}</dt>
    <dd>${valor}<span class="u"> ${unidad}</span></dd></div>`;
}

function tarjeta(imp, objetivo) {
  const delta = imp.baseCm - objetivo;
  const exacta = Math.abs(delta) < 0.001;
  const signo = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const indice = indiceProyeccion(imp);

  const id = idDe(imp);
  const puesto = seleccion.indexOf(id);
  const comparada = puesto !== -1;
  const lleno = seleccion.length >= MAX_COMPARAR && !comparada;

  const fuente = [imp.catalogo, imp.pagina ? `p. ${imp.pagina}` : null]
    .filter(Boolean).join(" · ");

  return `<article class="tarjeta${exacta ? " exacta" : ""}${comparada ? " comparada" : ""}"
      ${comparada ? `style="--comp: var(--comp-${puesto + 1})"` : ""}>
    <div class="tarjeta-cabecera">
      <div>
        <div class="marca-linea">${imp.marca} · ${imp.linea}</div>
        <div class="referencia">${imp.referencia}</div>
      </div>
      <span class="delta${exacta ? " cero" : ""}">
        ${exacta ? "exacta" : `${signo}${num(Math.abs(delta), 1)}`}
      </span>
    </div>

    <label class="comparar${lleno ? " lleno" : ""}">
      <input type="checkbox" data-id="${id}"${comparada ? " checked" : ""}${lleno ? " disabled" : ""}>
      ${comparada ? "En la comparación" : lleno ? `Máximo ${MAX_COMPARAR}` : "Comparar"}
    </label>

    <div class="etiquetas">
      <span class="etiqueta perfil">${imp.perfilMarca}</span>
      <span class="etiqueta">${cap(imp.forma)}</span>
      <span class="etiqueta">${imp.superficieMarca
        ? `${imp.superficieMarca} · ${imp.superficie}`
        : cap(imp.superficie)}</span>
      ${imp.gel ? `<span class="etiqueta">${imp.gel}</span>` : ""}
    </div>

    <div class="esquemas">
      <figure class="esquema">${vistaFrontal(imp)}<figcaption>Frontal</figcaption></figure>
      <figure class="esquema">${vistaLateral(imp)}<figcaption>Lateral</figcaption></figure>
    </div>

    <dl class="medidas">
      ${medida("Base", num(imp.baseCm), "cm")}
      ${medida("Altura", num(imp.alturaCm), "cm")}
      ${medida("Proyección", num(imp.proyeccionCm), "cm")}
      ${medida("Arco", imp.arcoCm == null ? null : num(imp.arcoCm), "cm")}
      ${medida("Volumen", num(imp.volumenCc, 0), "cc")}
      ${medida("Índice", num(indice, 2), grupoProyeccion(imp))}
    </dl>

    <div class="fuente">
      ${fuente}${imp.notas ? ` — ${imp.notas}` : ""}
    </div>
  </article>`;
}

// --- Comparación ------------------------------------------------------------
// Hasta tres, superpuestas a la misma escala: es donde se ve de un vistazo la
// diferencia entre proyecciones que en la tabla son dos decimales.

const MAX_COMPARAR = 3;
const ESCALA_COMP = 13;
let seleccion = [];   // ids, en el orden en que se marcaron

const idDe = (imp) => `${imp.marca}|${imp.referencia}`;
const implantePorId = (id) => IMPLANTES.find((i) => idDe(i) === id);

function alternarComparacion(id) {
  if (seleccion.includes(id)) seleccion = seleccion.filter((x) => x !== id);
  else if (seleccion.length < MAX_COMPARAR) seleccion = [...seleccion, id];
  buscar();
}

function superposicionFrontal(imps) {
  const anchoMax = Math.max(...imps.map((i) => i.baseCm)) * ESCALA_COMP;
  const altoMax = Math.max(...imps.map((i) => i.alturaCm)) * ESCALA_COMP;
  const pad = 10;
  const w = anchoMax + pad * 2;
  const h = altoMax + pad * 2;

  const formas = imps.map((imp, n) => {
    const rx = (imp.baseCm * ESCALA_COMP) / 2;
    const ry = (imp.alturaCm * ESCALA_COMP) / 2;
    return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${rx}" ry="${ry}"
      fill="var(--comp-${n + 1})" fill-opacity="0.16"
      stroke="var(--comp-${n + 1})" stroke-width="2"/>`;
  }).join("");

  return `<figure class="esquema">
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"
      aria-label="Superposición frontal de los implantes seleccionados">${formas}</svg>
    <figcaption>Frontal</figcaption></figure>`;
}

function superposicionLateral(imps) {
  const altoMax = Math.max(...imps.map((i) => i.alturaCm)) * ESCALA_COMP;
  const proyMax = Math.max(...imps.map((i) => i.proyeccionCm)) * ESCALA_COMP;
  const pad = 10;
  const w = proyMax + pad * 2;
  const h = altoMax + pad * 2;
  const x0 = pad;

  // Centradas verticalmente y apoyadas en la misma pared torácica, para que la
  // comparación sea de proyección y de altura, no de dónde se apoyan.
  const formas = imps.map((imp, n) => {
    const alto = imp.alturaCm * ESCALA_COMP;
    const proy = imp.proyeccionCm * ESCALA_COMP;
    const yTop = (h - alto) / 2;
    return `<path d="${perfilPath(x0, yTop, alto, proy, imp.forma === "anatomica")}"
      fill="var(--comp-${n + 1})" fill-opacity="0.16"
      stroke="var(--comp-${n + 1})" stroke-width="2"/>`;
  }).join("");

  return `<figure class="esquema">
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"
      aria-label="Superposición lateral de los implantes seleccionados">
      <path d="M${x0},${pad / 2} V${h - pad / 2}" stroke="var(--cota)" stroke-width="1.5"
        stroke-dasharray="3 2" fill="none"/>${formas}</svg>
    <figcaption>Lateral</figcaption></figure>`;
}

function renderComparador() {
  const imps = seleccion.map(implantePorId).filter(Boolean);

  if (!imps.length) {
    el.comparador.hidden = true;
    el.comparadorEsquemas.innerHTML = "";
    el.comparadorTabla.innerHTML = "";
    return;
  }
  el.comparador.hidden = false;

  el.comparadorEsquemas.innerHTML =
    superposicionFrontal(imps) + superposicionLateral(imps);

  const filas = [
    ["Base", (i) => `${num(i.baseCm)} cm`],
    ["Altura", (i) => `${num(i.alturaCm)} cm`],
    ["Proyección", (i) => `${num(i.proyeccionCm)} cm`],
    ["Arco", (i) => (i.arcoCm == null ? "—" : `${num(i.arcoCm)} cm`)],
    ["Volumen", (i) => `${num(i.volumenCc, 0)} cc`],
    ["Índice", (i) => `${num(indiceProyeccion(i), 2)} · ${grupoProyeccion(i)}`],
    ["Forma", (i) => cap(i.forma)],
    ["Superficie", (i) => i.superficieMarca || cap(i.superficie)],
  ];

  el.comparadorTabla.innerHTML = `<table>
    <thead><tr><th><span class="oculto">Medida</span></th>
      ${imps.map((i, n) => `<th>
        <span class="punto" style="background: var(--comp-${n + 1})"></span>
        <span class="ref">${i.referencia}</span>
        <span class="sub">${i.marca} · ${i.perfilMarca}</span>
      </th>`).join("")}
    </tr></thead>
    <tbody>${filas.map(([etiqueta, valor]) => `<tr>
      <th scope="row">${etiqueta}</th>
      ${imps.map((i) => `<td>${valor(i)}</td>`).join("")}
    </tr>`).join("")}</tbody>
  </table>`;
}

// --- Búsqueda ---------------------------------------------------------------

function marcasSeleccionadas() {
  return [...el.listaMarcas.querySelectorAll("input:checked")].map((i) => i.value);
}

function buscar() {
  const objetivo = parseFloat(el.base.value);
  const tol = parseFloat(el.tolerancia.value);

  if (!Number.isFinite(objetivo) || !Number.isFinite(tol)) {
    el.resumen.textContent = "Introduce una base y una tolerancia válidas.";
    el.resultados.innerHTML = "";
    return;
  }

  const min = objetivo - tol;
  const max = objetivo + tol;
  const marcas = marcasSeleccionadas();

  // La horquilla de volumen admite dejar un extremo en blanco: sin mínimo, sin
  // máximo, o ninguno de los dos.
  const volMin = parseFloat(el.volMin.value);
  const volMax = parseFloat(el.volMax.value);
  const hayVolMin = Number.isFinite(volMin);
  const hayVolMax = Number.isFinite(volMax);

  const encontrados = IMPLANTES.filter((i) =>
    i.baseCm >= min - 0.001 &&
    i.baseCm <= max + 0.001 &&
    marcas.includes(i.marca) &&
    (!hayVolMin || i.volumenCc >= volMin) &&
    (!hayVolMax || i.volumenCc <= volMax) &&
    (!el.proyeccion.value || grupoProyeccion(i) === el.proyeccion.value) &&
    (!el.forma.value || i.forma === el.forma.value) &&
    (!el.superficie.value || i.superficie === el.superficie.value)
  );

  const criterio = el.orden.value;
  encontrados.sort((a, b) => {
    if (criterio === "volumen") return a.volumenCc - b.volumenCc;
    if (criterio === "proyeccion") return a.proyeccionCm - b.proyeccionCm;
    const da = Math.abs(a.baseCm - objetivo);
    const db = Math.abs(b.baseCm - objetivo);
    return da !== db ? da - db : a.volumenCc - b.volumenCc;
  });

  const criterios = [`base entre <strong>${num(min)}–${num(max)} cm</strong>`];
  if (hayVolMin || hayVolMax) {
    const desde = hayVolMin ? num(volMin, 0) : "";
    const hasta = hayVolMax ? num(volMax, 0) : "";
    criterios.push(hayVolMin && hayVolMax
      ? `volumen <strong>${desde}–${hasta} cc</strong>`
      : hayVolMin ? `desde <strong>${desde} cc</strong>` : `hasta <strong>${hasta} cc</strong>`);
  }
  if (el.proyeccion.value) criterios.push(`proyección <strong>${el.proyeccion.value}</strong>`);
  const filtros = criterios.join(", ");

  el.resumen.innerHTML = encontrados.length
    ? `<strong>${encontrados.length}</strong> ${encontrados.length === 1 ? "opción" : "opciones"} con ${filtros}`
    : `Ninguna opción con ${filtros}.`;

  el.resultados.innerHTML = encontrados.length
    ? encontrados.map((i) => tarjeta(i, objetivo)).join("")
    : `<p class="vacio-total">Prueba a ampliar la tolerancia o a quitar filtros.</p>`;

  renderComparador();
  guardarEstado();
}

// --- Estado (comodidad, no dato crítico) ------------------------------------

function guardarEstado() {
  try {
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify({
      base: el.base.value,
      tolerancia: el.tolerancia.value,
      volMin: el.volMin.value,
      volMax: el.volMax.value,
      proyeccion: el.proyeccion.value,
      forma: el.forma.value,
      superficie: el.superficie.value,
      orden: el.orden.value,
      marcas: marcasSeleccionadas(),
    }));
  } catch { /* modo privado o almacenamiento bloqueado: se ignora */ }
}

function leerEstado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ESTADO) || "null");
  } catch {
    return null;
  }
}

// --- Aviso de calidad de los datos ------------------------------------------
// El banner lo decide el propio dataset, no una constante: mientras falte
// trazabilidad o haya filas de prueba, se ve. Cuando los datos estén completos
// desaparece solo.

function mostrarAvisoDatos() {
  const total = IMPLANTES.length;
  const demo = IMPLANTES.filter((i) => i.marca.toUpperCase() === "DEMO").length;
  const sinPagina = IMPLANTES.filter((i) => !i.pagina).length;
  const partes = [];

  if (demo) {
    partes.push(`<strong>${demo} de ${total} filas son ficticias</strong>
      (marca DEMO) y no corresponden a ningún producto real.`);
  }
  if (sinPagina) {
    partes.push(`${sinPagina === total ? "Los datos no tienen" : `${sinPagina} filas no tienen`}
      referencia de catálogo ni página, así que una medida no se puede
      contrastar contra su origen.`);
  }

  if (!partes.length) return;
  el.avisoDemoTexto.innerHTML =
    partes.join(" ") + " Contrasta cada medida antes de usarla en planificación.";
  el.avisoDemo.hidden = false;
}

// --- Arranque ---------------------------------------------------------------

function iniciar() {
  const previo = leerEstado();

  const marcas = unicos("marca");
  el.listaMarcas.innerHTML = marcas.map((m) => {
    const marcada = !previo || !previo.marcas ? true : previo.marcas.includes(m);
    return `<label class="chip">
      <input type="checkbox" value="${m}"${marcada ? " checked" : ""}> ${m}
    </label>`;
  }).join("");

  for (const s of unicos("superficie")) {
    el.superficie.add(new Option(cap(s), s));
  }

  if (previo) {
    el.base.value = previo.base ?? el.base.value;
    el.tolerancia.value = previo.tolerancia ?? el.tolerancia.value;
    el.volMin.value = previo.volMin ?? "";
    el.volMax.value = previo.volMax ?? "";
    el.proyeccion.value = previo.proyeccion ?? "";
    el.forma.value = previo.forma ?? "";
    el.superficie.value = previo.superficie ?? "";
    el.orden.value = previo.orden ?? "cercania";
  }

  mostrarAvisoDatos();

  // Las casillas de comparar viven dentro de los resultados, que se rehacen en
  // cada búsqueda, así que se escuchan desde el contenedor.
  el.resultados.addEventListener("change", (ev) => {
    const casilla = ev.target.closest("input[data-id]");
    if (casilla) alternarComparacion(casilla.dataset.id);
  });

  el.limpiarComparacion.addEventListener("click", () => {
    seleccion = [];
    buscar();
  });

  document.querySelector(".panel").addEventListener("input", buscar);
  buscar();
}

iniciar();
