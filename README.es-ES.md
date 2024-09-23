# ReactFlux

Lea este texto en otros idiomas: [English](README.md), [简体中文](README.zh-CN.md)

## Descripción general

ReactFlux es una interfaz web de terceros para [Miniflux](https://github.com/miniflux/miniflux), cuyo objetivo es proporcionar una experiencia de lectura más fácil de usar.

Las funcionalidades clave incluyen:

- Diseño de interfaz moderna
- Diseño adaptable a todos los dispositivos (responsivo)
- Admite modo oscuro y temas personalizados
- Búsqueda de artículos con una sintaxis similar a Google
- Gestión de feed y de grupos de feeds
- Atajos de teclado
- Marca automáticamente los artículos como leidos al desplazarlos al hacer scroll
- Actualización por lotes del host de URL de suscripción filtradas (útil para reemplazar instancias de RSSHub)
- Elimina artículos duplicados por hash, título o URL al cargar la lista
- De-duplicate articles by hash, title, or URL when loading the list
- Disponible en varios idiomasç (incluye: Inglés / Español / 简体中文)
- Guardar artículo en servicios de terceros
- Otras características esperando que las descubras...

## Capturas de pantalla

![Inicio de sesión](images/login.png)
![Interfaz](images/layout.png)
![Ajustes](images/settings.png)

## Demo

[Instancia de demostración en línea](https://reactflux.pages.dev/login)

## Despliegue

### Páginas de Cloudflare

ReactFlux está construido con React y genera un conjunto de archivos web estáticos después de la compilación, que se pueden implementar directamente en Cloudflare Pages.

Puede desplegarla en páginas Cloudflare por sí mismo seleccionando `Framework preset` como `Create React App`.

### Vercel

[![Desplegar en Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Zeabur

[![Desplegar en Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W)

### Docker

```bash
docker run -p 2000:2000 electh/reactflux
```

## Configuración

Necesita una instancia de Miniflux funcional para utilizar este proyecto, y admite los siguientes dos métodos de inicio de sesión:

1. Inicio de sesión utilizando el nombre de usuario y contraseña de la instancia (no recomendado);
2. Inicio de sesión utilizando un token de Miniflux, que puede ser generado en “Configuración > Claves API > Crear una nueva clave API”.

## Ramas

- Rama `main`: Proporciona las funciones más completas. Las nuevas funciones generalmente se lanzan primero en esta rama, adecuadas para la mayoría de los usuarios.
- Rama `next`: Creado inicialmente para mejorar la compatibilidad con dispositivos móviles, ofreciendo una mejor experiencia y rendimiento para dispositivos móviles y al mismo tiempo siendo compatible con dispositivos de escritorio. Esta rama actualmente carece de funciones como atajos de teclado y migrará selectivamente funciones desde la rama `main`.
- Rama `gh-pages`: Utilizada para compilar y desplegar la rama `main` en el servicio de páginas de GitHub.

Si quiere experimentar rápidamente la rama `next`, esta es una [instancia en línea](https://arcoflux.pages.dev/login).

## Colaboradores

> ¡Gracias a todos los colaboradores que han hecho posible este proyecto!

<table>
<tr>
    <td align="center">
        <a href="https://github.com/NekoAria">
            <img src="https://avatars.githubusercontent.com/u/23137034?v=4" width="90" alt="NekoAria" style="border-radius: 4px"/>
        </a>
        <br />
        <sub><b>NekoAria</b></sub>
        <br />
        <sub><b> Colaborador principal </b></sub>
    </td>
    <td align="center">
        <a href="https://github.com/electh">
            <img src="https://avatars.githubusercontent.com/u/83588235?v=4" width="90" alt="electh" style="border-radius: 4px"/>
        </a>
        <br />
        <sub><b>electh</b></sub>
        <br />
        <sub><b> Creador del proyecto </b></sub>
    </td>
</tr>
</table>

## historial de estrellas en GitHub

[![Historial de estrellas](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
```
