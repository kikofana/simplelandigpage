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
| `superficie` | sí | `lisa`, `texturizada`, `microtexturizada`, `nanotexturizada` | |
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
  volumen 80–900 cc.
- `proyeccion_cm` > `base_cm`. Existe, pero es raro: casi siempre es una
  columna mal extraída del PDF.
- `arco_cm` vacío.
- Filas con `marca = DEMO` presentes en el dataset.

## Sobre el índice de proyección

La app calcula `proyeccion_cm / base_cm` y lo muestra en cada resultado. Sirve
para comparar la forma entre marcas sin fiarse de los nombres comerciales, que
no son equivalentes. Orientativamente: por debajo de 0,35 es un perfil bajo,
0,35–0,45 medio, por encima de 0,45 alto. No es un estándar de industria, es
una ayuda de lectura.

## Datos de demostración

`implantes.csv` viene con filas de `marca = DEMO` y referencias `DEMO-###`.
**Son inventadas, no corresponden a ningún producto real** y existen solo para
que la interfaz se pueda probar vacía de datos reales. Bórralas en cuanto entren
los catálogos de verdad — `construir.py` avisa mientras sigan ahí.
