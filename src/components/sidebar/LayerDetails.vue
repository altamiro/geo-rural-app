<template lang="pug">
  .layer-details(v-if="layer")
    .layer-header
      .layer-title
        h4 {{ layer.name }}
        .layer-type {{ getLayerTypeName(layer.id) }}
      el-button(type="text" icon="el-icon-back" @click="$emit('back')")

    .layer-body
      .info-section
        h5 Informações Gerais
        .info-grid
          .info-row
            .info-label Área:
            .info-value {{ formatArea(layer.area) }} ha
          .info-row
            .info-label Tipo:
            .info-value {{ getLayerTypeName(layer.id) }}
          .info-row
            .info-label Data de criação:
            .info-value {{ formatDate(layer.timestamp) }}
          .info-row(v-if="getLayerPercentage")
            .info-label Percentual do imóvel:
            .info-value {{ getLayerPercentage }}%

      .action-section
        h5 Ações
        .action-buttons
          el-button(type="primary" icon="el-icon-zoom-in" @click="zoomToLayer") Zoom para camada
          el-button(icon="el-icon-edit" @click="editLayer") Editar camada
          el-button(type="danger" icon="el-icon-delete" @click="confirmDelete") Excluir camada

      .style-section
        h5 Estilo de Visualização
        .style-options
          .color-picker
            span.option-label Cor de preenchimento:
            el-color-picker(v-model="fillColor" :predefine="colorPresets" @change="updateStyle")
          .opacity-slider
            span.option-label Opacidade:
            el-slider(v-model="opacity" :min="0" :max="1" :step="0.1" @change="updateStyle")

      .validation-section(v-if="validationData")
        h5 Validação
        .validation-result(:class="{ 'is-valid': validationData.isValid, 'is-invalid': !validationData.isValid }")
          i.el-icon-success(v-if="validationData.isValid")
          i.el-icon-error(v-if="!validationData.isValid")
          span {{ validationData.message }}
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { formatArea } from '@/utils/geometry'
import { LAYER_TYPES } from '@/utils/constants'

export default {
  name: 'LayerDetails',
  props: {
    /**
     * Objeto da camada a ser exibida
     */
    layer: {
      type: Object,
      default: null
    },
    /**
     * Área total do imóvel para cálculos percentuais
     */
    propertyArea: {
      type: Number,
      default: 0
    },
    /**
     * Dados de validação específicos da camada
     */
    validationData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      fillColor: '#409EFF',
      opacity: 0.5,
      colorPresets: [
        '#409EFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C',
        '#909399',
        '#9B59B6',
        '#2ECC71',
        '#F39C12'
      ],
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
    ...mapGetters({
      getLayerSymbology: 'layers/getLayerSymbology'
    }),
    /**
     * Calcula a porcentagem da camada em relação à área total do imóvel
     */
    getLayerPercentage() {
      if (!this.layer || !this.propertyArea || this.layer.id === LAYER_TYPES.PROPERTY) {
        return null
      }

      const percentage = (this.layer.area / this.propertyArea) * 100
      return percentage.toFixed(2)
    }
  },
  methods: {
    ...mapActions({
      zoomToGeometry: 'map/zoomToGeometry',
      deleteLayer: 'layers/deleteLayer',
      updateLayerSymbology: 'layers/updateLayerSymbology'
    }),
    formatArea,
    /**
     * Formata uma data ISO para exibição
     */
    formatDate(isoDate) {
      if (!isoDate) return '-'

      const date = new Date(isoDate)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    /**
     * Retorna o nome amigável do tipo de camada
     */
    getLayerTypeName(layerId) {
      return this.layerTypeNames[layerId] || layerId
    },
    /**
     * Zoom para a geometria da camada
     */
    zoomToLayer() {
      this.zoomToGeometry(this.layer.id)
      this.$emit('zoom-to-layer', this.layer.id)
    },
    /**
     * Iniciar edição da camada
     */
    editLayer() {
      this.$emit('edit-layer', this.layer.id)
    },
    /**
     * Confirmar exclusão da camada
     */
    confirmDelete() {
      const isProperty = this.layer.id === LAYER_TYPES.PROPERTY
      const message = isProperty
        ? 'Excluir a área do imóvel removerá todas as demais camadas. Deseja continuar?'
        : `Tem certeza que deseja excluir a camada "${this.layer.name}"?`

      this.$confirm(message, 'Confirmação', {
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não',
        type: 'warning'
      }).then(() => {
        this.deleteLayer(this.layer.id)
        this.$emit('layer-deleted', this.layer.id)
      }).catch(() => {
        // Cancelado pelo usuário
      })
    },
    /**
     * Atualiza o estilo da camada
     */
    updateStyle() {
      // Converter cor hex para rgba
      const hex = this.fillColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      const color = [r, g, b, this.opacity]
      const outline = [r, g, b, 1] // Contorno sempre sólido

      this.updateLayerSymbology({
        id: this.layer.id,
        symbology: { color, outline }
      })
    }
  },
  created() {
    // Inicializar cor e opacidade baseadas no estilo atual da camada
    if (this.layer) {
      const symbology = this.getLayerSymbology(this.layer.id)
      if (symbology) {
        const [r, g, b, a] = symbology.color

        // Converter rgba para hex
        this.fillColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        this.opacity = a
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.layer-details {
  padding: $spacing-small;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-medium;

  .layer-title {
    h4 {
      font-size: $font-size-medium;
      font-weight: bold;
      margin: 0;
      color: $text-primary;
    }

    .layer-type {
      font-size: $font-size-mini;
      color: $text-secondary;
    }
  }
}

.layer-body {
  .info-section,
  .action-section,
  .style-section,
  .validation-section {
    margin-bottom: $spacing-large;

    h5 {
      font-size: $font-size-base;
      font-weight: bold;
      margin: 0 0 $spacing-small;
      color: $text-primary;
      border-bottom: 1px solid $border-color-lighter;
      padding-bottom: $spacing-mini;
    }
  }

  .info-grid {
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: $spacing-mini 0;

      .info-label {
        font-weight: 500;
        color: $text-regular;
      }

      .info-value {
        color: $text-primary;
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: $spacing-small;
  }

  .style-options {
    .color-picker,
    .opacity-slider {
      margin-bottom: $spacing-small;

      .option-label {
        display: block;
        margin-bottom: $spacing-mini;
        color: $text-regular;
      }
    }
  }

  .validation-result {
    padding: $spacing-small;
    border-radius: $border-radius-base;
    display: flex;
    align-items: center;

    &.is-valid {
      background-color: #f0f9eb;
      color: $success-color;
    }

    &.is-invalid {
      background-color: #fef0f0;
      color: $danger-color;
    }

    i {
      font-size: 18px;
      margin-right: $spacing-small;
    }
  }
}
</style>
