<template lang="pug">
  .geo-view
    .map-loading-overlay(v-if="!mapInitialized || !sketchViewModelReady")
      .loading-spinner
        i.el-icon-loading
      .loading-text {{ loadingMessage }}
      .loading-time {{ loadingTimeText }}
      .loading-actions(v-if="loadingTooLong")
        el-button(type="primary" @click="forceInitialize") Continuar mesmo assim
        el-button(@click="reloadPage") Recarregar página
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

    app-header(@zoom-to-municipality="handleZoomToMunicipality")

    .geo-map-container
      map-container(
        ref="mapContainer"
        :selectedLayer="selectedLayer"
        @property-drawn="onPropertyDrawn"
        @toggle-layer-panel="toggleSidebar('layers')"
        @show-search="toggleSidebar('search')"
        @map-initialized="onMapInitialized"
        @sketch-view-model-ready="onSketchViewModelReady"
        @map-error="onMapError"
        @sketch-view-model-error="onSketchError"
        @zoom-to-municipality="handleZoomToMunicipality"
      )

      .map-tools
        drawing-tools(
          :selectedLayer="selectedLayer"
          :isPropertyDrawn="propertyDrawn"
          @draw="handleDraw"
        )

      .info-panel
        property-info(
          :propertyArea="propertyArea"
          :netArea="netArea"
          :administrativeServiceArea="administrativeServiceArea"
          :anthropizedArea="anthropizedArea"
          @edit-layer="editLayer"
          @delete-layer="handleDeleteLayer"
        )

      transition(name="slide-right")
        .sidebar-wrapper(v-if="sidebarVisible")
          sidebar-container(
            :title="sidebarTitle"
            :closable="true"
            @close="closeSidebar"
          )
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

            validation-panel(
              v-else-if="currentSidebarView === 'validation'"
              @coverage-validated="handleCoverageValidation"
            )

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

      .sidebar-toggle(v-if="!sidebarVisible")
        el-tooltip(content="Ver camadas" placement="left")
          el-button(icon="el-icon-d-arrow-right" circle @click="toggleSidebar('layers')")

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
import AppHeader from '@/components/common/AppHeader.vue'
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
  provide() {
    return {
      mapReady: () => this.mapInitialized,
      sketchReady: () => this.sketchViewModelReady
    };
  },
  components: {
    AppHeader,
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

      loadingStartTime: Date.now(),
      loadingTooLong: false,
      loadingInterval: null,

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
  mounted() {
    // Iniciar o intervalo para verificar o tempo de carregamento
    this.loadingInterval = setInterval(() => {
      const elapsed = (Date.now() - this.loadingStartTime) / 1000
      if (elapsed > 10 && (!this.mapInitialized || !this.sketchViewModelReady)) {
        this.loadingTooLong = true
      }

      // Timeout de segurança após 30 segundos
      if (elapsed > 30) {
        this.forceInitialize()
      }
    }, 1000)
  },

  beforeDestroy() {
    // Limpar o intervalo quando o componente for destruído
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval)
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

    loadingMessage() {
      if (!this.mapInitialized) return 'Carregando mapa...'
      if (!this.sketchViewModelReady) return 'Inicializando ferramentas de desenho...'
      return 'Carregando...'
    },

    loadingTimeText() {
      const elapsed = Math.floor((Date.now() - this.loadingStartTime) / 1000)
      return `Tempo decorrido: ${elapsed} segundos`
    },
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
    }
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

    checkMapReady() {
      if (!this.mapInitialized) {
        this.$message.warning('O mapa ainda está sendo inicializado. Aguarde um momento.');
        return false;
      }
      return true;
    },

    checkSketchReady() {
      if (!this.sketchViewModelReady) {
        this.$message.warning('As ferramentas de desenho estão sendo inicializadas. Aguarde um momento.');
        return false;
      }
      return true;
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

    // Adicionar método para zoom ao município
    handleZoomToMunicipality(municipalityGeometry) {
      // Verificação robusta para evitar processamento indevido
      if (!municipalityGeometry || this._isZooming) {
        console.log("Ignorando chamada de zoom - já está em processamento ou geometria inválida");
        return;
      }

      // Definir flag de processamento
      this._isZooming = true;

      // Timeout de segurança para garantir que a flag será resetada
      const safetyTimeout = setTimeout(() => {
        this._isZooming = false;
      }, 3000);

      try {
        // Verificar referência do mapa
        if (!this.$refs.mapContainer || !this.$refs.mapContainer.view) {
          console.error("Referência do mapa não disponível para zoom");
          clearTimeout(safetyTimeout);
          this._isZooming = false;
          return;
        }

        // Verificar se a geometria é válida para uso
        if (!municipalityGeometry.coordinates ||
          !Array.isArray(municipalityGeometry.coordinates) ||
          municipalityGeometry.coordinates.length === 0 ||
          !Array.isArray(municipalityGeometry.coordinates[0])) {
          console.error("Formato de geometria inválido para zoom", municipalityGeometry);
          clearTimeout(safetyTimeout);
          this._isZooming = false;
          return;
        }

        // Usar uma abordagem diferente para criar o extent
        const extent = {
          type: "polygon",
          rings: municipalityGeometry.coordinates[0]
        };

        // Aplicar zoom com tratamento de erro
        this.$refs.mapContainer.view.goTo({
          target: extent,
          zoom: 9
        }, {
          duration: 1000,
          easing: "ease-out"
        }).then(() => {
          // Sucesso no zoom
          clearTimeout(safetyTimeout);
          this._isZooming = false;
        }).catch(error => {
          // Erro no zoom
          console.error("Erro ao aplicar zoom:", error);
          clearTimeout(safetyTimeout);
          this._isZooming = false;
        });
      } catch (error) {
        // Erro ao processar zoom
        console.error("Erro no processamento de zoom:", error);
        clearTimeout(safetyTimeout);
        this._isZooming = false;
      }
    },

    // Busca de localização
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
    },
    forceInitialize() {
      this.mapInitialized = true
      this.sketchViewModelReady = true
      clearInterval(this.loadingInterval)
      this.$message.warning('Forçando inicialização da aplicação. Algumas funções do mapa podem não funcionar corretamente.')
    },

    reloadPage() {
      window.location.reload()
    },

    onMapError(errorMessage) {
      console.error('Erro na inicialização do mapa:', errorMessage);
      this.$message.error(`Erro ao carregar o mapa: ${errorMessage}`);
      // Após um erro crítico, mostrar opção para continuar
      this.loadingTooLong = true;
    },

    onSketchError(errorMessage) {
      console.error('Erro na inicialização do SketchViewModel:', errorMessage);
      this.$message.error(`Erro ao inicializar ferramentas de desenho: ${errorMessage}`);
      // Permitir continuar sem o SketchViewModel
      this.sketchViewModelReady = true;
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

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .loading-spinner {
    font-size: 32px;
    color: $primary-color;
    margin-bottom: $spacing-medium;
  }

  .loading-text {
    font-size: $font-size-medium;
    color: $text-primary;
  }
}

.loading-time {
  margin-top: 10px;
  font-size: 14px;
  color: $text-secondary;
}

.loading-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
