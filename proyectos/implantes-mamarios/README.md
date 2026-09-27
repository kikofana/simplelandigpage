# Memoria de implantes mamarios + buscador

Base de datos de implantes con sus medidas, y una interfaz para buscar por
**base mamaria con tolerancia**: "base 11 cm, ±0,5" devuelve todo lo que hay
entre 10,5 y 11,5, ordenado por cercanía.

## Estado

**935 implantes cargados**: 369 redondos y 566 anatómicos.

| Marca | Línea | Forma | Filas | Bases |
|---|---|---|---|---|
| Polytech | Même SublimeLine | redonda | 198 | 7,3 – 15,0 cm |
| Polytech | Opticon / Replicon / Optimam SublimeLine | anatómica | 388 | 7,3 – 15,8 cm |
| Polytech | Opticon 4Two / Replicon 4Two | anatómica | 57 | 10,4 – 13,6 cm |
| Mentor | CPG Cohesive III | anatómica | 121 | 9,0 – 17,0 cm |
| Mentor | MemoryGel Xtra (SILTEX y liso) | redonda | 53 | 8,4 – 15,7 cm |
| Motiva | Round SilkSurface (Mini/Demi/Full/Corsé) | redonda | 76 | 8,5 – 14,5 cm |
| Silimed | Redondos (LO/MD/HI/XH) | redonda | 42 | 9,2 – 12,5 cm |

Una consulta de base 11 ±0,5 devuelve 210 opciones, 141 de ellas de Polytech.
Con tanto volumen conviene acotar con los filtros de marca, forma o superficie.

### Polytech, en corto

- **Cuatro superficies**: POLYsmoooth (lisa), MESMO y POLYtxt
  (microtexturizadas según EN ISO 14607) y **Microthane**, espuma de
  poliuretano que el propio catálogo dice que no cabe en esa norma. Por eso
  tiene su propio valor, `poliuretano`, en el filtro de superficie.
- **Cuatro formas**: Même (redonda); **Replicon**, base redonda con proyección
  anatómica; **Opticon**, base corta (altura menor que la anchura); y
  **Optimam**, base oblonga (altura mayor). Más la línea **4Two**, de doble gel.
- **El volumen no viene en columna**: va en el sufijo de la referencia
  (`10724-110` = 110 cc). Verificado contra la geometría: la relación volumen ÷
  (base² × proyección) es estable dentro de cada forma.
- **La columna D es el arco del ápex al borde**, la misma medida que el arco de
  Motiva y Silimed (verificado numéricamente). Salvo en 4Two: ver abajo.

Las CPG cubren las nueve combinaciones de altura (Baja/Media/Alta) por
proyección (Moderada/Moderada Plus/Alta). La denominación lo codifica: dígito 1
cohesión, 2 altura, 3 proyección — `332` es altura alta con proyección
moderada plus.

### El arco no es comparable entre marcas

Mentor publica el **Arco del Polo Inferior (API)**: del punto más bajo del polo
inferior al **punto medio** del implante, e **incluye 0,5 cm de cubierta
tisular**. Motiva y Silimed publican un arco que no se define igual.

Para saber cuáles son la misma medida, se compara cada arco con el teórico del
ápex al borde (un cuarto de elipse de semiejes base/2 y proyección):

| Arco | Arco ÷ teórico |
|---|---|
| Polytech Même (D) | 0,96 |
| Motiva | 0,98 |
| Silimed | 0,99 |
| Polytech 4Two (D) | 1,09 – 1,10 |
| Mentor CPG (API) | 1,13 |

**Polytech Même, Motiva y Silimed miden lo mismo** y se pueden comparar entre
sí. **La API de Mentor y la D de 4Two no**: son otra magnitud, y el catálogo de
Polytech no define la de 4Two. Las anatómicas de Polytech dan 0,72 – 0,80, más
corto porque el ápex cae en el polo inferior, coherente con la misma definición.
La base, la altura y la proyección sí son siempre comparables.

### Lo que falta en estos datos

Nada de esto impide usarlo, pero conviene tenerlo presente:

1. **Las 171 filas de redondos de Mentor, Motiva y Silimed no tienen catálogo
   ni página**, así que no se puede contrastar una medida contra su origen.
   Las CPG y todo Polytech sí: salen de los PDF que están en `datos/fuentes/`,
   con su página. La app avisa mientras queden filas sin trazabilidad.
2. **`20734-365` (Replicon POLYtxt, proyección baja, 13 cm) tiene un volumen
   dudoso.** El catálogo imprime 365 cc, pero su serie va 235 → 365 → 290 y por
   geometría serían unos 260 cc. Es la única anomalía de volumen en las 49
   tablas de Polytech. Base, altura y proyección encajan en la serie. Confirmar
   la referencia con el distribuidor; mientras, la ficha lo avisa.
3. **Una fila de Polytech está tapada en el PDF** (`10724-330`, Même lisa baja
   de 13,5 cm): el texto sigue en el archivo pero en la página no se ve, así
   que no se ha cargado. Probablemente el distribuidor no la ofrece.
4. **Silimed no trae superficie ni línea**, quedan como `sin especificar`.
5. **Las páginas de CPG aportadas no indican la superficie.** Se marcan como
   SILTEX / texturizada, que es lo que monta la línea, pero no está leído del
   documento.
6. **La tabla de Silimed parece truncada**: termina en `505 HI` (12,5 cm) sin
   las MD/LO de esa base.
7. **De Motiva solo está Round SilkSurface**; falta Ergonomix.
8. **El catálogo de Polytech es de febrero de 2021.** Conviene comprobar que
   las referencias siguen vigentes.

### Ya verificado

- **SilkSurface cuenta como lisa.** Confirmado; la taxonomía normalizada la
  registra así y el término comercial se conserva en `superficie_marca`.
- **Las proyecciones no monótonas de Mentor son correctas.** `THPX-405` (5,9)
  → `THPX-425` (5,8) y `THPX-455` (6,0) → `THPX-470` (5,9) son así en el
  catálogo: más volumen con menos proyección. Contrastado contra el origen, no
  es un error de transcripción. Si el chequeo de coherencia vuelve a sacarlas,
  son ellas.

## Uso

Abre `web/index.html` en el navegador. Doble clic, sin servidor y sin conexión.
`web/una-sola-pagina.html` es lo mismo en un único fichero, para llevarlo suelto.

Ningún dato sale del ordenador: no hay backend.

Filtros: base con tolerancia, volumen (deslizador de dos asas), grupo de
proyección, forma, superficie y marca. Al elegir **anatómica** aparece además un
filtro de **altura**. Y se pueden marcar hasta tres implantes para compararlos
con las siluetas superpuestas a la misma escala.

### Los grupos de proyección y de altura

Los nombres comerciales no son comparables entre marcas, así que ambos grupos
(baja / media / alta) se calculan de un índice normalizado, no de la etiqueta
del fabricante. Así seguirán funcionando cuando entren marcas con otra
nomenclatura.

| Grupo | Índice | Cortes |
|---|---|---|
| Proyección | proyección ÷ base | 0,39 y 0,45 |
| Altura | altura ÷ base | 0,91 y 0,98 |

**De dónde salen.** Se fijaron con Mentor, Motiva y Silimed, cuando caían en
huecos reales del catálogo: entre 0,370 y 0,407 de proyección no había ningún
implante, ni entre 0,944 y 1,019 de altura. Con eso, el de altura reproducía
exactamente las etiquetas de las 121 CPG de Mentor sin leerlas, y el de
proyección clasificaba entero cada perfil salvo el CPG 313.

**Con Polytech ya no hay huecos.** Polytech tiene cuatro niveles de proyección
(L/M/H/X) y rellena los espacios: 42 implantes caen en el antiguo hueco de
0,370–0,407. Con todo el catálogo junto, el mayor hueco que queda es de 0,007,
así que **no existe un corte "más natural" al que moverse** y se han mantenido.
Los grupos siguen siendo puramente geométricos; lo que se pierde es que cada
perfil comercial caiga entero en uno.

Qué se reparte ahora, en Polytech:

- **Proyección**: 38 de sus 49 perfiles caen enteros en un grupo. Los 11 que no,
  son casi todos perfiles "Alta" (H), que por geometría quedan a caballo entre
  media y alta. Es la realidad del implante: su índice cae ahí.
- **Altura**: Opticon cae entero en baja (0,84), Optimam en alta (1,16) y
  **Replicon también en alta**, porque su huella es redonda (índice 1,00) aunque
  su perfil sea anatómico. El único perfil que se reparte es Opticon 4Two
  (0,904 – 0,922), justo encima del corte de 0,91.

Las etiquetas de Mentor se siguen reproduciendo exactamente: los cortes no se
han tocado.

Esto también deja ver cosas que los nombres esconden: el "Moderado Plus"
redondo de Mentor (0,347) proyecta menos que su propio "Moderada Plus" de CPG
(0,422), pese a llamarse casi igual.

El filtro de altura solo aparece con anatómicas: en una redonda la altura **es**
la base, así que todas caerían en el mismo grupo y no separaría nada.

## Cargar o corregir datos

El CSV lo genera `datos/fuentes/importar.py`, que guarda la transcripción de
los catálogos y cómo se mapearon las columnas de cada fabricante. **Ese script
sobrescribe el CSV entero**, así que para un catálogo nuevo o una corrección
que deba perdurar, el sitio es el script:

```bash
python3 datos/fuentes/importar.py   # regenera datos/implantes.csv
python3 construir.py                # valida y regenera web/datos.js
```

Para un retoque puntual también vale editar el CSV a mano:

1. Edita `datos/implantes.csv` (se abre en Excel o en cualquier editor).
   Los campos están documentados en `datos/esquema.md`. Recuerda que el
   siguiente `importar.py` se lo llevará por delante.
2. Regenera:

   ```bash
   python3 construir.py
   ```

   Valida el CSV y reescribe `web/datos.js`. Si hay errores, no genera nada y
   dice qué fila falla. Los avisos (medidas fuera de rango, proyección mayor
   que la base) suelen ser columnas mal extraídas de un PDF — conviene mirarlos.

3. Recarga el navegador.

`python3 construir.py --validar` comprueba sin escribir.

Sin dependencias: solo Python 3 de la biblioteca estándar.

## Estructura

```
datos/
  implantes.csv    GENERADO por fuentes/importar.py
  plantilla.csv    CSV vacío con las cabeceras
  esquema.md       qué significa cada columna y qué se valida
  fuentes/
    importar.py                  transcripción de los catálogos -> implantes.csv
    mentor-cpg-anatomicas.pdf    catálogo original de las CPG
    polytech-biocablan-2021.pdf  catálogo Polytech (17 MB)
    extraer_polytech.py          PDF de Polytech -> polytech.csv
    polytech.csv                 tablas de Polytech ya extraídas y verificadas
web/
  index.html       la app
  app.js           búsqueda + generación de los esquemas SVG
  estilos.css
  datos.js         GENERADO, no editar
construir.py       valida CSV -> genera datos.js
PLAN.md            plan, decisiones de diseño y fases
```

## Detalles que conviene saber

**Los perfiles no se traducen entre marcas.** Un "Demi" de Motiva no equivale a
un "Moderate Plus" de Mentor. El CSV guarda la etiqueta literal del catálogo en
`perfil_marca`, y para comparar entre fabricantes la app calcula un **índice de
proyección** (proyección ÷ base), que sí es comparable.

**Los esquemas se dibujan desde las medidas**, no son imágenes almacenadas. Por
eso nunca pueden contradecir a la tabla. La vista lateral coloca el punto de
máxima proyección en el polo inferior cuando la forma es anatómica. Son
esquemas de proporción, no la geometría exacta del fabricante.

**La interfaz es deliberadamente neutra**, priorizando que los números se lean
de un vistazo. Es una herramienta de trabajo, no material de paciente. Si en
algún momento se quiere enseñar en consulta, ahí sí tocaría aplicarle la
identidad de la clínica.

## Migración

Esto vive dentro del repo de hobby a propósito, hasta cerrar la carga de datos.
Cuando salga a repo propio se mueve la carpeta entera: no hay nada que dependa
de estar aquí.
