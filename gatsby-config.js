require("dotenv").config();

module.exports = {
    siteMetadata: {
        title: "ESK8CAD",
        description: "A collection of open source ESK8 CAD files.",
        image: "/favicon.ico",
        siteUrl: process.env.SITE_URL || `https://esk8cad.com`,
    },
    proxy: {
        prefix: "/api",
        url: "http://127.0.0.1:8788",
    },
    plugins: [
        "gatsby-plugin-image",
        "gatsby-plugin-sass",
        "gatsby-plugin-sharp",
        "gatsby-transformer-sharp",
        "gatsby-plugin-sitemap",
        "gatsby-plugin-robots-txt",
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                name: `images`,
                path: `${__dirname}/static/images`,
            },
        },
    ]
}
