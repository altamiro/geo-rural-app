<template lang="pug">
  .property-info-panel
    h3.panel-title Informações do Imóvel
    .info-grid
      .info-row
        .info-label Área do imóvel:
        .info-value {{ formatArea(propertyArea) }} ha
      .info-row
        .info-label Área de servidão:
        .info-value {{ formatArea(administrativeServiceArea) }} ha
      .info-row
        .info-label Área líquida:
        .info-value {{ formatArea(netArea) }} ha
      .info-row
        .info-label Área antropizada após 2008:
        .info-value {{ formatArea(anthropizedArea) }} ha

    .coverage-progress
      h4 Cobertura da área (%)
      el-progress(:percentage="coveragePercentage" :format="percentFormat" :status="coverageStatus")

    .layers-summary
      h4 Camadas Vetorizadas
      .layer-item(v-for="layer in activeLayers" :key="layer.id")
        .layer-name {{ layer.name }}
        .layer-area {{ formatArea(layer.area) }} ha
        .layer-actions
          el-button(type="text" icon="el-icon-edit" @click="editLayer(layer)")
          el-button(type="text" icon="el-icon-delete" @click="deleteLayer(layer)")
</template>

<script>
import { mapState } from 'vuex'
import { formatArea } from '@/utils/geometry'
import { getCoverageStatus } from '@/utils/validation'
import CalculationService from '@/services/calculation.service'
import { LAYER_TYPES } from '@/utils/constants'

export default {
  name: 'PropertyInfo',
  props: {
    propertyArea: {
      type: Number,
      default: 0
    },
    netArea: {
      type: Number,
      default: 0
    },
    administrativeServiceArea: {
      type: Number,
      default: 0
    },
    anthropizedArea: {
      type: Number,
      default: 0
    }
  },
  computed: {
    ...mapState({
      activeLayers: state => state.layers.activeLayers,
      propertyPolygon: state => state.property.propertyPolygon
    }),
    coveragePercentage() {
      if (!this.propertyArea) return 0

      // Calcular área total coberta por todas as camadas exceto a propriedade
      const coveredArea = this.activeLayers.reduce((total, layer) => {
        // Ignorar a camada de propriedade no cálculo
        if (layer.id === LAYER_TYPES.PROPERTY) return total
        return total + layer.area
      }, 0)

      // Usar o serviço de cálculo para obter a porcentagem
      return CalculationService.calculatePercentage(coveredArea, this.propertyArea)
    },
    coverageStatus() {
      return getCoverageStatus(this.coveragePercentage)
    }
  },
  methods: {
    formatArea,
    percentFormat(percentage) {
      return `${percentage.toFixed(2)}%`
    },
    editLayer(layer) {
      this.$emit('edit-layer', layer)
    },
    async deleteLayer(layer) {
      // Verificar se é a camada de propriedade para mostrar alerta especial
      const isProperty = layer.id === LAYER_TYPES.PROPERTY
      const confirmMessage = isProperty
        ? 'Excluir a área do imóvel removerá todas as demais camadas. Deseja continuar?'
        : `Tem certeza que deseja excluir a camada "${layer.name}"?`

      // Se for excluir a propriedade, calcular o impacto
      let impactMessage = ''
      if (isProperty && this.activeLayers.length > 1) {
        const affectedLayers = this.activeLayers.filter(l => l.id !== LAYER_TYPES.PROPERTY)
        impactMessage = `\n\nIsso afetará ${affectedLayers.length} camada(s) vetorizada(s).`
      }

      try {
        await this.$confirm(confirmMessage + impactMessage, 'Confirmação', {
          confirmButtonText: 'Sim',
          cancelButtonText: 'Não',
          type: 'warning'
        })

        // Se confirmado, emitir evento para deletar
        this.$emit('delete-layer', layer)
      } catch {
        // Usuário cancelou a operação
      }
    },
    // Método para simular cálculo de áreas não cobertas
    async calculateUncoveredAreas() {
      if (!this.propertyPolygon) return 0

      // Obter geometrias das camadas existentes
      const layerGeometries = this.activeLayers
        .filter(layer => layer.id !== LAYER_TYPES.PROPERTY)
        .map(layer => layer.geometry)

      // Usar o serviço para calcular a cobertura
      const coverageResult = await CalculationService.calculateCoverage(
        this.propertyPolygon,
        layerGeometries
      )

      return {
        covered: coverageResult.coveredArea,
        uncovered: coverageResult.uncoveredArea,
        percentage: coverageResult.coveragePercentage
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.property-info-panel {
  background-color: white;
  border-radius: $border-radius-base;
  box-shadow: $shadow-base;
  padding: $spacing-medium;
  min-width: 300px;
}

.panel-title {
  font-size: $font-size-medium;
  font-weight: bold;
  margin: 0 0 $spacing-medium;
  color: $text-primary;
}

.info-grid {
  margin-bottom: $spacing-medium;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-small;

  .info-label {
    font-weight: 500;
    color: $text-regular;
  }

  .info-value {
    font-weight: bold;
    color: $text-primary;
  }
}

.coverage-progress {
  margin-bottom: $spacing-medium;

  h4 {
    font-size: $font-size-base;
    margin: 0 0 $spacing-small;
    color: $text-primary;
  }
}

.layers-summary {
  h4 {
    font-size: $font-size-base;
    margin: 0 0 $spacing-small;
    color: $text-primary;
  }

  .layer-item {
    display: flex;
    align-items: center;
    padding: $spacing-small 0;
    border-bottom: 1px solid $border-color-lighter;

    &:last-child {
      border-bottom: none;
    }

    .layer-name {
      flex: 1;
    }

    .layer-area {
      margin: 0 $spacing-medium;
      color: $text-regular;
    }

    .layer-actions {
      display: flex;

      .el-button {
        padding: 0 $spacing-mini;
      }
    }
  }
}
</style>
