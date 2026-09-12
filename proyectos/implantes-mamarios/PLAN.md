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

### Fase 2 — Datos reales 🟢 cubre el uso actual
292 implantes: 171 redondos de Mentor, Motiva y Silimed, y las 121 anatómicas
CPG de Mentor, que son las únicas anatómicas en uso. Todo transcrito en
`datos/fuentes/importar.py`.

Queda, pero no bloquea: la línea **Ergonomix** de Motiva, y completar la
trazabilidad de los redondos (las CPG ya la tienen). Ver README → "Lo que falta
en estos datos".

### Fase 3 — Refinamiento 🟡 en curso
Hecho:
- Volumen con deslizador de dos asas, acotado al rango real del catálogo.
- Grupos normalizados entre marcas, calculados de un índice y no de la etiqueta
  del fabricante: proyección (baja / media / alta) y altura, esta última solo
  visible con anatómicas. Ver README.
- Comparador de hasta tres implantes con las siluetas superpuestas a la misma
  escala, que es donde se ve la diferencia que en la tabla son dos decimales.

Queda:
- Campo de arco vertical anotado en el esquema lateral.
- Exportar la selección (PDF o impresión) para la historia.

### Fase 4 — Migración
Salir a repo propio. Se hace cuando la Fase 2 esté cerrada, no antes: mover una
carpeta es trivial, mover una carpeta a medias no.

## Cómo se cargaron las tres marcas

Las tablas llegaron pegadas como texto. El mapeo de columnas de cada fabricante
queda documentado en `datos/fuentes/importar.py`; el caso que requirió
comprobación fue Motiva, cuyas columnas venían sin etiquetar fila a fila.

El orden (base / proyección / arco / volumen) se dedujo cruzando dos filas
contra Silimed a igual base y proyección, donde el arco tenía que salir casi
idéntico:

```
Motiva  RSC-180   base 8.5  proy 4.0 -> 6.5      Silimed  190 MD   9.2 / 4.0 -> 6.7
Motiva  RSF-315   base 11   proy 4.5 -> 7.7      Silimed  305 MD  11.0 / 4.6 -> 7.8
```

Ambas cuadran, y después se confirmó con el origen.

Las anatómicas CPG salieron de un PDF, con extracción de texto contrastada
contra las páginas renderizadas. En las páginas con dos tablas el orden visual
no coincide con el de extracción, así que el emparejamiento tabla-denominación
se verificó por referencia y por altura.

## Lo que sigue haciendo falta

- **Catálogo, año y página de los 171 redondos.** Es lo que más pesa: sin eso
  no se puede contrastar una medida contra su origen, que es justo lo que salva
  de un error de transcripción. Las 121 CPG ya lo tienen. La app lo avisa
  hasta que se rellene.
- La línea **Ergonomix** de Motiva.
- Confirmar la superficie de las CPG: las páginas aportadas no la indican.

Y un aviso que sigue vigente: **toda fila hay que contrastarla contra el
catálogo antes de usarla en consulta**. `construir.py` detecta incoherencias
groseras, pero no puede saber si un 11,5 era en realidad 11,0.
