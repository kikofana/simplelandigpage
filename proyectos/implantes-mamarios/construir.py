#!/usr/bin/env python3
"""Valida datos/implantes.csv y genera web/datos.js.

El .js existe porque un index.html abierto desde file:// no puede hacer fetch()
de un CSV (CORS). Generándolo, la app funciona con doble clic y sin servidor.

Uso:
    python3 construir.py            # valida y genera
    python3 construir.py --validar  # solo valida, no escribe nada
"""

import csv
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).parent
CSV_ENTRADA = RAIZ / "datos" / "implantes.csv"
WEB = RAIZ / "web"
JS_SALIDA = WEB / "datos.js"
# Version de un solo fichero: sirve para publicarla o para pasarla por correo
# sin arrastrar la carpeta entera.
SUELTA_SALIDA = WEB / "una-sola-pagina.html"

OBLIGATORIAS = [
    "marca", "linea", "referencia", "forma", "superficie", "perfil_marca",
    "volumen_cc", "base_cm", "altura_cm", "proyeccion_cm", "catalogo",
]
OPCIONALES = ["superficie_marca", "arco_cm", "gel", "pagina", "notas"]

FORMAS = {"redonda", "anatomica"}
# Taxonomía normalizada, para poder filtrar liso/texturizado entre marcas.
# El término comercial literal (SILTEX, SilkSurface, …) va en superficie_marca.
SUPERFICIES = {
    "lisa", "texturizada", "microtexturizada", "nanotexturizada",
    "sin especificar",
}
NUMERICAS = ["volumen_cc", "base_cm", "altura_cm", "proyeccion_cm"]

# Rangos plausibles: fuera de aquí no es error, pero casi siempre es una
# columna mal extraída del PDF.
RANGOS = {
    "base_cm": (6.0, 18.0),
    "altura_cm": (6.0, 18.0),
    "proyeccion_cm": (1.0, 8.0),
    "volumen_cc": (80.0, 1000.0),
}


def numero(valor):
    """Convierte a float aceptando coma decimal. None si no se puede."""
    try:
        return float(str(valor).strip().replace(",", "."))
    except (ValueError, AttributeError):
        return None


def validar(filas, cabeceras):
    errores, avisos = [], []

    faltan = [c for c in OBLIGATORIAS if c not in cabeceras]
    if faltan:
        errores.append(f"Faltan columnas obligatorias en el CSV: {', '.join(faltan)}")
        return errores, avisos, []

    limpias = []
    vistas = {}

    for i, fila in enumerate(filas, start=2):  # fila 1 = cabecera
        ref = f"fila {i} ({fila.get('marca', '?')} {fila.get('referencia', '?')})"
        fallo_en_fila = False

        for col in OBLIGATORIAS:
            if not str(fila.get(col, "")).strip():
                errores.append(f"{ref}: '{col}' está vacío")
                fallo_en_fila = True

        clave = (str(fila.get("marca", "")).strip(), str(fila.get("referencia", "")).strip())
        if clave in vistas:
            errores.append(f"{ref}: referencia duplicada, ya aparece en la fila {vistas[clave]}")
            fallo_en_fila = True
        else:
            vistas[clave] = i

        forma = str(fila.get("forma", "")).strip().lower()
        if forma and forma not in FORMAS:
            errores.append(f"{ref}: forma '{forma}' no válida (usa: {', '.join(sorted(FORMAS))})")
            fallo_en_fila = True

        superficie = str(fila.get("superficie", "")).strip().lower()
        if superficie and superficie not in SUPERFICIES:
            errores.append(
                f"{ref}: superficie '{superficie}' no válida "
                f"(usa: {', '.join(sorted(SUPERFICIES))})"
            )
            fallo_en_fila = True

        valores = {}
        for col in NUMERICAS:
            n = numero(fila.get(col))
            if n is None:
                errores.append(f"{ref}: '{col}' = '{fila.get(col)}' no es un número")
                fallo_en_fila = True
            elif n <= 0:
                errores.append(f"{ref}: '{col}' debe ser mayor que 0")
                fallo_en_fila = True
            else:
                valores[col] = n
                minimo, maximo = RANGOS[col]
                if not (minimo <= n <= maximo):
                    avisos.append(
                        f"{ref}: '{col}' = {n} está fuera del rango habitual "
                        f"({minimo}–{maximo}). Contrastar con el catálogo."
                    )

        if fallo_en_fila:
            continue

        if forma == "redonda" and abs(valores["base_cm"] - valores["altura_cm"]) > 0.001:
            errores.append(
                f"{ref}: es redonda pero base ({valores['base_cm']}) "
                f"y altura ({valores['altura_cm']}) no coinciden"
            )
            continue

        if valores["proyeccion_cm"] > valores["base_cm"]:
            avisos.append(
                f"{ref}: la proyección ({valores['proyeccion_cm']}) supera a la base "
                f"({valores['base_cm']}). Posible columna desplazada al extraer el PDF."
            )

        arco = numero(fila.get("arco_cm")) if str(fila.get("arco_cm", "")).strip() else None
        pagina = str(fila.get("pagina", "")).strip()

        limpias.append({
            "marca": str(fila["marca"]).strip(),
            "linea": str(fila["linea"]).strip(),
            "referencia": str(fila["referencia"]).strip(),
            "forma": forma,
            "superficie": superficie,
            "superficieMarca": str(fila.get("superficie_marca", "")).strip() or None,
            "perfilMarca": str(fila["perfil_marca"]).strip(),
            "volumenCc": valores["volumen_cc"],
            "baseCm": valores["base_cm"],
            "alturaCm": valores["altura_cm"],
            "proyeccionCm": valores["proyeccion_cm"],
            "arcoCm": arco,
            "gel": str(fila.get("gel", "")).strip() or None,
            "catalogo": str(fila["catalogo"]).strip(),
            "pagina": pagina or None,
            "notas": str(fila.get("notas", "")).strip() or None,
        })

    n_demo = sum(1 for f in limpias if f["marca"].upper() == "DEMO")
    if n_demo:
        avisos.append(
            f"Hay {n_demo} filas de demostración (marca = DEMO) con medidas FICTICIAS. "
            "Bórralas en cuanto cargues los catálogos reales."
        )

    # Estos tres se agrupan: por fila serían cientos de líneas idénticas.
    sin_arco = [f for f in limpias if f["arcoCm"] is None]
    if sin_arco:
        marcas = ", ".join(sorted({f"{f['marca']} {f['linea']}" for f in sin_arco}))
        avisos.append(f"{len(sin_arco)} filas sin arco vertical ({marcas})")

    sin_superficie = [f for f in limpias if f["superficie"] == "sin especificar"]
    if sin_superficie:
        marcas = ", ".join(sorted({f["marca"] for f in sin_superficie}))
        avisos.append(f"{len(sin_superficie)} filas sin superficie identificada ({marcas})")

    sin_pagina = [f for f in limpias if not f["pagina"]]
    if sin_pagina:
        avisos.append(
            f"{len(sin_pagina)} filas sin página de catálogo: no se puede "
            "contrastar la medida contra el origen"
        )

    return errores, avisos, limpias


def generar_pagina_suelta(payload):
    """Mete CSS, datos y JS dentro de un solo HTML autocontenido."""
    html = (WEB / "index.html").read_text(encoding="utf-8")
    cuerpo = html.split("<body>", 1)[1].split("</body>", 1)[0]
    # Fuera las etiquetas <script src>: el codigo va incrustado mas abajo.
    cuerpo = re.sub(r'\s*<script src="[^"]+"></script>', "", cuerpo).strip()

    css = (WEB / "estilos.css").read_text(encoding="utf-8")
    app = (WEB / "app.js").read_text(encoding="utf-8")

    return (
        "<!doctype html>\n<html lang=\"es\">\n<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>Buscador de implantes</title>\n"
        f"<style>\n{css}\n</style>\n"
        f"</head>\n<body>\n{cuerpo}\n"
        f"<script>\nconst IMPLANTES = {payload};\n</script>\n"
        f"<script>\n{app}\n</script>\n"
        "</body>\n</html>\n"
    )


def main():
    solo_validar = "--validar" in sys.argv

    if not CSV_ENTRADA.exists():
        print(f"ERROR: no existe {CSV_ENTRADA}", file=sys.stderr)
        return 1

    with CSV_ENTRADA.open(encoding="utf-8-sig", newline="") as fh:
        lector = csv.DictReader(fh)
        cabeceras = lector.fieldnames or []
        filas = [f for f in lector if any(str(v).strip() for v in f.values())]

    errores, avisos, limpias = validar(filas, cabeceras)

    for aviso in avisos:
        print(f"  aviso: {aviso}")
    for error in errores:
        print(f"  ERROR: {error}", file=sys.stderr)

    if errores:
        print(f"\n{len(errores)} error(es). No se genera nada.", file=sys.stderr)
        return 1

    print(f"\n{len(limpias)} implantes válidos, {len(avisos)} aviso(s).")

    if solo_validar:
        return 0

    JS_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(limpias, ensure_ascii=False, indent=2)
    JS_SALIDA.write_text(
        "// Generado por construir.py a partir de datos/implantes.csv\n"
        "// No editar a mano: los cambios se pierden en la siguiente ejecución.\n"
        f"const IMPLANTES = {payload};\n",
        encoding="utf-8",
    )
    print(f"Escrito {JS_SALIDA.relative_to(RAIZ)}")

    SUELTA_SALIDA.write_text(generar_pagina_suelta(payload), encoding="utf-8")
    kb = SUELTA_SALIDA.stat().st_size / 1024
    print(f"Escrito {SUELTA_SALIDA.relative_to(RAIZ)} ({kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
