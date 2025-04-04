<template lang="pug">
  #app
    el-container
      el-header
        app-header
      el-container
        el-main
          router-view
    el-footer
      app-footer
</template>

<script>
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter
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
