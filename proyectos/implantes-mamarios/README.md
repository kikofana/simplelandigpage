# Memoria de implantes mamarios + buscador

Base de datos de implantes con sus medidas, y una interfaz para buscar por
**base mamaria con tolerancia**: "base 11 cm, ±0,5" devuelve todo lo que hay
entre 10,5 y 11,5, ordenado por cercanía.

## Estado

**292 implantes cargados**: 171 redondos y 121 anatómicos.

| Marca | Línea | Forma | Filas | Bases |
|---|---|---|---|---|
| Mentor | CPG Cohesive III | anatómica | 121 | 9,0 – 17,0 cm |
| Mentor | MemoryGel Xtra (SILTEX y liso) | redonda | 53 | 8,4 – 15,7 cm |
| Motiva | Round SilkSurface (Mini/Demi/Full/Corsé) | redonda | 76 | 8,5 – 14,5 cm |
| Silimed | Redondos (LO/MD/HI/XH) | redonda | 42 | 9,2 – 12,5 cm |

Una consulta de base 11 ±0,5 devuelve 69 opciones: 42 redondas y 27 anatómicas.

Las CPG cubren las nueve combinaciones de altura (Baja/Media/Alta) por
proyección (Moderada/Moderada Plus/Alta). La denominación lo codifica: dígito 1
cohesión, 2 altura, 3 proyección — `332` es altura alta con proyección
moderada plus.

### El arco no es comparable entre marcas

Mentor publica el **Arco del Polo Inferior (API)**: del punto más bajo del polo
inferior al **punto medio** del implante, e **incluye 0,5 cm de cubierta
tisular**. Motiva y Silimed publican un arco que no se define igual.

Las tres cifras viven en la columna `arco_cm`, pero **no son la misma
magnitud**. Compáralas dentro de una marca, no entre marcas. La base, la altura
y la proyección sí son directamente comparables.

### Lo que falta en estos datos

Nada de esto impide usarlo, pero conviene tenerlo presente:

1. **Las 171 filas de redondos no tienen catálogo ni página**, así que no se
   puede contrastar una medida contra su origen. Las 121 CPG sí: salen del PDF
   que está en `datos/fuentes/`, con su página. La app avisa mientras queden
   filas sin trazabilidad.
2. **Silimed no trae superficie ni línea**, quedan como `sin especificar`.
3. **Las páginas de CPG aportadas no indican la superficie.** Se marcan como
   SILTEX / texturizada, que es lo que monta la línea, pero no está leído del
   documento.
4. **La tabla de Silimed parece truncada**: termina en `505 HI` (12,5 cm) sin
   las MD/LO de esa base.
5. **De Motiva solo está Round SilkSurface**; falta Ergonomix.

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

Ningún dato sale del ordenador: no hay backend.

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
    importar.py                transcripción de los catálogos -> implantes.csv
    mentor-cpg-anatomicas.pdf  catálogo original de las CPG
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
