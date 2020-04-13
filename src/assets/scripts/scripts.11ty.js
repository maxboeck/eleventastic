const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const MemoryFileSystem = require('memory-fs')

const isProd = process.env.ELEVENTY_ENV === 'production'
const mfs = new MemoryFileSystem()

// main entry point name
const fileName = 'main.js'

module.exports = class {
    // Configure Webpack in Here
    async data() {
        const filePath = path.join(__dirname, `/${fileName}`)

        // Transform .js files, run through Babel
        const js = {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }

        // Main Config
        const webpackConfig = {
            mode: isProd ? 'production' : 'development',
            entry: filePath,
            output: {
                path: path.resolve(__dirname, '../../memory-fs/js/')
            },
            module: {
                rules: [js]
            }
        }

        return {
            permalink: `/assets/scripts/${fileName}`,
            eleventyExcludeFromCollections: true,
            webpackConfig
        }
    }

    // Compile JS with Webpack, write the result to Memory Filesystem.
    // this brilliant idea is taken from Mike Riethmuller / Supermaya
    // @see https://github.com/MadeByMike/supermaya/blob/master/site/utils/compile-webpack.js
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

    // render the JS file
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
