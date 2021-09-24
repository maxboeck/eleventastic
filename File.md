Fantástico
Un simple kit de inicio de Eleventy, mi base para todos los nuevos proyectos de 11ty. ( Sitio de demostración )

Estado de Netlify

Características
Canalización de CSS (Sass, CleanCSS)
Paquete JS (paquete web)
Generación de Sprite de icono SVG
CSS crítico
Minificación HTML
Sin compilaciones externas, todo se ejecuta a través de 11ty
Empezando
Para instalar los paquetes necesarios, ejecute este comando en la carpeta raíz del sitio:

npm install
Comandos
Ejecutar npm startpara un servidor de desarrollo y recarga en vivo
Ejecutar npm run buildpara generar una compilación de producción
Implementar una bifurcación de esta plantilla en Netlify
Implementar en Netlify

CSS
El estilo funciona con Sass. El archivo de índice principal está en formato src/assets/styles/main.scss. Importe allí cualquier código SCSS que desee; será procesado y optimizado. La salida está endist/assets/styles/main.css

JS
Javascript se puede escribir en sintaxis ES6. El archivo de índice principal está en formato src/assets/scripts/main.js. Se trasladará a ES5 con babel, se incluirá junto con el paquete web y se minificará en producción. La salida está endist/assets/scripts/main.js

Iconos SVG
Todos los archivos SVG agregados se src/assets/iconsincluirán en un symbolarchivo de sprite. El nombre del archivo SVG se utilizará como identificador de símbolo y el icono se puede utilizar como código abreviado.

Por ejemplo, si tiene un github.svgarchivo en esa carpeta, puede mostrarlo en cualquier lugar usando {% icon "github" %}sus plantillas.

CSS crítico
Actualmente, el CSS crítico solo se incluirá en el encabezado de la página de inicio. Esto se hace usando el paquete crítico en una transformación automática.

Créditos
Mi más sincero agradecimiento a estas personas, de quienes copié descaradamente ideas:

Phil Hawksworth: Onceavo.
Mike Riethmuller : Supermaya
Zach Leatherman: zachleat.com
