const Image = require("@11ty/eleventy-img");

module.exports = {
    image: async function imageShortcode(src, alt, sizes, width) {
        src = "./src/assets/images/" + src;
        let metadata = await Image(src, {
          widths: width?[width] : [300, 600],
          formats: ["avif", "jpeg"],
          outputDir: "./dist/assets/images/",
          urlPath: "/assets/images/"
        });
      
        let imageAttributes = {
          alt,
          sizes,
          loading: "lazy",
          decoding: "async",
        };
      
        // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
        return Image.generateHTML(metadata, imageAttributes);
    },
    icon: async function (name) {
        return `<svg class="icon icon--${name}" role="img" aria-hidden="true" width="24" height="24">
                    <use xlink:href="#icon-${name}"></use>
                </svg>`
    }
}
