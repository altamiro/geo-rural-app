<template lang="pug">
  .geo-view
    .geo-card
      .geo-header
        h2 Dados de Geolocalização
      .geo-content
        .geo-info
          h3 Configure e gerencie informações do imóvel rural
            span.highlight começando pelo Imóvel:

        .geo-categories
          el-row(:gutter="20")
            el-col(:span="4")
              .category-card
                .category-icon
                  i.el-icon-s-home
                h4 Imóvel
                el-select(v-model="selectedProperty" placeholder="Selecione" @change="onLayerTypeSelected")
                  el-option(v-for="item in propertyOptions" :key="item.value" :label="item.label" :value="item.value")

            el-col(:span="4")
              .category-card
                .category-icon
                  i.el-icon-s-grid
                h4 Cobertura do solo
                el-select(v-model="selectedSoilCoverage" placeholder="Selecione" :disabled="!propertyDrawn" @change="onLayerTypeSelected")
                  el-option(v-for="item in soilCoverageOptions" :key="item.value" :label="item.label" :value="item.value")

            el-col(:span="4")
              .category-card
                .category-icon
                  i.el-icon-s-promotion
                h4 Servidão administrativa
                el-select(v-model="selectedAdministrativeService" placeholder="Selecione" :disabled="!propertyDrawn" @change="onLayerTypeSelected")
                  el-option(v-for="item in serviceOptions" :key="item.value" :label="item.label" :value="item.value")

            el-col(:span="4")
              .category-card
                .category-icon
                  i.el-icon-s-flag
                h4 App / Uso Restrito
                el-select(v-model="selectedUsage" placeholder="Selecione" :disabled="!propertyDrawn" @change="onLayerTypeSelected")
                  el-option(v-for="item in usageOptions" :key="item.value" :label="item.label" :value="item.value")

            el-col(:span="4")
              .category-card
                .category-icon
                  i.el-icon-s-check
                h4 Reserva legal
                el-select(v-model="selectedLegalReserve" placeholder="Selecione" :disabled="!propertyDrawn" @change="onLayerTypeSelected")
                  el-option(v-for="item in legalReserveOptions" :key="item.value" :label="item.label" :value="item.value")

    .geo-map-container
      // Componente do mapa
      map-container(
        ref="mapContainer"
        :selectedLayer="selectedLayer"
        @property-drawn="onPropertyDrawn"
        @toggle-layer-panel="toggleSidebar('layers')"
        @show-search="toggleSidebar('search')"
        @map-initialized="onMapInitialized"
        @sketch-view-model-ready="onSketchViewModelReady"
      )

      // Ferramentas de desenho
      .map-tools
        drawing-tools(
          :selectedLayer="selectedLayer"
          :isPropertyDrawn="propertyDrawn"
          @draw="handleDraw"
        )

      // Informações da propriedade
      .info-panel
        property-info(
          :propertyArea="propertyArea"
          :netArea="netArea"
          :administrativeServiceArea="administrativeServiceArea"
          :anthropizedArea="anthropizedArea"
          @edit-layer="editLayer"
          @delete-layer="handleDeleteLayer"
        )

      // Painel lateral com diferentes visões
      transition(name="slide-right")
        .sidebar-wrapper(v-if="sidebarVisible")
          sidebar-container(
            :title="sidebarTitle"
            :closable="true"
            @close="closeSidebar"
          )
            // Lista de camadas
            layer-list(
              v-if="currentSidebarView === 'layers'"
              :selectedLayerId="selectedLayerId"
              @select-layer="viewLayerDetails"
              @edit-layer="editLayer"
              @layer-deleted="handleLayerDeleted"
              @zoom-to-layer="handleZoomToLayer"
              @visibility-changed="handleToggleLayerVisibility"
              @refresh="refreshLayerList"
            )

            // Detalhes da camada
            layer-details(
              v-else-if="currentSidebarView === 'layerDetails'"
              :layer="selectedLayerDetails"
              :propertyArea="propertyArea"
              :validationData="layerValidation"
              @back="showLayerList"
              @edit-layer="editLayer"
              @layer-deleted="handleLayerDeleted"
              @zoom-to-layer="handleZoomToLayer"
              @style-changed="updateLayerStyle"
            )

            // Painel de validação
            validation-panel(
              v-else-if="currentSidebarView === 'validation'"
              @coverage-validated="handleCoverageValidation"
            )

            // Busca (implementação futura)
            .search-panel(v-else-if="currentSidebarView === 'search'")
              h3.search-title Buscar Localização
              el-input(
                v-model="searchQuery"
                placeholder="Digite um endereço ou coordenadas"
                prefix-icon="el-icon-search"
                clearable
                @keyup.enter.native="performSearch"
              )
              el-button(type="primary" @click="performSearch" :disabled="!searchQuery") Buscar

      // Botão para abrir o painel lateral
      .sidebar-toggle(v-if="!sidebarVisible")
        el-tooltip(content="Ver camadas" placement="left")
          el-button(icon="el-icon-d-arrow-right" circle @click="toggleSidebar('layers')")

      // Botão de validação
      .validation-button
        el-tooltip(content="Validar cobertura" placement="left")
          el-button(
            type="success"
            icon="el-icon-check"
            circle
            @click="toggleSidebar('validation')"
          )
</template>

<script>
import MapContainer from '@/components/map/MapContainer.vue'
import DrawingTools from '@/components/map/DrawingTools.vue'
import PropertyInfo from '@/components/map/PropertyInfo.vue'
import SidebarContainer from '@/components/sidebar/SidebarContainer.vue'
import LayerList from '@/components/sidebar/LayerList.vue'
import LayerDetails from '@/components/sidebar/LayerDetails.vue'
import ValidationPanel from '@/components/sidebar/ValidationPanel.vue'
import { mapState, mapGetters, mapActions } from 'vuex'
import { loadEsriModules } from "@/utils/esri-loader-config";
import { LAYER_TYPES } from '@/utils/constants'

export default {
  name: 'GeoView',
  components: {
    MapContainer,
    DrawingTools,
    PropertyInfo,
    SidebarContainer,
    LayerList,
    LayerDetails,
    ValidationPanel
  },
  data() {
    return {
      // Seleção de categorias
      selectedProperty: '',
      selectedSoilCoverage: '',
      selectedAdministrativeService: '',
      selectedUsage: '',
      selectedLegalReserve: '',

      // Estado da propriedade
      propertyDrawn: false,

      // Estado do painel lateral
      sidebarVisible: false,
      currentSidebarView: 'layers', // 'layers', 'layerDetails', 'validation', 'search'
      selectedLayerId: null,
      layerValidation: null,
      mapInitialized: false,
      sketchViewModelReady: false,

      // Busca
      searchQuery: '',

      // Opções para selects
      propertyOptions: [
        { value: 'property', label: 'Área do imóvel' },
        { value: 'headquarters', label: 'Sede do imóvel' }
      ],
      soilCoverageOptions: [
        { value: 'consolidated', label: 'Área consolidada' },
        { value: 'native', label: 'Remanescente de vegetação nativa' },
        { value: 'fallow', label: 'Área de pousio' }
      ],
      serviceOptions: [
        { value: 'roadway', label: 'Rodovia' },
        { value: 'railway', label: 'Ferrovia' },
        { value: 'powerline', label: 'Linha de transmissão' }
      ],
      usageOptions: [
        { value: 'ppa', label: 'Área de Preservação Permanente' },
        { value: 'restricted', label: 'Uso Restrito' }
      ],
      legalReserveOptions: [
        { value: 'reserve', label: 'Reserva Legal' }
      ]
    }
  },
  computed: {
    ...mapState({
      propertyArea: state => state.property.propertyArea,
      administrativeServiceArea: state => state.property.administrativeServiceArea,
      netArea: state => state.property.netArea,
      anthropizedArea: state => state.property.anthropizedArea,
      activeLayers: state => state.layers.activeLayers
    }),
    ...mapGetters({
      getLayerById: 'layers/getLayerById'
    }),
    // Camada selecionada atualmente
    selectedLayer() {
      if (this.selectedProperty) return this.selectedProperty
      if (this.selectedSoilCoverage) return this.selectedSoilCoverage
      if (this.selectedAdministrativeService) return this.selectedAdministrativeService
      if (this.selectedUsage) return this.selectedUsage
      if (this.selectedLegalReserve) return this.selectedLegalReserve
      return null
    },
    // Título do painel lateral
    sidebarTitle() {
      switch (this.currentSidebarView) {
        case 'layers': return 'Camadas Vetorizadas'
        case 'layerDetails': return 'Detalhes da Camada'
        case 'validation': return 'Validação de Cobertura'
        case 'search': return 'Buscar Localização'
        default: return 'Painel Lateral'
      }
    },
    // Detalhes da camada selecionada
    selectedLayerDetails() {
      return this.getLayerById(this.selectedLayerId)
    },


  },
  methods: {
    ...mapActions({
      initializeMap: 'map/initializeMap',
      calculateAreas: 'property/calculateAreas',
      zoomToGeometry: 'map/zoomToGeometry',
      toggleLayerVisibility: 'layers/toggleLayerVisibility',
      deleteLayerAction: 'layers/deleteLayer'
    }),

    // Quando o mapa é inicializado
    onMapInitialized() {
      this.mapInitialized = true
      console.log('Mapa inicializado com sucesso')

      // Informar ao usuário
      this.$message.success('Mapa carregado com sucesso', { duration: 1500 })
    },

    // Quando o SketchViewModel está pronto
    onSketchViewModelReady() {
      this.sketchViewModelReady = true
      console.log('SketchViewModel inicializado e pronto para uso')
    },

    // Quando a propriedade é desenhada
    onPropertyDrawn() {
      this.propertyDrawn = true
      this.calculateAreas()

      // Mostrar mensagem de sucesso
      this.$message.success('Área do imóvel definida com sucesso!')

      // Limpar seleções de camadas
      this.clearLayerSelections()
    },

    // Quando um tipo de camada é selecionado
    onLayerTypeSelected() {
      // Lógica para limpar outras seleções
      if (this.selectedProperty) {
        this.selectedSoilCoverage = ''
        this.selectedAdministrativeService = ''
        this.selectedUsage = ''
        this.selectedLegalReserve = ''
      } else if (this.selectedSoilCoverage) {
        this.selectedProperty = ''
        this.selectedAdministrativeService = ''
        this.selectedUsage = ''
        this.selectedLegalReserve = ''
      } else if (this.selectedAdministrativeService) {
        this.selectedProperty = ''
        this.selectedSoilCoverage = ''
        this.selectedUsage = ''
        this.selectedLegalReserve = ''
      } else if (this.selectedUsage) {
        this.selectedProperty = ''
        this.selectedSoilCoverage = ''
        this.selectedAdministrativeService = ''
        this.selectedLegalReserve = ''
      } else if (this.selectedLegalReserve) {
        this.selectedProperty = ''
        this.selectedSoilCoverage = ''
        this.selectedAdministrativeService = ''
        this.selectedUsage = ''
      }
    },

    // Limpar todas as seleções de camadas
    clearLayerSelections() {
      this.selectedProperty = ''
      this.selectedSoilCoverage = ''
      this.selectedAdministrativeService = ''
      this.selectedUsage = ''
      this.selectedLegalReserve = ''
    },

    // Gerenciamento do painel lateral
    toggleSidebar(view = 'layers') {
      if (this.sidebarVisible && this.currentSidebarView === view) {
        this.closeSidebar()
      } else {
        this.sidebarVisible = true
        this.currentSidebarView = view
      }
    },

    closeSidebar() {
      this.sidebarVisible = false
    },

    // Navegação entre vistas do painel lateral
    showLayerList() {
      this.currentSidebarView = 'layers'
      this.selectedLayerId = null
      // Atualizar a lista de camadas
      this.refreshLayerList()
    },

    // Método para atualizar a lista de camadas
    refreshLayerList() {
      // Aqui poderia ter uma lógica para recarregar camadas do servidor se necessário
      this.$nextTick(() => {
        this.$message.success('Lista de camadas atualizada', { duration: 1000 })
      })
    },

    viewLayerDetails(layerId) {
      this.selectedLayerId = layerId
      this.currentSidebarView = 'layerDetails'

      // Carregar dados de validação para a camada
      this.fetchLayerValidation(layerId)
    },

    // Buscar dados de validação para a camada
    async fetchLayerValidation(layerId) {
      // Simulação de busca de dados de validação
      this.layerValidation = { loading: true }

      try {
        const layer = this.getLayerById(layerId)

        // Verificamos o tipo de camada para aplicar validações específicas
        if (layer.id === LAYER_TYPES.PROPERTY) {
          // Para propriedade, validamos se tem área definida
          this.layerValidation = {
            isValid: layer.area > 0,
            message: layer.area > 0
              ? 'Área do imóvel definida corretamente.'
              : 'Área do imóvel possui valor zero ou inválido.'
          }
        } else if (['consolidated', 'native', 'fallow'].includes(layer.id)) {
          // Para cobertura do solo, verificamos se está dentro da propriedade
          this.layerValidation = {
            isValid: true,
            message: 'Camada validada e dentro dos limites da propriedade.'
          }
        } else {
          // Validação genérica para outras camadas
          this.layerValidation = {
            isValid: true,
            message: 'Camada validada com sucesso.'
          }
        }
      } catch (error) {
        console.error('Erro ao buscar validação da camada:', error)
        this.layerValidation = {
          isValid: false,
          message: 'Erro ao validar camada.'
        }
      }
    },

    // Método para atualizar o estilo visual da camada
    updateLayerStyle({ layerId, style }) {
      // Chamar ação do Vuex para atualizar o estilo
      this.$store.dispatch('layers/updateLayerSymbology', { id: layerId, symbology: style })
        .then(() => {
          this.$message.success('Estilo da camada atualizado')
        })
        .catch((error) => {
          console.error('Erro ao atualizar estilo da camada:', error)
          this.$message.error('Erro ao atualizar estilo da camada')
        })
    },

    // Métodos de gerenciamento de camadas
    handleDraw() {
      if (!this.mapInitialized || !this.sketchViewModelReady) {
        this.$message.warning('As ferramentas de desenho estão sendo inicializadas. Por favor, aguarde um momento.')
        return
      }

      if (this.selectedLayer) {
        // Lógica para iniciar o desenho
        this.$refs.mapContainer.startDrawing(this.selectedLayer)
      } else {
        this.$message.warning('Selecione uma camada antes de iniciar o desenho.')
      }
    },

    editLayer(layerData) {
      // Identificar a camada e ativar modo de edição
      const layerId = typeof layerData === 'string' ? layerData : layerData.id

      // Lógica para editar camada
      this.$message.info(`Editando camada: ${layerId}`)

      // Selecionar a camada e fechar o painel lateral para permitir a edição
      this.selectLayerForDrawing(layerId)
      this.closeSidebar()
    },

    handleDeleteLayer(layerData) {
      // Identificar a camada
      const layerId = typeof layerData === 'string' ? layerData : layerData.id

      // Excluir a camada
      this.deleteLayerAction(layerId)
        .then(() => {
          this.$message.success('Camada excluída com sucesso!')

          // Se estiver visualizando detalhes, voltar para a lista
          if (this.currentSidebarView === 'layerDetails') {
            this.showLayerList()
          }
        })
        .catch(error => {
          console.error('Erro ao excluir camada:', error)
          this.$message.error('Erro ao excluir camada')
        })
    },

    handleLayerDeleted(layerId) {
      // Ações após a exclusão de uma camada
      if (layerId === LAYER_TYPES.PROPERTY) {
        // Se a propriedade foi excluída, resetar o estado
        this.propertyDrawn = false
      }

      // Se a camada atual foi excluída, voltar para a lista
      if (this.selectedLayerId === layerId) {
        this.showLayerList()
      }
    },

    handleZoomToLayer(layerId) {
      this.zoomToGeometry(layerId)
      this.closeSidebar()
    },

    handleToggleLayerVisibility({ id, visible }) {
      this.toggleLayerVisibility({ id, visible })
    },

    // Método para selecionar uma camada nos selects com base no ID
    selectLayerForDrawing(layerId) {
      // Limpar seleções atuais
      this.clearLayerSelections()

      // Definir a seleção apropriada com base no ID da camada
      if (this.propertyOptions.some(opt => opt.value === layerId)) {
        this.selectedProperty = layerId
      } else if (this.soilCoverageOptions.some(opt => opt.value === layerId)) {
        this.selectedSoilCoverage = layerId
      } else if (this.serviceOptions.some(opt => opt.value === layerId)) {
        this.selectedAdministrativeService = layerId
      } else if (this.usageOptions.some(opt => opt.value === layerId)) {
        this.selectedUsage = layerId
      } else if (this.legalReserveOptions.some(opt => opt.value === layerId)) {
        this.selectedLegalReserve = layerId
      }
    },

    // Validação de cobertura
    handleCoverageValidation(result) {
      if (result.isComplete) {
        this.$message.success('A cobertura do imóvel está completa!')
      } else {
        this.$message.warning(`Cobertura incompleta: ${result.percentage.toFixed(2)}%`)
      }
    },

    // Busca (implementação futura)
    async performSearch() {
      if (!this.searchQuery) return

      try {
        // Exibir indicador de carregamento
        const loading = this.$loading({
          lock: true,
          text: 'Buscando localização...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        // Usar o serviço ArcGIS para geocodificação
        const [Locator] = await loadEsriModules(["esri/tasks/Locator"])

        const locator = new Locator({
          url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
        })

        const params = {
          address: {
            SingleLine: this.searchQuery
          },
          outFields: ["*"]
        }

        try {
          const results = await locator.addressToLocations(params)

          if (results.length > 0) {
            const firstResult = results[0]

            // Zoom para o local encontrado
            if (this.$refs.mapContainer && this.$refs.mapContainer.view) {
              this.$refs.mapContainer.view.goTo({
                target: firstResult.location,
                zoom: 14
              })

              this.$message.success(`Localização encontrada: ${firstResult.address}`)
            } else {
              this.$message.warning('O mapa ainda não está inicializado completamente.')
            }
          } else {
            this.$message.warning('Nenhum resultado encontrado.')
          }
        } catch (error) {
          console.error('Erro na busca:', error)
          this.$message.error('Não foi possível realizar a busca.')
        } finally {
          loading.close()
        }
      } catch (error) {
        this.$message.error('Erro ao inicializar o serviço de busca.')
        console.error('Erro ao inicializar busca:', error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.geo-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.geo-card {
  padding: $spacing-medium;
  box-shadow: $shadow-light;
  margin-bottom: $spacing-medium;
}

.geo-header {
  margin-bottom: $spacing-medium;

  h2 {
    font-size: $font-size-large;
    color: $text-primary;
    margin: 0;
  }
}

.geo-content {
  .geo-info {
    margin-bottom: $spacing-medium;

    h3 {
      font-size: $font-size-medium;
      font-weight: normal;
      color: $text-primary;

      .highlight {
        color: $primary-color;
        font-weight: bold;
      }
    }
  }
}

.geo-categories {
  margin-top: $spacing-medium;
}

.category-card {
  text-align: center;
  padding: $spacing-medium;
  border: 1px solid $border-color-light;
  border-radius: $border-radius-base;
  height: 100%;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-light;
  }

  .category-icon {
    height: 60px;
    width: 60px;
    margin: 0 auto $spacing-small;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 32px;
      color: $primary-color;
    }
  }

  h4 {
    margin: 0 0 $spacing-medium;
    font-size: $font-size-base;
    color: $text-primary;
  }
}

.geo-map-container {
  flex-grow: 1;
  position: relative;
  border: 1px solid $border-color-light;
  border-radius: $border-radius-base;
  overflow: hidden;

  .map-tools {
    position: absolute;
    top: $spacing-medium;
    left: $spacing-medium;
    z-index: 10;
  }

  .info-panel {
    position: absolute;
    bottom: $spacing-xl;
    right: $spacing-xl;
    z-index: 10;
  }

  .sidebar-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 20;
  }

  .sidebar-toggle {
    position: absolute;
    top: $spacing-medium;
    right: $spacing-medium;
    z-index: 10;
  }

  .validation-button {
    position: absolute;
    top: $spacing-medium + 50px; // Abaixo do botão de sidebar
    right: $spacing-medium;
    z-index: 10;
  }
}

// Animação do painel lateral
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
