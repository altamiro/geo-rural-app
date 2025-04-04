<template lang="pug">
  .sidebar-container
    .sidebar-header
      h3.sidebar-title {{ title }}
      .sidebar-controls
        el-button(type="text" icon="el-icon-close" @click="$emit('close')" v-if="closable")

    .sidebar-content
      slot
</template>

<script>
/**
 * Componente contêiner para a barra lateral.
 * Serve como uma estrutura para organizar elementos da barra lateral
 * como lista de camadas, detalhes e painel de validação.
 */
export default {
  name: 'SidebarContainer',
  props: {
    /**
     * Título da barra lateral
     */
    title: {
      type: String,
      default: 'Painel Lateral'
    },
    /**
     * Se o painel pode ser fechado
     */
    closable: {
      type: Boolean,
      default: false
    },
    /**
     * Largura do painel
     */
    width: {
      type: [Number, String],
      default: 320
    }
  },
  computed: {
    /**
     * Estilo computado com a largura
     */
    containerStyle() {
      const widthValue = typeof this.width === 'number'
        ? `${this.width}px`
        : this.width;

      return {
        width: widthValue
      };
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: $shadow-base;
  background-color: white;
}

.sidebar-header {
  padding: $spacing-medium;
  border-bottom: 1px solid $border-color-lighter;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .sidebar-title {
    font-size: $font-size-medium;
    font-weight: bold;
    margin: 0;
    color: $text-primary;
  }
}

.sidebar-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: $spacing-medium;
}
</style>
