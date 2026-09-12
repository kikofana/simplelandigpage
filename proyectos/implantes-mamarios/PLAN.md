# Plan: memoria de conocimiento de implantes + buscador

## El caso de uso que manda

> Tengo una paciente con una base mamaria de 11 cm. Quiero ver todas las
> opciones entre 10,5 y 11,5 cm, de las marcas que uso, con sus medidas
> completas, ordenadas por cercanía a 11.

Todo lo demás (filtros, esquemas, comparador) es secundario. Si esa consulta no
se responde en dos segundos y con datos fiables, el resto no importa.

## Decisiones de arquitectura

**Datos en CSV, no en base de datos.** Una tabla plana de ~600 filas no
necesita Postgres. En CSV es auditable, se abre en Excel, y cada corrección
queda como un diff legible en git — que en datos clínicos es justo lo que
quieres: poder ver quién cambió qué medida y cuándo.

**App estática, sin backend y sin build.** Se abre haciendo doble clic en
`index.html`, funciona sin conexión. Consecuencia importante: **ningún dato de
paciente sale del ordenador**, porque no hay servidor al que salir. En un
contexto clínico eso elimina de golpe toda la conversación de hosting,
RGPD y consentimiento. Si más adelante se publica, se publica el catálogo, que
no es dato personal.

**Un paso de construcción mínimo.** `construir.py` valida el CSV y lo convierte
a `web/datos.js`. Existe por una razón concreta: un `index.html` abierto desde
`file://` no puede hacer `fetch()` de un CSV por CORS. Generando un `.js` la
app funciona con doble clic, sin levantar servidor.

**Los esquemas se dibujan, no se almacenan.** El SVG se genera a partir de
base/altura/proyección de cada fila. Así el dibujo nunca puede contradecir a la
tabla, y no hay que mantener 600 imágenes.

## El problema de fondo: las marcas no hablan el mismo idioma

Cada fabricante nombra la proyección a su manera, y son incomparables entre sí:

| Marca | Nomenclatura de perfil |
|---|---|
| Mentor | Moderate, Moderate Plus, Moderate Plus Xtra, High, Xtra High, Ultra High |
| Motiva | Mini, Demi, Full, Corsé |
| Silimed | nomenclatura propia por línea |

Un "Demi" de Motiva no es un "Moderate Plus" de Mentor. Por eso el esquema
guarda **dos** campos:

- `perfil_marca` — la etiqueta tal cual la imprime el catálogo, sin traducir.
- `proyeccion_cm` — el número, que sí es comparable entre marcas.

Y la app deriva un `índice de proyección` (proyección ÷ base) que permite
comparar formas entre fabricantes sin fiarse de los nombres comerciales. Dos
implantes con índice 0,45 se comportan parecido aunque uno se llame "High" y el
otro "Demi".

**Nunca se traduce un perfil de una marca al vocabulario de otra.** Esa
equivalencia no existe y fabricarla induce a error.

## Trazabilidad

Cada fila lleva `catalogo` (documento y año) y `pagina`. No es burocracia: si
una medida resulta rara en quirófano, tienes que poder ir al PDF exacto y
comprobarla en diez segundos. Los catálogos además se revisan — sin el año no
sabes si una fila está vigente.

## Fases

### Fase 1 — Esqueleto ✅ hecho
Esquema de datos, validador, buscador con tolerancia ±, esquemas SVG, interfaz.
Funciona de punta a punta con datos de demostración ficticios.

### Fase 2 — Datos reales ⛔ bloqueado
Volcar Mentor, Motiva y Silimed desde los catálogos. **Bloqueado: la red de
esta sesión no deja descargar los PDF.** Ver "Qué hace falta" abajo.

### Fase 3 — Refinamiento
Con datos reales dentro y tras usarlo en consulta:
- Comparador lado a lado de 2–3 implantes.
- Filtro por volumen además de por base.
- Campo de arco vertical anotado en el esquema lateral.
- Exportar la selección (PDF o impresión) para la historia.

### Fase 4 — Migración
Salir a repo propio. Se hace cuando la Fase 2 esté cerrada, no antes: mover una
carpeta es trivial, mover una carpeta a medias no.

## Qué hace falta para desbloquear la Fase 2

Los PDF de catálogo de Mentor, Motiva y Silimed, subidos al chat o al repo. Con
ellos puedo extraer las tablas, validar y cargar.

Dos avisos sobre la carga:

1. **La versión importa.** Necesito saber de qué año es cada catálogo. Las
   referencias y perfiles cambian entre ediciones.
2. **Toda fila cargada hay que contrastarla contra el PDF antes de usarla en
   consulta.** La extracción de tablas de PDF falla de formas silenciosas
   (columnas desplazadas, comas decimales perdidas). `construir.py` detecta
   incoherencias groseras, pero no puede saber si un 11,5 era en realidad 11,0.
   La revisión de la primera carga es manual y no me la puedo saltar por ti.
