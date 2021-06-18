const sass = require('node-sass');

const appendTemplate = function(content, selector){
    return `<template data-append="${selector}">${content}</template>`
}

module.exports = {
    styles: function(content){
        const renderSass = sass.renderSync({data: content});
        return appendTemplate(renderSass.css.toString(), 'style');
    },
    append: appendTemplate
}
