const htmlmin = require('html-minifier')
const critical = require('critical')
const buildDir = 'dist'
const {JSDOM} = require('jsdom')

const shouldTransformHTML = (outputPath) =>
    outputPath &&
    outputPath.endsWith('.html') &&
    process.env.ELEVENTY_ENV === 'production'

const isHomePage = (outputPath) => outputPath === `${buildDir}/index.html`

process.setMaxListeners(Infinity)
module.exports = {

    appender: function (html, outputPath) {
        if(!outputPath || !outputPath.endsWith('.html'))
            return html
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const appendTemplates = document.querySelectorAll('[data-append]');
        appendTemplates.forEach((element) => {
            const selector = element.getAttribute('data-append');

            switch (selector){
                case 'style':
                    const styleElem = document.createElement('style')
                    styleElem.innerHTML = element.innerHTML
                    document.head.appendChild(styleElem)
                    break
                default:
                    document.querySelector(selector).innerHTML += element.innerHTML;
            }

            element.parentNode.removeChild(element);
        });
    
        return dom.serialize()
    },

    htmlmin: function (content, outputPath) {
        if (shouldTransformHTML(outputPath)) {
            return htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true
            })
        }
        return content
    },

    critical: async function (content, outputPath) {
        if (shouldTransformHTML(outputPath) && isHomePage(outputPath)) {
            try {
                const config = {
                    base: `${buildDir}/`,
                    html: content,
                    inline: true,
                    width: 1280,
                    height: 800
                }
                const { html } = await critical.generate(config)
                return html
            } catch (err) {
                console.error(err)
            }
        }
        return content
    }
}
