const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const MemoryFileSystem = require('memory-fs')

const fileName = 'main.js'
const isProd = process.env.ELEVENTY_ENV === 'production'
const mfs = new MemoryFileSystem()

module.exports = class {
    async data() {
        const rawFilepath = path.join(__dirname, `/${fileName}`)
        const jsRule = {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }
        const webpackConfig = {
            mode: isProd ? 'production' : 'development',
            entry: rawFilepath,
            output: {
                path: path.resolve(__dirname, '../../memory-fs/js/')
            },
            module: {
                rules: [jsRule]
            }
        }

        return {
            permalink: `/assets/scripts/${fileName}`,
            eleventyExcludeFromCollections: true,
            webpackConfig
        }
    }

    compile(webpackConfig) {
        const compiler = webpack(webpackConfig)
        compiler.outputFileSystem = mfs
        compiler.inputFileSystem = fs
        compiler.resolvers.normal.fileSystem = mfs

        return new Promise((resolve, reject) => {
            compiler.run((err, stats) => {
                if (err || stats.hasErrors()) {
                    const errors =
                        err ||
                        (stats.compilation ? stats.compilation.errors : null)

                    reject(errors)
                    return
                }

                const { assets } = stats.compilation
                const file = assets[fileName].source()

                resolve(file)
            })
        })
    }

    async render({ webpackConfig }) {
        try {
            const result = await this.compile(webpackConfig)
            return result
        } catch (err) {
            console.log(err)
            return null
        }
    }
}
