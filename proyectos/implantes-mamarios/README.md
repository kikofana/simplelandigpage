# Memoria de implantes mamarios + buscador

Base de datos de implantes con sus medidas, y una interfaz para buscar por
**base mamaria con tolerancia**: "base 11 cm, ±0,5" devuelve todo lo que hay
entre 10,5 y 11,5, ordenado por cercanía.

## Estado

| | |
|---|---|
| Buscador, filtros, esquemas, validación | ✅ funcionando |
| Datos reales de Mentor / Motiva / Silimed | ⛔ **pendientes** |

Ahora mismo solo hay **12 filas de demostración con medidas inventadas**
(`marca = DEMO`), para poder probar la interfaz. La app muestra un aviso
mientras estén ahí. No sirve para planificar nada hasta cargar los catálogos.

Por qué están pendientes: la red de la sesión donde se montó esto bloquea la
descarga de los PDF de los fabricantes, y las medidas de implantes no se
reconstruyen de memoria. Ver `PLAN.md` → "Qué hace falta".

## Uso

Abre `web/index.html` en el navegador. Doble clic, sin servidor y sin conexión.

Ningún dato sale del ordenador: no hay backend.

## Cargar o corregir datos

1. Edita `datos/implantes.csv` (se abre en Excel o en cualquier editor).
   Los campos están documentados en `datos/esquema.md`.
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
  implantes.csv    fuente de verdad, editable a mano
  plantilla.csv    CSV vacío con las cabeceras
  esquema.md       qué significa cada columna y qué se valida
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
