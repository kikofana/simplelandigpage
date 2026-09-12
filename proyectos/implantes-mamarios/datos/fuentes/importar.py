#!/usr/bin/env python3
"""Transcripción de los catálogos a datos/implantes.csv.

Este fichero es el registro de qué se transcribió y cómo se mapearon las
columnas de cada fabricante. Se conserva en el repo para poder auditar
cualquier fila contra su origen.

    python3 datos/fuentes/importar.py

Sobrescribe datos/implantes.csv por completo.

--- Mapeo de columnas por fabricante -------------------------------------

SILIMED  El catálogo da A=Height, B=Base, C=Projection, D=Arc. En las 42
         filas aportadas Height == Base, luego son redondas. El sufijo de la
         referencia es el perfil: XH / HI / MD / LO.

MENTOR   Las tablas de redondos dan Volumen, Diámetro y Proyección, sin altura
         ni arco. Al ser redondas, altura = diámetro. El arco queda vacío.
         SILTEX = texturizada; las tablas marcadas LISOS = lisa.

MOTIVA   Las columnas no venían etiquetadas fila a fila. El orden es
         base / proyección / arco / volumen, verificado cruzando dos filas
         contra Silimed a igual base y proyección:
           RSC-180  base 8.5, proy 4.0 -> 6.5   vs Silimed 190 MD  9.2 / 4.0 -> 6.7
           RSF-315  base 11,  proy 4.5 -> 7.7   vs Silimed 305 MD 11.0 / 4.6 -> 7.8
         Las cuatro columnas de perfil son Mini / Demi / Full / Corsé,
         con prefijos de referencia RSM / RSD / RSF / RSC.
"""

import csv
from pathlib import Path

SALIDA = Path(__file__).resolve().parents[1] / "implantes.csv"

# Ningún catálogo venía con nombre ni año. Es un hueco real, así que se hace
# visible en la propia ficha en vez de rellenarlo con algo plausible.
SIN_CATALOGO = "Aportado sin referencia de catálogo"

CABECERAS = [
    "marca", "linea", "referencia", "forma", "superficie", "superficie_marca",
    "perfil_marca", "volumen_cc", "base_cm", "altura_cm", "proyeccion_cm",
    "arco_cm", "gel", "catalogo", "pagina", "notas",
]

# --- Silimed ---------------------------------------------------------------
# (referencia, volumen, altura, base, proyección, arco)
SILIMED = [
    ("255 XH", 255, 9.2, 9.2, 5.6, 7.8), ("225 HI", 225, 9.2, 9.2, 4.8, 7.2),
    ("190 MD", 190, 9.2, 9.2, 4.0, 6.7), ("155 LO", 155, 9.2, 9.2, 3.2, 6.2),
    ("280 XH", 280, 9.5, 9.5, 5.7, 8.0), ("245 HI", 245, 9.5, 9.5, 4.9, 7.3),
    ("205 MD", 205, 9.5, 9.5, 4.1, 6.8), ("170 LO", 170, 9.5, 9.5, 3.3, 6.4),
    ("305 XH", 305, 9.8, 9.8, 5.8, 8.4), ("270 HI", 270, 9.8, 9.8, 5.0, 7.6),
    ("225 MD", 225, 9.8, 9.8, 4.2, 7.0), ("185 LO", 185, 9.8, 9.8, 3.4, 6.6),
    ("325 XH", 325, 10.1, 10.1, 5.9, 8.6), ("285 HI", 285, 10.1, 10.1, 5.1, 7.8),
    ("240 MD", 240, 10.1, 10.1, 4.3, 7.2), ("200 LO", 200, 10.1, 10.1, 3.5, 6.8),
    ("360 XH", 360, 10.4, 10.4, 6.0, 8.8), ("305 HI", 305, 10.4, 10.4, 5.2, 8.1),
    ("255 MD", 255, 10.4, 10.4, 4.4, 7.4), ("215 LO", 215, 10.4, 10.4, 3.6, 7.0),
    ("380 XH", 380, 10.7, 10.7, 6.1, 9.0), ("335 HI", 335, 10.7, 10.7, 5.3, 8.3),
    ("280 MD", 280, 10.7, 10.7, 4.5, 7.6), ("240 LO", 240, 10.7, 10.7, 3.7, 7.2),
    ("410 XH", 410, 11.0, 11.0, 6.2, 9.1), ("365 HI", 365, 11.0, 11.0, 5.4, 8.5),
    ("305 MD", 305, 11.0, 11.0, 4.6, 7.8), ("260 LO", 260, 11.0, 11.0, 3.8, 7.4),
    ("430 XH", 430, 11.3, 11.3, 6.3, 9.2), ("390 HI", 390, 11.3, 11.3, 5.5, 8.6),
    ("330 MD", 330, 11.3, 11.3, 4.7, 8.0), ("275 LO", 275, 11.3, 11.3, 3.9, 7.5),
    ("470 XH", 470, 11.6, 11.6, 6.4, 9.4), ("420 HI", 420, 11.6, 11.6, 5.6, 8.8),
    ("350 MD", 350, 11.6, 11.6, 4.8, 8.2), ("305 LO", 305, 11.6, 11.6, 4.0, 7.7),
    ("500 XH", 500, 11.9, 11.9, 6.5, 9.6), ("445 HI", 445, 11.9, 11.9, 5.7, 9.0),
    ("385 MD", 385, 11.9, 11.9, 4.9, 8.4), ("335 LO", 335, 11.9, 11.9, 4.1, 8.0),
    ("570 XH", 570, 12.5, 12.5, 6.7, 10.0), ("505 HI", 505, 12.5, 12.5, 5.9, 9.4),
]

PERFIL_SILIMED = {
    "XH": "XH (Extra High)", "HI": "HI (High)",
    "MD": "MD (Moderate)", "LO": "LO (Low)",
}

# --- Mentor ----------------------------------------------------------------
# (volumen, diámetro, proyección, referencia)
MENTOR_TMPX = [  # SILTEX Xtra Redondos, Perfil Moderado Plus
    (130, 9.1, 3.1, "TMPX-130"), (160, 9.5, 3.3, "TMPX-160"),
    (190, 10.1, 3.5, "TMPX-190"), (215, 10.5, 3.6, "TMPX-215"),
    (240, 10.9, 3.8, "TMPX-240"), (270, 11.4, 3.9, "TMPX-270"),
    (295, 11.6, 4.1, "TMPX-295"), (325, 11.9, 4.2, "TMPX-325"),
    (350, 12.2, 4.3, "TMPX-350"), (370, 12.7, 4.3, "TMPX-370"),
    (405, 12.8, 4.5, "TMPX-405"), (440, 13.1, 4.8, "TMPX-440"),
    (490, 13.6, 4.8, "TMPX-490"), (545, 14.1, 5.0, "TMPX-545"),
    (605, 14.4, 5.3, "TMPX-605"), (645, 15.0, 5.3, "TMPX-645"),
    (755, 15.7, 5.6, "TMPX-755"),
]
MENTOR_THPX = [  # SILTEX Xtra Redondo, Perfil Alto
    (150, 8.4, 4.2, "THPX-150"), (175, 9.0, 4.4, "THPX-175"),
    (200, 9.4, 4.5, "THPX-200"), (230, 9.8, 4.8, "THPX-230"),
    (255, 10.1, 4.9, "THPX-255"), (285, 10.5, 5.1, "THPX-285"),
    (325, 10.8, 5.4, "THPX-325"), (340, 11.1, 5.4, "THPX-340"),
    (365, 11.4, 5.5, "THPX-365"), (405, 11.6, 5.9, "THPX-405"),
    (425, 11.9, 5.8, "THPX-425"), (455, 12.1, 6.0, "THPX-455"),
    (470, 12.3, 5.9, "THPX-470"), (515, 12.6, 6.2, "THPX-515"),
    (570, 13.2, 6.3, "THPX-570"), (620, 13.4, 6.5, "THPX-620"),
    (680, 14.0, 6.6, "THPX-680"), (725, 14.5, 6.7, "THPX-725"),
    (765, 14.7, 6.7, "THPX-765"),
]
MENTOR_SMPX = [  # Xtra Redondo LISOS, Perfil Moderado Plus
    (130, 8.9, 3.1, "SMPX-130"), (160, 9.5, 3.3, "SMPX-160"),
    (190, 10.0, 3.4, "SMPX-190"), (215, 10.4, 3.6, "SMPX-215"),
    (240, 10.8, 3.7, "SMPX-240"), (270, 11.4, 3.8, "SMPX-270"),
    (295, 11.5, 4.0, "SMPX-295"), (325, 11.9, 4.1, "SMPX-325"),
    (350, 12.3, 4.1, "SMPX-350"), (370, 12.6, 4.1, "SMPX-370"),
    (405, 12.7, 4.4, "SMPX-405"), (440, 13.1, 4.5, "SMPX-440"),
    (490, 13.6, 4.7, "SMPX-490"), (545, 14.0, 4.9, "SMPX-545"),
    (605, 14.5, 5.1, "SMPX-605"), (645, 14.9, 5.1, "SMPX-645"),
    (755, 15.7, 5.4, "SMPX-755"),
]

# --- Motiva ----------------------------------------------------------------
# base, y luego (referencia, proyección, arco, volumen) para Mini/Demi/Full/Corsé
MOTIVA = [
    (8.5, ("RSM-105", 2.2, 5.0, 105), ("RSD-135", 3.1, 5.7, 135), ("RSF-145", 3.5, 6.0, 145), ("RSC-180", 4.0, 6.5, 180)),
    (9.0, ("RSM-125", 2.3, 5.3, 125), ("RSD-155", 3.3, 6.0, 155), ("RSF-175", 3.7, 6.3, 175), ("RSC-210", 4.2, 6.8, 210)),
    (9.5, ("RSM-140", 2.4, 5.5, 140), ("RSD-180", 3.4, 6.3, 180), ("RSF-205", 3.9, 6.7, 205), ("RSC-240", 4.5, 7.2, 240)),
    (9.75, ("RSM-150", 2.4, 5.6, 150), ("RSD-190", 3.4, 6.4, 190), ("RSF-220", 4.0, 6.9, 220), ("RSC-260", 4.6, 7.4, 260)),
    (10.0, ("RSM-160", 2.5, 5.8, 160), ("RSD-205", 3.5, 6.5, 205), ("RSF-235", 4.1, 7.1, 235), ("RSC-280", 4.8, 7.7, 280)),
    (10.25, ("RSM-170", 2.5, 5.9, 170), ("RSD-215", 3.5, 6.6, 215), ("RSF-255", 4.2, 7.2, 255), ("RSC-300", 4.9, 7.9, 300)),
    (10.5, ("RSM-185", 2.6, 6.1, 185), ("RSD-230", 3.6, 6.8, 230), ("RSF-275", 4.3, 7.4, 275), ("RSC-325", 5.1, 8.2, 325)),
    (10.75, ("RSM-205", 2.6, 6.2, 205), ("RSD-245", 3.7, 7.0, 245), ("RSF-295", 4.4, 7.6, 295), ("RSC-350", 5.2, 8.3, 350)),
    (11.0, ("RSM-220", 2.7, 6.4, 220), ("RSD-265", 3.8, 7.1, 265), ("RSF-315", 4.5, 7.7, 315), ("RSC-380", 5.4, 8.6, 380)),
    (11.25, ("RSM-230", 2.7, 6.5, 230), ("RSD-285", 3.8, 7.2, 285), ("RSF-335", 4.6, 7.9, 335), ("RSC-410", 5.5, 8.7, 410)),
    (11.5, ("RSM-245", 2.8, 6.6, 245), ("RSD-300", 3.9, 7.4, 300), ("RSF-355", 4.7, 8.1, 355), ("RSC-440", 5.7, 9.0, 440)),
    (11.75, ("RSM-260", 2.8, 6.7, 260), ("RSD-320", 3.9, 7.5, 320), ("RSF-375", 4.8, 8.2, 375), ("RSC-475", 5.8, 9.2, 475)),
    (12.0, ("RSM-275", 2.9, 6.9, 275), ("RSD-340", 4.0, 7.7, 340), ("RSF-400", 4.9, 8.4, 400), ("RSC-510", 6.0, 9.5, 510)),
    (12.25, ("RSM-290", 2.9, 7.0, 290), ("RSD-360", 4.0, 7.8, 360), ("RSF-425", 5.0, 8.6, 425), ("RSC-550", 6.1, 9.6, 550)),
    (12.5, ("RSM-310", 3.0, 7.2, 310), ("RSD-380", 4.1, 7.9, 380), ("RSF-450", 5.1, 8.8, 450), ("RSC-590", 6.3, 9.9, 590)),
    (13.0, ("RSM-360", 3.1, 7.5, 360), ("RSD-425", 4.3, 8.3, 425), ("RSF-500", 5.3, 9.1, 500), ("RSC-650", 6.6, 10.3, 650)),
    (13.5, ("RSM-400", 3.2, 7.7, 400), ("RSD-475", 4.4, 8.5, 475), ("RSF-550", 5.5, 9.5, 550), ("RSC-725", 6.9, 10.8, 725)),
    (14.0, ("RSM-430", 3.3, 8.0, 430), ("RSD-525", 4.5, 8.8, 525), ("RSF-625", 5.7, 9.8, 625), ("RSC-825", 7.2, 11.2, 825)),
    (14.5, ("RSM-475", 3.4, 8.3, 475), ("RSD-575", 4.6, 9.1, 575), ("RSF-700", 5.9, 10.2, 700), ("RSC-925", 7.5, 11.7, 925)),
]

PERFILES_MOTIVA = ["Mini", "Demi", "Full", "Corsé"]


def fila(**kw):
    base = {c: "" for c in CABECERAS}
    base.update(kw)
    return base


def generar():
    filas = []

    # Silimed. El catálogo aportado no indicaba ni línea ni superficie.
    for ref, vol, alt, bas, proy, arco in SILIMED:
        sufijo = ref.split()[-1]
        filas.append(fila(
            marca="Silimed", linea="Redondos", referencia=ref,
            forma="redonda", superficie="sin especificar", superficie_marca="",
            perfil_marca=PERFIL_SILIMED[sufijo],
            volumen_cc=vol, base_cm=bas, altura_cm=alt,
            proyeccion_cm=proy, arco_cm=arco,
            catalogo=SIN_CATALOGO,
            notas="Superficie y línea sin especificar en el origen",
        ))

    # Mentor. Redondas: altura = diámetro. El catálogo no da arco.
    mentor = [
        (MENTOR_TMPX, "Moderado Plus", "texturizada", "SILTEX"),
        (MENTOR_THPX, "Alto", "texturizada", "SILTEX"),
        (MENTOR_SMPX, "Moderado Plus", "lisa", "Liso"),
    ]
    for tabla, perfil, superficie, superficie_marca in mentor:
        for vol, diam, proy, ref in tabla:
            filas.append(fila(
                marca="Mentor", linea="MemoryGel Xtra", referencia=ref,
                forma="redonda", superficie=superficie,
                superficie_marca=superficie_marca,
                perfil_marca=f"Perfil {perfil}",
                volumen_cc=vol, base_cm=diam, altura_cm=diam,
                proyeccion_cm=proy, arco_cm="",
                catalogo=SIN_CATALOGO,
                notas="El catálogo de redondos no publica arco vertical",
            ))

    # Motiva. SilkSurface se normaliza como lisa; el término literal se
    # conserva en superficie_marca. PENDIENTE DE CONFIRMAR (ver README).
    for base_cm, *grupos in MOTIVA:
        for perfil, (ref, proy, arco, vol) in zip(PERFILES_MOTIVA, grupos):
            filas.append(fila(
                marca="Motiva", linea="Round SilkSurface", referencia=ref,
                forma="redonda", superficie="lisa", superficie_marca="SilkSurface",
                perfil_marca=perfil,
                volumen_cc=vol, base_cm=base_cm, altura_cm=base_cm,
                proyeccion_cm=proy, arco_cm=arco,
                catalogo=SIN_CATALOGO,
                notas="Clasificación de SilkSurface como lisa, pendiente de confirmar",
            ))

    return filas


def main():
    filas = generar()
    with SALIDA.open("w", encoding="utf-8", newline="") as fh:
        escritor = csv.DictWriter(fh, fieldnames=CABECERAS)
        escritor.writeheader()
        escritor.writerows(filas)

    por_marca = {}
    for f in filas:
        por_marca[f["marca"]] = por_marca.get(f["marca"], 0) + 1
    print(f"Escritas {len(filas)} filas en {SALIDA.name}")
    for marca, n in sorted(por_marca.items()):
        print(f"  {marca}: {n}")


if __name__ == "__main__":
    main()
