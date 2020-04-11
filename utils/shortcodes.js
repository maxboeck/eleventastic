module.exports = {
    icon: function (name) {
        return `<svg class="icon icon--${name}" role="img" aria-hidden="true" width="24" height="24">
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-${name}"></use>
                </svg>`
    }
}
