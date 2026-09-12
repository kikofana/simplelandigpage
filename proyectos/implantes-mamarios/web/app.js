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
  forma: $("forma"),
  superficie: $("superficie"),
  orden: $("orden"),
  listaMarcas: $("listaMarcas"),
  resumen: $("resumen"),
  resultados: $("resultados"),
  avisoDemo: $("avisoDemo"),
  avisoDemoTexto: $("avisoDemoTexto"),
};

const unicos = (campo) => [...new Set(IMPLANTES.map((i) => i[campo]))].sort();
const num = (n, dec = 1) => n.toFixed(dec).replace(".", ",");

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

  // En anatómica el punto de máxima proyección cae en el polo inferior.
  const apexY = yTop + alto * (forma === "anatomica" ? 0.68 : 0.5);
  const apexX = x0 + proy;
  const dArriba = (apexY - yTop) * 0.78;
  const dAbajo = (yBot - apexY) * 0.78;

  const perfil = `M${x0},${yTop}
    C${x0 + proy * 0.72},${yTop} ${apexX},${apexY - dArriba} ${apexX},${apexY}
    C${apexX},${apexY + dAbajo} ${x0 + proy * 0.62},${yBot} ${x0},${yBot} Z`;

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
  const indice = imp.proyeccionCm / imp.baseCm;

  const fuente = [imp.catalogo, imp.pagina ? `p. ${imp.pagina}` : null]
    .filter(Boolean).join(" · ");

  return `<article class="tarjeta${exacta ? " exacta" : ""}">
    <div class="tarjeta-cabecera">
      <div>
        <div class="marca-linea">${imp.marca} · ${imp.linea}</div>
        <div class="referencia">${imp.referencia}</div>
      </div>
      <span class="delta${exacta ? " cero" : ""}">
        ${exacta ? "exacta" : `${signo}${num(Math.abs(delta), 1)}`}
      </span>
    </div>

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
      ${medida("Índice", num(indice, 2), "")}
    </dl>

    <div class="fuente">
      ${fuente}${imp.notas ? ` — ${imp.notas}` : ""}
    </div>
  </article>`;
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

  const encontrados = IMPLANTES.filter((i) =>
    i.baseCm >= min - 0.001 &&
    i.baseCm <= max + 0.001 &&
    marcas.includes(i.marca) &&
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

  const rango = `${num(min)}–${num(max)} cm`;
  el.resumen.innerHTML = encontrados.length
    ? `<strong>${encontrados.length}</strong> ${encontrados.length === 1 ? "opción" : "opciones"}
       con base entre <strong>${rango}</strong>`
    : `Ninguna opción con base entre <strong>${rango}</strong> con estos filtros.`;

  el.resultados.innerHTML = encontrados.length
    ? encontrados.map((i) => tarjeta(i, objetivo)).join("")
    : `<p class="vacio-total">Prueba a ampliar la tolerancia o a quitar filtros.</p>`;

  guardarEstado();
}

// --- Estado (comodidad, no dato crítico) ------------------------------------

function guardarEstado() {
  try {
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify({
      base: el.base.value,
      tolerancia: el.tolerancia.value,
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
    el.forma.value = previo.forma ?? "";
    el.superficie.value = previo.superficie ?? "";
    el.orden.value = previo.orden ?? "cercania";
  }

  mostrarAvisoDatos();

  document.querySelector("main").addEventListener("input", buscar);
  buscar();
}

iniciar();
