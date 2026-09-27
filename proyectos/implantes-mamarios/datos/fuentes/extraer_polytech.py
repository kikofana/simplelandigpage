#!/usr/bin/env python3
"""Extrae las tablas de implantes mamarios del catálogo Polytech a polytech.csv.

    python3 datos/fuentes/extraer_polytech.py

Necesita pdfplumber, Pillow y pdftoppm (poppler-utils). Solo hace falta volver
a ejecutarlo si cambia el PDF; importar.py lee el CSV que deja.

--- Por qué no basta con extraer el texto ---------------------------------

El PDF del distribuidor tapa alguna fila con un rectángulo del color del fondo,
pero el texto sigue debajo: la extracción lo devuelve aunque en la página no se
vea. Así que cada referencia se comprueba contra la página renderizada y solo
se conserva si en su caja hay píxeles que se distinguen del fondo de la fila.

Ojo, "distinguirse" y no "ser oscuro": cada superficie imprime sus tablas en
su color (MESMO en verde, POLYtxt en azul...), así que buscar píxeles oscuros
da por ocultas páginas enteras que se leen perfectamente.

En el catálogo de febrero de 2021 solo hay una fila tapada: 10724-330.
"""
import csv
import re
import subprocess
import tempfile
from pathlib import Path

import pdfplumber
from PIL import Image

AQUI = Path(__file__).parent
PDF = AQUI / "polytech-biocablan-2021.pdf"
SALIDA = AQUI / "polytech.csv"
DPI = 150
ESC = DPI / 72
PAGINAS = [10, 11, 14, 15, 16, 17, 20, 21, 22, 24, 25, 26, 27, 28]
REF = re.compile(r"^\d{5}-\d{3}$")
NUM = re.compile(r"^\d+(,\d+)?$")


def visible(img, w):
    caja = (int(w["x0"] * ESC), int(w["top"] * ESC), int(w["x1"] * ESC), int(w["bottom"] * ESC))
    px = list(img.crop(caja).convert("RGB").getdata())
    if not px:
        return False
    fondo = max(set(px), key=px.count)
    distinto = sum(1 for p in px if max(abs(a - b) for a, b in zip(p, fondo)) > 60)
    return distinto / len(px) > 0.005


def titulos(page, mid):
    out = []
    palabras = page.extract_words()
    for linea in page.extract_text_lines():
        t = linea["text"]
        if re.match(r"\s*\d{5}-", t) or not re.search(r"Proyecci|4Two A[OR]|extra al", t):
            continue
        en_linea = [w for w in palabras if abs(w["top"] - linea["top"]) < 2]
        for izquierda in (True, False):
            ws = [w["text"] for w in en_linea if (w["x0"] < mid) == izquierda]
            if ws:
                out.append((izquierda, linea["top"], " ".join(ws)))
    return out


def main():
    filas, ocultas = [], []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", str(DPI), "-png", str(PDF), f"{tmp}/p"], check=True)
        pdf = pdfplumber.open(PDF)
        for n in PAGINAS:
            page = pdf.pages[n - 1]
            img = Image.open(next(Path(tmp).glob(f"p-{n:02d}.png")))
            mid = page.width / 2 - 10
            tits = titulos(page, mid)
            words = page.extract_words()
            for w in words:
                if not REF.match(w["text"]):
                    continue
                izq = w["x0"] < mid
                misma = sorted(
                    (v for v in words if abs(v["top"] - w["top"]) < 2 and v["x0"] > w["x1"]
                     and (v["x0"] < mid) == izq),
                    key=lambda v: v["x0"])
                nums = [v["text"].replace(",", ".") for v in misma if NUM.match(v["text"])][:4]
                cand = [t for t in tits if t[0] == izq and t[1] < w["top"]] or \
                       [t for t in tits if t[1] < w["top"]]  # p. 16 solo tiene tablas a la derecha
                titulo = max(cand, key=lambda t: t[1])[2]
                fila = {"pagina": n, "titulo": titulo, "referencia": w["text"],
                        "base_mm": nums[0], "altura_mm": nums[1], "proyeccion_mm": nums[2], "d_mm": nums[3]}
                (filas if visible(img, w) else ocultas).append(fila)

    with SALIDA.open("w", newline="", encoding="utf-8") as fh:
        wr = csv.DictWriter(fh, fieldnames=list(filas[0]))
        wr.writeheader()
        wr.writerows(filas)
    print(f"{len(filas)} filas visibles -> {SALIDA.name}")
    for f in ocultas:
        print(f"  descartada por no verse en la página: p. {f['pagina']} {f['referencia']}")


if __name__ == "__main__":
    main()
