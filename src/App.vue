<template lang="pug">
  #app(v-cloak)
    el-container
      el-header
        app-header
      el-container
        el-main
          geo-view
    el-footer
      app-footer
</template>

<script>
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import GeoView from './views/GeoView.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter,
    GeoView
  },
  data() {
    return {
      isLoading: true
    }
  },
  mounted() {
    // Abordagem simplificada que não depende de funções inexistentes
    this.checkAppReady();
  },
  methods: {
    checkAppReady() {
      // Verificar se os estilos estão carregados
      const styleSheets = document.styleSheets;
      let stylesLoaded = false;

      // Verificar se pelo menos algumas folhas de estilo foram carregadas
      if (styleSheets && styleSheets.length > 0) {
        stylesLoaded = true;
      }

      // Verificar se o elemento UI está pronto
      const appElement = document.getElementById('app');
      const isAppReady = appElement && stylesLoaded;

      if (isAppReady) {
        this.isLoading = false;
      } else {
        // Tentar novamente em um curto período
        setTimeout(() => this.checkAppReady(), 100);
      }
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-container {
  height: 100%;
}

.el-header {
  padding: 0;
  height: auto !important;
}

.el-main {
  padding: 0;
  height: calc(100vh - 60px);
}

.el-footer {
  padding: 0;
  height: auto !important;
}
</style>
