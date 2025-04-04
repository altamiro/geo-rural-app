<template lang="pug">
  .layer-list
    .layer-list-header
      h4 Camadas Vetorizadas
      el-button(type="text" icon="el-icon-refresh" @click="$emit('refresh')" title="Atualizar lista")

    .empty-list(v-if="layers.length === 0")
      i.el-icon-data-analysis
      p Nenhuma camada vetorizada.
      p Selecione um tipo de camada e desenhe no mapa.

    .list-container(v-else)
      .layer-item(
        v-for="layer in layers"
        :key="layer.id"
        :class="{ active: selectedLayerId === layer.id }"
        @click="selectLayer(layer.id)"
      )
        .layer-color(:style="{ backgroundColor: getLayerColor(layer.id) }")
        .layer-info
          .layer-name {{ layer.name }}
          .layer-meta
            span.layer-type {{ getLayerTypeName(layer.id) }}
            span.layer-area {{ formatArea(layer.area) }} ha
        .layer-actions
          el-switch(
            v-model="layerVisibility[layer.id]"
            active-color="#13ce66"
            inactive-color="#ff4949"
            @change="toggleVisibility(layer.id, $event)"
          )
          el-dropdown(@command="handleCommand($event, layer.id)")
            span.el-dropdown-link
              i.el-icon-more
            el-dropdown-menu(slot="dropdown")
              el-dropdown-item(command="zoom") Zoom para camada
              el-dropdown-item(command="edit") Editar camada
              el-dropdown-item(command="delete" divided) Excluir camada
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { formatArea } from '@/utils/geometry'
import { LAYER_TYPES } from '@/utils/constants'

export default {
  name: 'LayerList',
  props: {
    /**
     * ID da camada selecionada
     */
    selectedLayerId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      layerVisibility: {},
      layerTypeNames: {
        [LAYER_TYPES.PROPERTY]: 'Imóvel',
        [LAYER_TYPES.HEADQUARTERS]: 'Sede',
        [LAYER_TYPES.CONSOLIDATED]: 'Consolidada',
        [LAYER_TYPES.NATIVE]: 'Vegetação Nativa',
        [LAYER_TYPES.FALLOW]: 'Pousio',
        [LAYER_TYPES.ROADWAY]: 'Rodovia',
        [LAYER_TYPES.RAILWAY]: 'Ferrovia',
        [LAYER_TYPES.POWERLINE]: 'Linha de Transmissão',
        [LAYER_TYPES.PPA]: 'APP',
        [LAYER_TYPES.RESTRICTED]: 'Uso Restrito',
        [LAYER_TYPES.RESERVE]: 'Reserva Legal'
      }
    }
  },
  computed: {
    ...mapState({
      layers: state => state.layers.activeLayers
    }),
    ...mapGetters({
      getLayerSymbology: 'layers/getLayerSymbology',
      isLayerVisible: 'layers/isLayerVisible'
    })
  },
  methods: {
    ...mapActions({
      deleteLayer: 'layers/deleteLayer',
      toggleLayerVisibility: 'layers/toggleLayerVisibility',
      zoomToLayer: 'map/zoomToGeometry'
    }),
    formatArea,
    selectLayer(layerId) {
      this.$emit('select-layer', layerId)
    },
    getLayerColor(layerId) {
      const symbology = this.getLayerSymbology(layerId)
      const color = symbology.color
      return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`
    },
    getLayerTypeName(layerId) {
      return this.layerTypeNames[layerId] || layerId
    },
    toggleVisibility(layerId, visible) {
      this.toggleLayerVisibility({ id: layerId, visible })
      this.$emit('visibility-changed', { id: layerId, visible })
    },
    handleCommand(command, layerId) {
      switch (command) {
        case 'zoom':
          this.$emit('zoom-to-layer', layerId)
          break

        case 'edit':
          this.$emit('edit-layer', layerId)
          break

        case 'delete':
          this.$confirm('Tem certeza que deseja excluir esta camada?', 'Confirmação', {
            confirmButtonText: 'Sim',
            cancelButtonText: 'Não',
            type: 'warning'
          }).then(() => {
            this.deleteLayer(layerId)
            this.$emit('layer-deleted', layerId)
          }).catch(() => {
            // Cancelado pelo usuário
          })
          break
      }
    }
  },
  created() {
    // Inicializar estado de visibilidade das camadas
    this.layers.forEach(layer => {
      this.layerVisibility[layer.id] = this.isLayerVisible(layer.id)
    })
  },
  watch: {
    // Atualizar estado de visibilidade quando novas camadas forem adicionadas
    layers: {
      handler(newLayers) {
        newLayers.forEach(layer => {
          if (this.layerVisibility[layer.id] === undefined) {
            this.$set(this.layerVisibility, layer.id, this.isLayerVisible(layer.id))
          }
        })
      },
      deep: true
    }
  }
}
</script>

<style lang="scss" scoped>
.layer-list {
  width: 100%;
}

.layer-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-medium;

  h4 {
    font-size: $font-size-base;
    font-weight: bold;
    margin: 0;
    color: $text-primary;
  }
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-large;
  color: $text-secondary;
  text-align: center;

  i {
    font-size: 48px;
    margin-bottom: $spacing-medium;
    color: $border-color-light;
  }

  p {
    margin: $spacing-mini 0;
  }
}

.list-container {
  .layer-item {
    display: flex;
    align-items: center;
    padding: $spacing-small;
    border-radius: $border-radius-base;
    margin-bottom: $spacing-small;
    border: 1px solid $border-color-lighter;
    transition: $transition-base;
    cursor: pointer;

    &:hover {
      background-color: $background-color-base;
    }

    &.active {
      background-color: #ecf5ff;
      border-color: $primary-color;
    }

    .layer-color {
      width: 20px;
      height: 20px;
      margin-right: $spacing-small;
      border-radius: $border-radius-small;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .layer-info {
      flex: 1;

      .layer-name {
        font-weight: bold;
        color: $text-primary;
      }

      .layer-meta {
        display: flex;
        font-size: $font-size-mini;
        color: $text-secondary;

        .layer-type {
          margin-right: $spacing-small;
        }

        .layer-area {
          font-weight: 500;
        }
      }
    }

    .layer-actions {
      display: flex;
      align-items: center;

      .el-dropdown-link {
        cursor: pointer;
        color: $text-secondary;
        padding: $spacing-mini;
        margin-left: $spacing-small;

        &:hover {
          color: $primary-color;
        }
      }
    }
  }
}
</style>
