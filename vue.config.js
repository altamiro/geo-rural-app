const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import "@/assets/styles/variables.scss";
        `
      }
    }
  },
  configureWebpack: {
    performance: {
      hints: false, // Desativar avisos de performance
      maxEntrypointSize: 1024000, // Aumentar tamanho limite para entrypoints
      maxAssetSize: 1024000 // Aumentar tamanho limite para assets
    },
    optimization: {
      splitChunks: {
        chunks: 'all', // Melhorar divisão de chunks
        minSize: 20000,
        maxSize: 250000
      }
    }
  },
  chainWebpack: config => {
    // Add pug loader
    config.module
      .rule('pug')
      .test(/\.pug$/)
      .use('pug-plain-loader')
      .loader('pug-plain-loader')
      .end()

    // Add image loader
    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 10000,
        name: 'img/[name].[hash:8].[ext]'
      })
  }
})
