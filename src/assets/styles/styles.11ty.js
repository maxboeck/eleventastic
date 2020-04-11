const fs = require('fs')
const path = require('path')
const sass = require('node-sass')
const CleanCSS = require('clean-css')
const cssesc = require('cssesc')

const fileName = 'main.scss'
const isProd = process.env.ELEVENTY_ENV === 'production'

module.exports = class {
    async data() {
        const filePath = path.join(__dirname, `/${fileName}`)
        return {
            permalink: `/assets/styles/main.css`,
            filePath
        }
    }

    async compile(config) {
        return new Promise((resolve, reject) => {
            if (!isProd) {
                config.sourceMap = true
                config.sourceMapEmbed = true
                config.outputStyle = 'expanded'
            }
            return sass.render(config, (err, result) => {
                if (err) {
                    return reject(err)
                }
                resolve(result.css.toString())
            })
        })
    }

    async minify(css) {
        return new Promise((resolve, reject) => {
            if (!isProd) {
                resolve(css)
            }
            const minified = new CleanCSS().minify(css)
            if (!minified.styles) {
                return reject(minified.error)
            }
            resolve(minified.styles)
        })
    }

    renderError(error) {
        return `
        /* Error compiling stylesheet */
        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }
        html,
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            font-family: monospace;
            font-size: 1.25rem;
            line-height:1.5;
        } 
        body::before { 
            content: ''; 
            background: #000;
            top: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            opacity: 0.7;
            position: fixed;
        }
        body::after { 
            content: '${cssesc(error)}'; 
            white-space: pre;
            display: block;
            top: 0; 
            padding: 30px;
            margin: 50px;
            width: calc(100% - 100px);
            color:#721c24;
            background: #f8d7da;
            border: solid 2px red;
            position: fixed;
        }`
    }

    async render({ filePath }) {
        try {
            const css = await this.compile({ file: filePath })
            const minified = await this.minify(css)
            return minified
        } catch (err) {
            if (isProd) {
                throw new Error(err)
            } else {
                console.error(err)
                const msg = err.formatted || err.message
                return this.renderError(msg)
            }
        }
    }
}
