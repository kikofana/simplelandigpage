#!/usr/bin/env python3
"""Extrae las tres tablas del catálogo de Motiva a motiva.csv.

    python3 datos/fuentes/extraer_motiva.py

Necesita pdfplumber. Solo hace falta volver a ejecutarlo si cambia el PDF;
importar.py lee el CSV que deja.

El PDF es SmoothSilk Matrix (documento SID-001021 Rev. 1), tres páginas:

  1  Round SilkSurface     A base, B proyección, C arco, V volumen
  2  Ergonomix             A, B, C al 40 %, C al 45 %, V ("Approximate Arc
                           Length measurements based on clinical model")
  3  Ergonomix2 (JOY)      A, B, C al 40 %, C al 45 %, V ("C = Distance")

Cada fila impresa lleva cuatro implantes, uno por perfil: Mini, Demi, Full y
Corsé. Un asterisco tras el volumen es "Special Order".
"""
import csv
import re
from pathlib import Path

import pdfplumber

AQUI = Path(__file__).parent
PDF = AQUI / "motiva-smoothsilk.pdf"
SALIDA = AQUI / "motiva.csv"

PERFILES = {"M": "Mini", "D": "Demi", "F": "Full", "C": "Corsé"}
LINEAS = {1: "Round SilkSurface", 2: "Ergonomix SilkSurface", 3: "Ergonomix2 SmoothSilk"}
REF = re.compile(r"^(RS|ERS|E2S)[MDFC]-\d+Z?$")


def num(s):
    return float(s.rstrip("*").replace(",", "."))


def main():
    filas = []
    pdf = pdfplumber.open(PDF)
    for n, pagina in enumerate(pdf.pages, start=1):
        campos = 5 if n == 1 else 6          # ref + medidas + volumen
        for linea in (pagina.extract_text() or "").splitlines():
            tokens = linea.split()
            i = 0
            while i < len(tokens):
                if not REF.match(tokens[i]):
                    i += 1
                    continue
                grupo = tokens[i:i + campos]
                ref = grupo[0]
                vol = grupo[-1]
                fila = {
                    "pagina": n, "linea": LINEAS[n], "referencia": ref,
                    "perfil": PERFILES[re.match(r"^(?:RS|ERS|E2S)([MDFC])", ref).group(1)],
                    "base_cm": num(grupo[1]), "proyeccion_cm": num(grupo[2]),
                    "arco_cm": num(grupo[3]) if n == 1 else "",
                    "c40_cm": num(grupo[3]) if n > 1 else "",
                    "c45_cm": num(grupo[4]) if n > 1 else "",
                    "volumen_cc": int(num(vol)),
                    "pedido_especial": "si" if vol.endswith("*") else "",
                }
                filas.append(fila)
                i += campos

    with SALIDA.open("w", newline="", encoding="utf-8") as fh:
        wr = csv.DictWriter(fh, fieldnames=list(filas[0]))
        wr.writeheader()
        wr.writerows(filas)
    por_pagina = {n: sum(1 for f in filas if f["pagina"] == n) for n in (1, 2, 3)}
    print(f"{len(filas)} filas -> {SALIDA.name}  {por_pagina}")


if __name__ == "__main__":
    main()
