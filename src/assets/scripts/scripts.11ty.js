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
            webpackConfig
        }
    }

    getWebpackFiles(compiler) {
        return new Promise((resolve, reject) => {
            compiler.outputFileSystem = mfs
            compiler.inputFileSystem = fs
            compiler.resolvers.normal.fileSystem = mfs

            compiler.run((err, stats) => {
                if (err || stats.hasErrors()) {
                    const errors =
                        err ||
                        (stats.compilation ? stats.compilation.errors : null)
                    console.log(errors)
                    reject(errors)
                    return
                }

                const { compilation } = stats
                const files = Object.keys(compilation.assets).reduce(
                    (acc, key) => {
                        acc[key] = compilation.assets[key].source()
                        return acc
                    },
                    {}
                )

                resolve(files)
            })
        })
    }

    async render({ webpackConfig }) {
        const compiler = webpack(webpackConfig)
        const result = await this.getWebpackFiles(compiler)
        return result[fileName]
    }
}
