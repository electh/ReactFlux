# ReactFlux

Lea este texto en otros idiomas: [Deutsch](README.de-DE.md), [English](../README.md), [Français](README.fr-FR.md), [简体中文](README.zh-CN.md)

## Descripción general

ReactFlux es una interfaz web de terceros para [Miniflux](https://github.com/miniflux/v2), cuyo objetivo es proporcionar una experiencia de lectura más fácil de usar.

Versiones de Miniflux compatibles: 2.1.4 y superiores.

Las funcionalidades clave incluyen:

- Diseño de interfaz moderna
- Diseño adaptable a todos los dispositivos (responsivo), soporte de gestos táctiles
- Admite modo oscuro y temas personalizados
- Experiencia de lectura personalizable:
  - Configuración de familia y tamaño de fuente
  - Ajuste del ancho del artículo
  - Opciones de alineación del título
  - Visor de imágenes con zoom y presentación
  - Mejora de notas al pie
  - Resaltado de sintaxis para código
  - Tiempo estimado de lectura
- Gestión de artículos y feeds:
  - Búsqueda con sintaxis similar a Google
  - Filtrar artículos por estado de lectura, fecha de publicación, título, contenido o autor
  - Operaciones por lotes para feeds
  - Soporte de recuperación de texto completo
  - Elimina artículos duplicados por hash, título o URL
  - Marca automáticamente los artículos como leídos al desplazarlos
- Características avanzadas:
  - Atajos de teclado (personalizables)
  - Actualización por lotes del host de URL de suscripción filtradas (útil para reemplazar instancias de RSSHub)
  - Actualización por lotes de suscripciones con errores
  - Guardar artículos en servicios de terceros
- Disponible en varios idiomas (Deutsch / English / Español / Français / 简体中文)
- Otras características esperando que las descubras...

## Demostración en línea y capturas de pantalla

Pruebe ReactFlux con nuestra [instancia de demostración en línea](https://reactflux.pages.dev).

Vea cómo se ve ReactFlux en diferentes temas:

![screenshot](../images/screenshot.png)
![devices](../images/devices.png)

## Inicio Rápido

1. Asegúrese de tener una instancia funcional de Miniflux
2. Use directamente nuestra [instancia de demostración en línea](https://reactflux.pages.dev) o despliegue ReactFlux utilizando uno de los métodos a continuación
3. Inicie sesión usando su nombre de usuario y contraseña de Miniflux o la clave API (recomendado)

## Despliegue

### Páginas de Cloudflare

ReactFlux está construido con React y genera un conjunto de archivos web estáticos después de la compilación, que se pueden implementar directamente en Cloudflare Pages.

Puede desplegarlo en Cloudflare Pages seleccionando `Framework preset` como `Create React App`.

### Usando archivos preconstruidos

Puede descargar los archivos preconstruidos de la rama `gh-pages` y desplegarlos en cualquier servicio de alojamiento estático que soporte aplicaciones de una sola página (SPA).

Asegúrese de configurar la reescritura de URL para redirigir todas las solicitudes a `index.html`.

Si está desplegando usando Nginx, es posible que necesite agregar la siguiente configuración:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

O usando Caddy, es posible que necesite agregar la siguiente configuración:

```caddyfile
try_files {path} {path}/ /index.html
```

### Vercel

[![Desplegar en Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Docker

[![dockeri.co](https://dockerico.blankenship.io/image/electh/reactflux)](https://hub.docker.com/r/electh/reactflux)

```bash
docker run -p 2000:2000 electh/reactflux
```

O usando [Docker Compose](../docker-compose.yml):

```bash
docker-compose up -d
```

<!-- ### Zeabur (Desactualizado, no recomendado)

[![Desplegar en Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W) -->

## Guía de Traducción

Para ayudarnos a traducir ReactFlux a su idioma, por favor contribuya a la carpeta `locales` y envíe una solicitud de extracción.

Además, necesita agregar un archivo README para el idioma respectivo y referenciarlo en todos los archivos README existentes.

También debe modificar partes del código fuente para incluir los paquetes de idiomas i18n para `Arco Design` y `Day.js`.

Para cambios detallados, por favor consulte las modificaciones en [PR #145](https://github.com/electh/ReactFlux/pull/145).

### Traductores Actuales

| Idioma   | Traductor                                       |
| -------- | ----------------------------------------------- |
| Deutsch  | [DonkeeeyKong](https://github.com/donkeeeykong) |
| Español  | [Victorhck](https://github.com/victorhck)       |
| Français | [MickGe](https://github.com/MickGe)             |
| 简体中文 | [Neko Aria](https://github.com/NekoAria)        |

## Colaboradores

> ¡Gracias a todos los colaboradores que han hecho este proyecto más increíble!

<a href="https://github.com/electh/ReactFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=electh/ReactFlux" alt="Colaboradores de ReactFlux" />
</a>

Hecho con [contrib.rocks](https://contrib.rocks).

## Historial de estrellas en GitHub

[![Historial de estrellas](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
