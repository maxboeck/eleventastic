const fs = require('fs')
const path = require('path')
const postcss = require('postcss')

const fileName = 'main.css'

module.exports = class {
    async data() {
        const rawFilepath = path.join(__dirname, `/${fileName}`)
        return {
            permalink: `/assets/styles/${fileName}`,
            rawFilepath,
            rawCss: await fs.readFileSync(rawFilepath)
        }
    }

    async render({ rawCss, rawFilepath }) {
        return await postcss([
            require('precss'),
            require('postcss-import'),
            require('postcss-mixins'),
            require('cssnano')
        ])
            .process(rawCss, { from: rawFilepath })
            .then((result) => result.css)
    }
}
