const fs = require('fs')
const path = require('path')
const util = require('util')
const glob = require('glob')
const File = require('vinyl')
const SVGSpriter = require('svg-sprite')

module.exports = async () => {
    const cwd = path.resolve('src/assets/icons')
    const config = {
        mode: {
            inline: true,
            symbol: {
                sprite: 'sprite.svg',
                example: false
            }
        },
        shape: {
            transform: ['svgo'],
            id: {
                generator: 'icon-%s'
            }
        },
        svg: {
            xmlDeclaration: false,
            doctypeDeclaration: false
        }
    }
    const spriter = new SVGSpriter(config)
    const getFiles = util.promisify(glob)

    const compileSprite = async (args) => {
        return new Promise((resolve, reject) => {
            spriter.compile(args, (error, result) => {
                if (error) {
                    return reject(error)
                }
                resolve(result.symbol.sprite)
            })
        })
    }

    const files = await getFiles('**/*.svg', { cwd: cwd })
    files.forEach(function (file) {
        spriter.add(
            new File({
                path: path.join(cwd, file),
                base: cwd,
                contents: fs.readFileSync(path.join(cwd, file))
            })
        )
    })

    const sprite = await compileSprite(config.mode)
    const spriteContent = sprite.contents.toString('utf8')

    return spriteContent
}
