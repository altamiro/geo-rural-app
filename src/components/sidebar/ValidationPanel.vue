<template lang="pug">
  .validation-panel
    .panel-header
      h3.panel-title Validação da Cobertura
      el-button(type="text" icon="el-icon-refresh" @click="validateCoverage") Atualizar

    .panel-content
      .coverage-info
        h4 Cobertura Total
        el-progress(:percentage="coveragePercentage" :status="coverageStatus" :format="percentFormat")

      .validation-message(:class="{ 'is-error': !isComplete, 'is-success': isComplete }")
        i.el-icon-warning(v-if="!isComplete")
        i.el-icon-success(v-if="isComplete")
        span {{ validationMessage }}

      .coverage-summary
        h4 Resumo de Cobertura
        .summary-item
          .summary-label Área do imóvel:
          .summary-value {{ formatArea(propertyArea) }} ha
        .summary-item
          .summary-label Área coberta:
          .summary-value {{ formatArea(coveredArea) }} ha
        .summary-item
          .summary-label Área não coberta:
          .summary-value {{ formatArea(uncoveredArea) }} ha

        .coverage-table
          h4 Camadas
          el-table(:data="layerSummary" style="width: 100%" size="mini")
            el-table-column(prop="name" label="Camada")
            el-table-column(prop="area" label="Área (ha)")
              template(slot-scope="scope")
                | {{ formatArea(scope.row.area) }}
            el-table-column(prop="percentage" label="% do Total")
              template(slot-scope="scope")
                | {{ formatPercentage(scope.row.percentage) }}
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { formatArea } from '@/utils/geometry'
import { getCoverageStatus } from '@/utils/validation'
import { MESSAGES, LAYER_TYPES } from '@/utils/constants'
import CalculationService from '@/services/calculation.service'

export default {
  name: 'ValidationPanel',
  data() {
    return {
      coverageResult: null,
      isValidating: false
    }
  },
  computed: {
    ...mapState({
      propertyArea: state => state.property.propertyArea,
      coveragePercentage: state => state.property.coveragePercentage,
      activeLayers: state => state.layers.activeLayers,
      propertyPolygon: state => state.property.propertyPolygon
    }),
    ...mapGetters({
      isComplete: 'property/isComplete',
      getLayerGeometry: 'layers/getLayerGeometry'
    }),
    coverageStatus() {
      return getCoverageStatus(this.coveragePercentage)
    },
    validationMessage() {
      if (!this.propertyArea) {
        return MESSAGES.PROPERTY_REQUIRED
      }

      if (this.isComplete) {
        return MESSAGES.COVERAGE_COMPLETE
      } else {
        return `Faltam ${this.formatPercentage(100 - this.coveragePercentage)} de cobertura`
      }
    },
    coveredArea() {
      // Se temos o resultado da validação, use-o, caso contrário calcule baseado na porcentagem
      if (this.coverageResult) {
        return this.coverageResult.coveredArea
      }
      return (this.propertyArea * this.coveragePercentage) / 100
    },
    uncoveredArea() {
      if (this.coverageResult) {
        return this.coverageResult.uncoveredArea
      }
      return this.propertyArea - this.coveredArea
    },
    layerSummary() {
      // Excluir a camada de propriedade do resumo
      return this.activeLayers
        .filter(layer => layer.id !== LAYER_TYPES.PROPERTY)
        .map(layer => {
          // Calcular a porcentagem em relação à área da propriedade
          const percentage = CalculationService.calculatePercentage(layer.area, this.propertyArea)

          return {
            name: layer.name,
            area: layer.area,
            percentage: percentage
          }
        })
        .sort((a, b) => b.area - a.area) // Ordenar por área (maior primeiro)
    }
  },
  methods: {
    ...mapActions({
      validateCompleteCoverage: 'layers/validateCompleteCoverage'
    }),
    formatArea,
    formatPercentage(percentage) {
      if (!percentage) return '0.00%'
      return percentage.toFixed(2) + '%'
    },
    percentFormat(percentage) {
      return `${percentage.toFixed(2)}%`
    },
    async validateCoverage() {
      this.isValidating = true

      try {
        // Verificar se a propriedade existe
        if (!this.propertyPolygon) {
          this.$message.warning(MESSAGES.PROPERTY_REQUIRED)
          this.isValidating = false
          return
        }

        // Coletar todas as geometrias de camadas (exceto a propriedade)
        const layerGeometries = []

        for (const layer of this.activeLayers) {
          if (layer.id !== LAYER_TYPES.PROPERTY) {
            const geometry = this.getLayerGeometry(layer.id)
            if (geometry) {
              layerGeometries.push(geometry)
            }
          }
        }

        // Calcular a cobertura usando o serviço
        this.coverageResult = await CalculationService.calculateCoverage(
          this.propertyPolygon,
          layerGeometries
        )

        // Atualizar o store com o resultado
        await this.validateCompleteCoverage()

        // Informar o resultado
        const isComplete = this.coverageResult.coveragePercentage >= 99.9

        if (isComplete) {
          this.$message.success(MESSAGES.COVERAGE_COMPLETE)
        } else {
          const remaining = (100 - this.coverageResult.coveragePercentage).toFixed(2)
          this.$message.warning(`Faltam ${remaining}% de cobertura.`)
        }

        // Emitir evento com o resultado da validação
        this.$emit('coverage-validated', {
          isComplete,
          percentage: this.coverageResult.coveragePercentage,
          coveredArea: this.coverageResult.coveredArea,
          uncoveredArea: this.coverageResult.uncoveredArea
        })
      } catch (error) {
        console.error('Erro ao validar cobertura:', error)
        this.$message.error('Ocorreu um erro ao validar a cobertura.')
      } finally {
        this.isValidating = false
      }
    }
  },
  async created() {
    // Validar automaticamente a cobertura na inicialização
    if (this.propertyPolygon && this.propertyArea > 0) {
      await this.validateCoverage()
    }
  }
}
</script>

<style lang="scss" scoped>
.validation-panel {
  background-color: white;
  border-radius: $border-radius-base;
  box-shadow: $shadow-base;
}

.panel-header {
  padding: $spacing-medium;
  border-bottom: 1px solid $border-color-lighter;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .panel-title {
    font-size: $font-size-medium;
    font-weight: bold;
    margin: 0;
    color: $text-primary;
  }
}

.panel-content {
  padding: $spacing-medium;
}

.coverage-info {
  margin-bottom: $spacing-large;

  h4 {
    font-size: $font-size-base;
    font-weight: bold;
    margin: 0 0 $spacing-small;
    color: $text-primary;
  }
}

.validation-message {
  padding: $spacing-small;
  border-radius: $border-radius-base;
  margin-bottom: $spacing-large;
  display: flex;
  align-items: center;

  &.is-error {
    background-color: #fef0f0;
    color: $danger-color;
  }

  &.is-success {
    background-color: #f0f9eb;
    color: $success-color;
  }

  i {
    font-size: 18px;
    margin-right: $spacing-small;
  }
}

.coverage-summary {
  h4 {
    font-size: $font-size-base;
    font-weight: bold;
    margin: 0 0 $spacing-small;
    color: $text-primary;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: $spacing-small 0;
    border-bottom: 1px solid $border-color-lighter;

    &:last-child {
      border-bottom: none;
    }

    .summary-label {
      color: $text-regular;
    }

    .summary-value {
      font-weight: bold;
      color: $text-primary;
    }
  }

  .coverage-table {
    margin-top: $spacing-large;
  }
}
</style>
