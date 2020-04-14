# Eleventastic

A simple Eleventy Starter Kit, my base for all new 11ty projects. ([Demo Site](https://eleventastic.netlify.com))

[![Netlify Status](https://api.netlify.com/api/v1/badges/f78ec52d-8328-4e40-b6da-a0f9164e80d1/deploy-status)](https://app.netlify.com/sites/eleventastic/deploys)

## Features

* CSS Pipeline (Sass, CleanCSS)
* JS Bundling (Webpack)
* SVG Icon Sprite Generation
* Critical CSS
* HTML Minification
* No external builds, everything runs through 11ty

## Getting Started

To install the necessary packages, run this command in the root folder of the site:

```
npm install
````

__Commands__  

* Run `npm start` for a development server and live reloading
* Run `npm run build` to generate a production build

Deploy a fork of this template to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/maxboeck/eleventastic) 

## CSS

Styling works with Sass. The main index file is in `src/assets/styles/main.scss`. Import any SCSS code you want in there; it will be processed and optimized. The output is in `dist/assets/styles/main.css`

## JS

Javascript can be written in ES6 syntax. The main index file is in `src/assets/scripts/main.js`. It will be transpiled to ES5 with babel, bundled together with webpack, and minified in production. The output is in `dist/assets/scripts/main.js`

## SVG Icons

All SVG files added to `src/assets/icons` will be bundled into a `symbol` sprite file. The SVG filename will then be used as the symbol identifier and the icon can be used as a shortcode.

For example, if you have a `github.svg` file in that folder, you can display it anywhere by using `{% icon "github" %}` in your templates.

## Critical CSS

Currently, ciritcal CSS will only be inlined in the head of the homepage. This is done by using the [critical](https://github.com/addyosmani/critical) package in an automatic transform.

## Credits

My heartfelt thanks to these people, whom I shamelessly copied ideas from:

* Phil Hawksworth: [EleventyOne](https://github.com/philhawksworth/eleventyone)
* Mike Riethmuller: [Supermaya](https://github.com/MadeByMike/supermaya) 
* Zach Leatherman: [zachleat.com](https://github.com/zachleat/zachleat.com)
