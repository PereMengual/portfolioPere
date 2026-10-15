# Portfolio de Pere Mengual Roca

Web estática (HTML, CSS y JavaScript sin dependencias) publicada en
https://peremengual.github.io/portfolioPere/

## Estructura de la página

Menú lateral con foto, redes, secciones, CV y botón de tema. Después:

1. **Inicio:** simulación de agentes autónomos (boids, una técnica de IA para videojuegos)
   que se mueven en grupo, esquivan el texto, siguen al cursor y se dispersan con un clic.
2. **Premios 2026:** banda con los dos premios del TFG.
3. **Sobre mí:** foto con tu trayectoria (grado terminado y máster en curso), texto,
   datos personales y cifras (se calculan solas).
4. **Habilidades:** grupos de herramientas, competencias e idiomas.
5. **Proyectos:** filtros con recuento, el TFG destacado con una demo de DTW en directo,
   y tarjetas que se abren en grande al pulsarlas.
6. **Formación:** formación académica, cursos, premios y publicaciones, y experiencia.
7. **Servicios** y **Contacto** (copiar email y teléfono, redes y tarjeta de contacto).

## Tema claro y oscuro

La web sigue el tema del sistema hasta que el visitante pulsa el botón (en el menú
lateral o, en móvil, arriba a la derecha). La elección se guarda en el navegador.
Los colores de los dos temas están al principio de `assets/css/main.css`, en `:root`.

## Carpetas

```
index.html                       Todo el contenido de la página
assets/css/main.css              Estilos y colores de los dos temas
assets/js/main.js                Tema, menú, filtros, visor, cifras, agentes de la portada y demo DTW
assets/fonts/                    Tipografías Anybody e Instrument Sans (licencia SIL OFL)
assets/img/fotoPerfil.jpg        Foto (menú, Sobre mí, contacto y vista previa al compartir)
assets/img/proyectos/            Imágenes de los proyectos
assets/docs/CV-Pere-Mengual-Roca.pdf   CV que se descarga desde la web
assets/vendor/bootstrap-icons/   Iconos (https://icons.getbootstrap.com)
```

## Cambios habituales

- **Añadir un proyecto:** copia un bloque `<article class="card" ...>` de Proyectos.
  `data-category` decide el filtro (`desarrollo` o `diseno`); los números de los
  filtros y la cifra de «Sobre mí» se actualizan solos.
- **Poner capturas reales:** guárdalas en `assets/img/proyectos/` (proporción 16:10,
  por ejemplo 1600x1000) y cambia el `src` de la portada y `data-images`. En
  `data-images` puedes poner varias imágenes separadas por comas: el visor tendrá flechas.
- **Niveles de habilidad (opcional):** añade `data-nivel="1"` a `data-nivel="10"` a una
  herramienta, por ejemplo `<li data-nivel="8">Unity</li>`, y se dibujará una barra
  de nivel en ese grupo.
- **Roles de la portada:** atributo `data-roles` del elemento `.typed`, separados por `|`.
  En `data-icons` va el icono de cada rol, con el nombre de Bootstrap Icons
  (por ejemplo `controller`, `cpu` o `box`).
- **Agentes de la portada:** las constantes `SEP`, `VIEW`, `LINK` y `CHASE` al principio
  de `initHeroAgents` en `assets/js/main.js` cambian cómo se agrupan y persiguen al cursor.
- **Actualizar el CV:** reemplaza `assets/docs/CV-Pere-Mengual-Roca.pdf` con el mismo nombre.
- **LinkedIn:** cuando recuperes la cuenta, descomenta las líneas de LinkedIn en el menú
  lateral y en Contacto.

La edad y el año del pie de página se actualizan solos.
