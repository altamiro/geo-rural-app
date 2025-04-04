<template lang="pug">
  .map-legend
    .legend-panel
      h3.legend-title Legenda
      .legend-content
        .legend-item(v-for="item in visibleLayers" :key="item.id")
          .legend-color(:style="{ backgroundColor: getColorStyle(item.id) }")
          .legend-label {{ item.name }}
          .legend-area {{ formatArea(item.area) }} ha
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'MapLegend',
  computed: {
    ...mapState({
      activeLayers: state => state.layers.activeLayers,
      layerSymbology: state => state.layers.layerSymbology
    }),
    ...mapGetters({
      isLayerVisible: 'layers/isLayerVisible'
    }),
    visibleLayers() {
      return this.activeLayers.filter(layer => this.isLayerVisible(layer.id))
    }
  },
  methods: {
    getColorStyle(layerId) {
      const symbology = this.layerSymbology[layerId]
      if (!symbology) return 'rgba(128, 128, 128, 0.5)'

      const color = symbology.color
      return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`
    },
    formatArea(area) {
      if (!area) return '0.00'
      return area.toFixed(2)
    }
  }
}
</script>

<style lang="scss" scoped>
.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 250px;
}

.legend-panel {
  padding: 15px;
}

.legend-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 15px;
  color: #333;
}

.legend-content {
  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      border: 1px solid rgba(0, 0, 0, 0.2);
    }

    .legend-label {
      flex: 1;
      font-size: 14px;
      color: #606266;
    }

    .legend-area {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
    }
  }
}
</style>
