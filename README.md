# Proyectos de hobby

Repo personal para trastear con ideas sueltas, sobre todo desde
[Claude Code en remoto](https://code.claude.com/docs/en/claude-code-on-the-web).

No hay nada sagrado aquí: es un cajón de sastre. Si un experimento crece lo
suficiente, se saca a su propio repo.

## Cómo está organizado

Cada experimento vive en su propia carpeta dentro de `proyectos/`, con su
propio README explicando qué es y cómo se ejecuta:

```
proyectos/
  <nombre-del-experimento>/
    README.md
    ...
```

De momento está vacío. Empieza pidiéndole a Claude algo como:

> Crea un proyecto nuevo en `proyectos/` que haga X

## Trabajando desde Claude Code remoto

Las sesiones remotas corren en un contenedor efímero: lo que no se commitea y
se sube, se pierde cuando la sesión termina. Al acabar algo que quieras
conservar, pide que se haga commit y push.

Contexto adicional para Claude en [`CLAUDE.md`](CLAUDE.md).
