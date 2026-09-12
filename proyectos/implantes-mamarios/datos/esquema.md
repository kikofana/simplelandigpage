# Esquema de `implantes.csv`

Una fila = una referencia concreta de catálogo. Separador `,`, codificación
UTF-8, **punto** como separador decimal (no coma: rompe el CSV).

Medidas siempre en **centímetros**, volumen en **cc**.

| Columna | Obligatorio | Valores | Notas |
|---|---|---|---|
| `marca` | sí | `Mentor`, `Motiva`, `Silimed` | Tal cual, respetando mayúsculas |
| `linea` | sí | texto | Familia de producto: `MemoryGel Xtra`, `Ergonomix`, … |
| `referencia` | sí | texto | Código de catálogo. **Clave única** junto con `marca` |
| `forma` | sí | `redonda`, `anatomica` | Sin tilde en `anatomica` |
| `superficie` | sí | `lisa`, `texturizada`, `microtexturizada`, `nanotexturizada`, `sin especificar` | Taxonomía normalizada, para filtrar entre marcas |
| `superficie_marca` | no | texto | Término comercial literal: `SILTEX`, `SilkSurface`, `Liso` |
| `perfil_marca` | sí | texto | Etiqueta literal del catálogo. **No traducir entre marcas** |
| `volumen_cc` | sí | número | |
| `base_cm` | sí | número | Diámetro/anchura de base. Es el campo que manda en la búsqueda |
| `altura_cm` | sí | número | En redondas coincide con `base_cm` |
| `proyeccion_cm` | sí | número | |
| `arco_cm` | no | número o vacío | Arco vertical: punto de máxima proyección → surco |
| `gel` | no | texto | Cohesividad o denominación del gel |
| `catalogo` | sí | texto | Documento y año. Ej: `Mentor EMEA Product Catalogue 2023` |
| `pagina` | no | número o vacío | Página dentro de ese documento |
| `notas` | no | texto | Sin comas, o entrecomillar el campo |

## Reglas que valida `construir.py`

Errores (bloquean la generación):

- Falta una columna obligatoria, o está vacía.
- Un número no se puede parsear, o es ≤ 0.
- `forma` o `superficie` fuera de los valores permitidos.
- `marca` + `referencia` duplicados.
- `forma = redonda` con `altura_cm` ≠ `base_cm`.

Avisos (no bloquean, pero hay que mirarlos):

- Medidas fuera de rango plausible: base 6–18 cm, proyección 1–8 cm,
  volumen 80–1000 cc.
- `proyeccion_cm` > `base_cm`. Existe, pero es raro: casi siempre es una
  columna mal extraída del PDF.
- Filas sin `arco_cm`, sin `superficie` identificada o sin `pagina`. Se agrupan
  en un solo aviso por tipo, con el recuento y las marcas afectadas.
- Filas con `marca = DEMO` presentes en el dataset.

## Sobre la superficie

Se guardan dos campos por la misma razón que con el perfil: la taxonomía
normalizada (`superficie`) permite filtrar liso frente a texturizado entre
fabricantes, que es un eje clínicamente relevante; y `superficie_marca`
conserva el nombre comercial literal, que no es traducible.

`sin especificar` es un valor legítimo. Es preferible a adivinar.

## Sobre el índice de proyección

La app calcula `proyeccion_cm / base_cm` y lo muestra en cada resultado. Sirve
para comparar la forma entre marcas sin fiarse de los nombres comerciales, que
no son equivalentes. Orientativamente: por debajo de 0,35 es un perfil bajo,
0,35–0,45 medio, por encima de 0,45 alto. No es un estándar de industria, es
una ayuda de lectura.

## De dónde sale `implantes.csv`

El CSV actual lo genera `datos/fuentes/importar.py`, que conserva la
transcripción de los catálogos y documenta cómo se mapearon las columnas de
cada fabricante. **Ojo: ese script sobrescribe el CSV entero.** Si corriges algo
a mano en el CSV, corrige también el script, o el siguiente `importar.py` se
lleva el cambio por delante.

Para añadir un catálogo nuevo, lo natural es ampliar `importar.py`.
