# Contexto para Claude Code

Este es un repo personal de hobby: experimentos y proyectos pequeños sin
relación entre sí. No es código de producción y no hay usuarios externos.

## Convenciones

- Cada experimento va en su propia carpeta dentro de `proyectos/`, con un
  `README.md` que diga qué es, cómo se instala y cómo se ejecuta.
- Los proyectos son independientes: cada uno lleva sus propias dependencias
  (`package.json`, `requirements.txt`, `pyproject.toml`, lo que toque). No hay
  un gestor de dependencias compartido en la raíz.
- Elige el lenguaje y las herramientas que mejor encajen con cada experimento;
  no hay un stack impuesto.

## Tono del trabajo

- Prioriza que las cosas funcionen y sean fáciles de retomar meses después
  sobre la arquitectura elaborada.
- Tests solo donde aporten (lógica con casos límite reales); no hacen falta
  para un script de usar y tirar.
- Si un experimento se queda a medias, deja una nota en su README diciendo
  dónde se quedó.

## Notas de entorno

- El idioma de trabajo es el español.
- Las sesiones remotas usan un contenedor efímero: hay que commitear y hacer
  push de lo que valga la pena conservar antes de terminar.
