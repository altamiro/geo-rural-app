<template lang="pug">
  .layer-selector
    .layer-panel
      h3.panel-title Seleção de Camadas

      .layer-categories
        .category
          h4.category-title Imóvel
          .layers
            .layer-item(
              v-for="layer in propertyLayers"
              :key="layer.id"
              @click="selectLayer(layer)"
              :class="{ active: selectedLayerId === layer.id, disabled: !canSelectLayer(layer) }"
            )
              .layer-icon
                i(:class="layer.icon")
              .layer-info
                .layer-name {{ layer.name }}
                .layer-description {{ layer.description }}

        .category
          h4.category-title Cobertura do Solo
          .layers
            .layer-item(
              v-for="layer in soilCoverageLayers"
              :key="layer.id"
              @click="selectLayer(layer)"
              :class="{ active: selectedLayerId === layer.id, disabled: !canSelectLayer(layer) }"
            )
              .layer-icon
                i(:class="layer.icon")
              .layer-info
                .layer-name {{ layer.name }}
                .layer-description {{ layer.description }}

        .category
          h4.category-title Servidão Administrativa
          .layers
            .layer-item(
              v-for="layer in administrativeServiceLayers"
              :key="layer.id"
              @click="selectLayer(layer)"
              :class="{ active: selectedLayerId === layer.id, disabled: !canSelectLayer(layer) }"
            )
              .layer-icon
                i(:class="layer.icon")
              .layer-info
                .layer-name {{ layer.name }}
                .layer-description {{ layer.description }}

        .category
          h4.category-title APP / Uso Restrito
          .layers
            .layer-item(
              v-for="layer in restrictedUseLayers"
              :key="layer.id"
              @click="selectLayer(layer)"
              :class="{ active: selectedLayerId === layer.id, disabled: !canSelectLayer(layer) }"
            )
              .layer-icon
                i(:class="layer.icon")
              .layer-info
                .layer-name {{ layer.name }}
                .layer-description {{ layer.description }}

        .category
          h4.category-title Reserva Legal
          .layers
            .layer-item(
              v-for="layer in legalReserveLayers"
              :key="layer.id"
              @click="selectLayer(layer)"
              :class="{ active: selectedLayerId === layer.id, disabled: !canSelectLayer(layer) }"
            )
              .layer-icon
                i(:class="layer.icon")
              .layer-info
                .layer-name {{ layer.name }}
                .layer-description {{ layer.description }}
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'LayerSelector',
  data() {
    return {
      selectedLayerId: null,
      propertyLayers: [
        {
          id: 'property',
          name: 'Área do Imóvel',
          description: 'Desenhe o perímetro do imóvel',
          icon: 'el-icon-s-home'
        },
        {
          id: 'headquarters',
          name: 'Sede do Imóvel',
          description: 'Marque a sede ou construção principal',
          icon: 'el-icon-location'
        }
      ],
      soilCoverageLayers: [
        {
          id: 'consolidated',
          name: 'Área Consolidada',
          description: 'Áreas já utilizadas para atividades rurais',
          icon: 'el-icon-s-grid'
        },
        {
          id: 'native',
          name: 'Vegetação Nativa',
          description: 'Remanescentes de vegetação nativa',
          icon: 'el-icon-sunny'
        },
        {
          id: 'fallow',
          name: 'Área de Pousio',
          description: 'Áreas temporariamente não cultivadas',
          icon: 'el-icon-time'
        }
      ],
      administrativeServiceLayers: [
        {
          id: 'roadway',
          name: 'Rodovia',
          description: 'Áreas de servidão para rodovias',
          icon: 'el-icon-s-promotion'
        },
        {
          id: 'railway',
          name: 'Ferrovia',
          description: 'Áreas de servidão para ferrovias',
          icon: 'el-icon-s-cooperation'
        },
        {
          id: 'powerline',
          name: 'Linha de Transmissão',
          description: 'Áreas de servidão para linhas de energia',
          icon: 'el-icon-s-opportunity'
        }
      ],
      restrictedUseLayers: [
        {
          id: 'ppa',
          name: 'Área de Preservação Permanente',
          description: 'Áreas protegidas por lei',
          icon: 'el-icon-s-flag'
        },
        {
          id: 'restricted',
          name: 'Uso Restrito',
          description: 'Áreas com restrições específicas de uso',
          icon: 'el-icon-warning'
        }
      ],
      legalReserveLayers: [
        {
          id: 'reserve',
          name: 'Reserva Legal',
          description: 'Áreas de proteção obrigatória',
          icon: 'el-icon-s-check'
        }
      ]
    }
  },
  computed: {
    ...mapState({
      isPropertyDrawn: state => !!state.property.propertyPolygon,
      drawnLayers: state => state.layers.activeLayers
    }),
    allLayers() {
      return [
        ...this.propertyLayers,
        ...this.soilCoverageLayers,
        ...this.administrativeServiceLayers,
        ...this.restrictedUseLayers,
        ...this.legalReserveLayers
      ]
    }
  },
  methods: {
    selectLayer(layer) {
      if (!this.canSelectLayer(layer)) {
        return
      }

      this.selectedLayerId = layer.id
      this.$emit('layer-selected', layer.id)
    },

    canSelectLayer(layer) {
      // Property can always be selected
      if (layer.id === 'property') {
        return true
      }

      // Other layers can only be selected if property is drawn
      if (!this.isPropertyDrawn) {
        return false
      }

      // Additional layer-specific rules could be added here

      return true
    },

    getLayerById(id) {
      return this.allLayers.find(layer => layer.id === id)
    }
  },
  watch: {
    selectedLayerId(newId) {
      // When layer selection changes, find layer details
      const selectedLayer = this.getLayerById(newId)
      if (selectedLayer) {
        this.$emit('layer-details', selectedLayer)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.layer-selector {
  width: 300px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.layer-panel {
  padding: 15px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 15px;
  color: #333;
}

.layer-categories {
  .category {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.category-title {
  font-size: 14px;
  margin: 0 0 10px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 5px;
}

.layers {
  .layer-item {
    display: flex;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 5px;

    &:hover {
      background-color: #f5f7fa;
    }

    &.active {
      background-color: #ecf5ff;
      border: 1px solid #409EFF;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        background-color: transparent;
      }
    }

    .layer-icon {
      width: 24px;
      height: 24px;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 20px;
        color: #409EFF;
      }
    }

    .layer-info {
      flex: 1;

      .layer-name {
        font-weight: bold;
        color: #303133;
        margin-bottom: 3px;
      }

      .layer-description {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
