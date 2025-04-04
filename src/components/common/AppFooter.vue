<template lang="pug">
  .app-footer
    .footer-container
      .footer-info
        span.copyright © 2025 Sistema de Georreferenciamento
      .footer-status
        span.status-label Status:
        span.status-value(:class="statusClass") {{ statusText }}
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'AppFooter',
  computed: {
    ...mapState({
      loading: state => state.map.loading || state.layers.loading || state.property.loading,
      error: state => state.map.error || state.layers.error || state.property.error,
      propertyDefined: state => !!state.property.propertyPolygon,
      coveragePercentage: state => state.property.coveragePercentage
    }),
    ...mapGetters({
      isComplete: 'property/isComplete'
    }),
    statusClass() {
      if (this.loading) return 'status-loading'
      if (this.error) return 'status-error'
      if (!this.propertyDefined) return 'status-warning'
      if (this.isComplete) return 'status-success'
      return 'status-warning'
    },
    statusText() {
      if (this.loading) return 'Carregando...'
      if (this.error) return `Erro: ${this.error}`
      if (!this.propertyDefined) return 'Área do imóvel não definida'

      if (this.isComplete) {
        return 'Cobertura completa'
      } else {
        return `Cobertura incompleta (${this.coveragePercentage.toFixed(2)}%)`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-footer {
  background-color: #f5f7fa;
  padding: 15px 20px;
  border-top: 1px solid #e6e6e6;
}

.footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  .copyright {
    font-size: 14px;
    color: #606266;
  }
}

.footer-status {
  display: flex;
  align-items: center;

  .status-label {
    margin-right: 10px;
    font-weight: bold;
    color: #606266;
  }

  .status-value {
    font-weight: 500;

    &.status-loading {
      color: #909399;
    }

    &.status-error {
      color: #F56C6C;
    }

    &.status-warning {
      color: #E6A23C;
    }

    &.status-success {
      color: #67C23A;
    }
  }
}
</style>
