<template lang="pug">
  .map-container
    #mapView
    .scale-info
      .scale-label Escala
      .scale 100 km
    .coordinates-info
      .coordinate
        .coordinate-label Longitude:
        .coordinate-value {{longitude}}
      .coordinate
        .coordinate-label Latitude:
        .coordinate-value {{latitude}}
    .map-tools-row
      .map-tool-button(@click="activateTool('layers')")
        el-tooltip(content="Camadas" placement="top")
          i.el-icon-menu
      .map-tool-button(@click="activateTool('measure')")
        el-tooltip(content="Medir" placement="top")
          i.el-icon-crop
      .map-tool-button(@click="activateTool('location')")
        el-tooltip(content="Minha localização" placement="top")
          i.el-icon-location
      .map-tool-button(@click="activateTool('search')")
        el-tooltip(content="Buscar" placement="top")
          i.el-icon-search
      .map-tool-button(@click="activateTool('zoom-in')")
        el-tooltip(content="Zoom +" placement="top")
          i.el-icon-zoom-in
</template>

<script>
import { mapActions, mapMutations, mapState } from 'vuex'
import { isValidCoordinate } from '@/utils/validation'
import { LAYER_TYPES, MESSAGES, GEOMETRY_TYPES } from '@/utils/constants'
import ArcGISService from '@/services/arcgis.service'
import CalculationService from '@/services/calculation.service'

export default {
  name: 'MapContainer',
  props: {
    selectedLayer: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      map: null,
      view: null,
      graphicsLayer: null,
      sketchViewModel: null,
      longitude: "+180.000000",
      latitude: "+90.000000",
      activeTool: null,
      propertyGraphic: null
    }
  },
  computed: {
    ...mapState({
      municipality: state => state.property.municipality,
      propertyPolygon: state => state.property.propertyPolygon
    })
  },
  mounted() {
    this.initializeMap()
  },
  methods: {
    ...mapMutations({
      SET_PROPERTY_POLYGON: 'property/SET_PROPERTY_POLYGON',
      SET_PROPERTY_AREA: 'property/SET_PROPERTY_AREA'
    }),
    ...mapActions({
      validatePropertyLocation: 'property/validatePropertyLocation',
      calculateAreas: 'property/calculateAreas',
      storeSketchViewModel: 'map/SET_SKETCH_VIEW_MODEL'
    }),
    async initializeMap() {
      try {
        // Usar o serviço para inicializar o mapa
        const mapObjects = await ArcGISService.initializeMap('mapView')

        // Armazenar referências aos objetos do mapa
        this.map = mapObjects.map
        this.view = mapObjects.view
        this.graphicsLayer = mapObjects.graphicsLayer

        // Inicializar o modelo de desenho
        this.sketchViewModel = await ArcGISService.initializeSketchViewModel(this.view, this.graphicsLayer)

        // Armazenar o SketchViewModel no store
        this.storeSketchViewModel(this.sketchViewModel)

        // Configurar eventos do mapa
        this.setupMapEvents()

        // Inicialização concluída
        this.$emit('map-initialized')
      } catch (error) {
        console.error("Erro ao inicializar mapa:", error)
        this.$message.error("Não foi possível inicializar o mapa")
      }
    },

    setupMapEvents() {
      // Evento de movimento do ponteiro para atualizar coordenadas
      this.view.on("pointer-move", (event) => {
        const point = this.view.toMap({ x: event.x, y: event.y })
        if (point && isValidCoordinate(point.longitude, point.latitude)) {
          this.longitude = point.longitude.toFixed(6)
          this.latitude = point.latitude.toFixed(6)
        }
      })

      // Eventos do modelo de desenho
      if (this.sketchViewModel) {
        this.sketchViewModel.on("create", (event) => {
          if (event.state === "complete") {
            this.handleDrawComplete(event.graphic, event.tool)
          }
        })
      }
    },

    handleDrawComplete(graphic) {
      if (!graphic || !graphic.geometry) return

      const layerType = this.selectedLayer

      if (layerType === LAYER_TYPES.PROPERTY) {
        this.handlePropertyDraw(graphic.geometry)
      } else if (layerType && this.propertyPolygon) {
        this.handleLayerDraw(graphic, layerType)
      }
    },

    async handlePropertyDraw(geometry) {
      try {
        // Validar se a propriedade está dentro do município selecionado
        const isValid = await this.validatePropertyLocation(geometry)

        if (isValid) {
          // Armazenar a geometria da propriedade
          this.SET_PROPERTY_POLYGON(geometry)

          // Calcular a área em hectares usando o serviço de cálculo
          const area = await CalculationService.calculateArea(geometry)
          this.SET_PROPERTY_AREA(area)

          // Emitir evento de que a propriedade foi desenhada
          this.$emit('property-drawn')
        } else {
          // Remover o gráfico inválido e mostrar erro
          if (this.propertyGraphic) {
            this.graphicsLayer.remove(this.propertyGraphic)
          }
          this.$message.error(MESSAGES.INVALID_LOCATION)
        }
      } catch (error) {
        console.error("Erro ao processar desenho da propriedade:", error)
        this.$message.error("Ocorreu um erro ao processar a área desenhada")
      }
    },

    async handleLayerDraw(graphic, layerType) {
      try {
        const geometry = graphic.geometry

        // Validar camada com base nas regras específicas
        let isValid = true
        let errorMessage = ''

        // Usar cálculos para verificar relações espaciais
        switch (layerType) {
          case LAYER_TYPES.HEADQUARTERS: {
            // Verificar se a sede está dentro da propriedade
            const hqOverlap = await CalculationService.calculateOverlap(
              geometry,
              this.propertyPolygon
            )

            if (!hqOverlap.hasOverlap) {
              isValid = false
              errorMessage = MESSAGES.HEADQUARTERS_INSIDE
            }
            break
          }

          case LAYER_TYPES.CONSOLIDATED:
          case LAYER_TYPES.NATIVE:
          case LAYER_TYPES.FALLOW: {
            // Verificar se a camada está dentro da propriedade
            const layerOverlap = await CalculationService.calculateOverlap(
              geometry,
              this.propertyPolygon
            )

            if (!layerOverlap.hasOverlap) {
              isValid = false
              errorMessage = MESSAGES.LAYER_INSIDE
            }
            break
          }

          // Validações adicionais para outros tipos de camada
          // ...
        }

        if (!isValid) {
          // Remover o gráfico inválido e mostrar erro
          this.graphicsLayer.remove(graphic)
          this.$message.error(errorMessage)
          return
        }

        // Se for válido, armazenar a camada e recalcular áreas
        // Adicionar a camada via Vuex
        this.$store.dispatch('layers/addLayer', {
          id: layerType,
          name: this.getLayerName(layerType),
          category: this.getLayerCategory(layerType),
          geometry,
          symbolType: 'default'
        }).then(result => {
          if (result.success) {
            this.$message.success(result.message)
          } else {
            this.$message.error(result.message)
          }
        })

        // Recalcular áreas
        this.calculateAreas()

      } catch (error) {
        console.error(`Erro ao processar camada ${layerType}:`, error)
        this.$message.error("Ocorreu um erro ao processar a camada desenhada")
      }
    },

    activateTool(tool) {
      this.activeTool = tool

      switch (tool) {
        case 'layers':
          // Mostrar menu de camadas
          this.$emit('toggle-layer-panel')
          break

        case 'measure':
          // Ativar ferramenta de medição
          // Implementar medição utilizando ArcGISService
          break

        case 'location':
          // Ir para localização do usuário
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              position => {
                this.view.goTo({
                  center: [position.coords.longitude, position.coords.latitude],
                  zoom: 14
                })
              },
              error => {
                console.error('Erro ao obter localização:', error)
                this.$message.error('Não foi possível obter sua localização.')
              },
              { enableHighAccuracy: true }
            )
          } else {
            this.$message.error('Geolocalização não é suportada pelo seu navegador.')
          }
          break

        case 'search':
          // Mostrar diálogo de busca
          this.$emit('show-search')
          break

        case 'zoom-in':
          // Aumentar zoom
          if (this.view) {
            this.view.zoom += 1
          }
          break
      }
    },

    startDrawing(layerType) {
      if (!layerType) {
        this.$message.warning('Selecione uma camada para desenhar.')
        return
      }

      if (!this.propertyPolygon && layerType !== LAYER_TYPES.PROPERTY) {
        this.$message.warning(MESSAGES.PROPERTY_REQUIRED)
        return
      }

      // Definir a ferramenta de desenho apropriada com base na camada
      let geometryType = GEOMETRY_TYPES.POLYGON
      if (layerType === LAYER_TYPES.HEADQUARTERS) {
        geometryType = GEOMETRY_TYPES.POINT
      }

      // Verificar se temos o SketchViewModel
      if (!this.sketchViewModel) {
        this.$message.error("Ferramentas de desenho não inicializadas corretamente.")
        return
      }

      // Usar o SketchViewModel para iniciar o desenho
      this.sketchViewModel.create(geometryType)

      // Criar e aplicar símbolos personalizados para o desenho
      try {
        const symbolColor = this.getSymbolColorForLayer(layerType)
        ArcGISService.createSymbol(
          geometryType === GEOMETRY_TYPES.POINT ? 'point' : 'polygon',
          symbolColor
        ).then(symbol => {
          // Aplicar o símbolo às opções de criação
          this.sketchViewModel.updateCreateOptions({
            polylineSymbol: symbol,
            polygonSymbol: symbol,
            pointSymbol: symbol
          })
        })
      } catch (error) {
        console.error("Erro ao criar símbolo:", error)
      }
    },

    getSymbolColorForLayer(layerType) {
      // Cores baseadas no tipo de camada (poderia vir do store)
      const colors = {
        [LAYER_TYPES.PROPERTY]: [0, 0, 255, 0.5],
        [LAYER_TYPES.HEADQUARTERS]: [255, 0, 0, 1],
        [LAYER_TYPES.CONSOLIDATED]: [255, 255, 0, 0.5],
        [LAYER_TYPES.NATIVE]: [0, 128, 0, 0.5],
        [LAYER_TYPES.FALLOW]: [165, 42, 42, 0.5],
        [LAYER_TYPES.ROADWAY]: [128, 128, 128, 0.5],
        [LAYER_TYPES.RAILWAY]: [0, 0, 0, 0.5],
        [LAYER_TYPES.POWERLINE]: [255, 165, 0, 0.5],
        [LAYER_TYPES.PPA]: [0, 255, 255, 0.5],
        [LAYER_TYPES.RESTRICTED]: [255, 0, 255, 0.5],
        [LAYER_TYPES.RESERVE]: [50, 205, 50, 0.5]
      }

      return colors[layerType] || [128, 128, 128, 0.5]
    },

    getLayerName(layerType) {
      const layerNames = {
        [LAYER_TYPES.PROPERTY]: 'Área do Imóvel',
        [LAYER_TYPES.HEADQUARTERS]: 'Sede do Imóvel',
        [LAYER_TYPES.CONSOLIDATED]: 'Área Consolidada',
        [LAYER_TYPES.NATIVE]: 'Vegetação Nativa',
        [LAYER_TYPES.FALLOW]: 'Área de Pousio',
        [LAYER_TYPES.ROADWAY]: 'Rodovia',
        [LAYER_TYPES.RAILWAY]: 'Ferrovia',
        [LAYER_TYPES.POWERLINE]: 'Linha de Transmissão',
        [LAYER_TYPES.PPA]: 'Área de Preservação Permanente',
        [LAYER_TYPES.RESTRICTED]: 'Uso Restrito',
        [LAYER_TYPES.RESERVE]: 'Reserva Legal'
      }
      return layerNames[layerType] || layerType
    },

    getLayerCategory(layerType) {
      // Mapear tipos de camada para categorias
      const categoryMap = {
        [LAYER_TYPES.PROPERTY]: 'property',
        [LAYER_TYPES.HEADQUARTERS]: 'property',
        [LAYER_TYPES.CONSOLIDATED]: 'soil_coverage',
        [LAYER_TYPES.NATIVE]: 'soil_coverage',
        [LAYER_TYPES.FALLOW]: 'soil_coverage',
        [LAYER_TYPES.ROADWAY]: 'administrative',
        [LAYER_TYPES.RAILWAY]: 'administrative',
        [LAYER_TYPES.POWERLINE]: 'administrative',
        [LAYER_TYPES.PPA]: 'restricted_use',
        [LAYER_TYPES.RESTRICTED]: 'restricted_use',
        [LAYER_TYPES.RESERVE]: 'legal_reserve'
      }

      return categoryMap[layerType] || 'other'
    }
  },
  watch: {
    selectedLayer(newLayer) {
      if (this.sketchViewModel && newLayer) {
        // Cancelar qualquer desenho em andamento
        this.sketchViewModel.cancel()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

#mapView {
  width: 100%;
  height: 100%;
}

.scale-info {
  position: absolute;
  bottom: $spacing-large;
  left: $spacing-large;
  background-color: rgba(255, 255, 255, 0.8);
  padding: $spacing-mini $spacing-small;
  border-radius: $border-radius-base;
  font-size: $font-size-mini;
  display: flex;
  flex-direction: column;

  .scale-label {
    font-weight: bold;
    margin-bottom: $spacing-mini;
  }

  .scale {
    border: 1px solid #000;
    width: 100px;
    text-align: center;
  }
}

.coordinates-info {
  position: absolute;
  bottom: $spacing-large;
  left: 140px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: $spacing-mini $spacing-small;
  border-radius: $border-radius-base;
  font-size: $font-size-mini;

  .coordinate {
    display: flex;

    .coordinate-label {
      font-weight: bold;
      width: 80px;
    }
  }
}

.map-tools-row {
  position: absolute;
  bottom: $spacing-large;
  right: $spacing-large;
  display: flex;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: $border-radius-base;
  overflow: hidden;

  .map-tool-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    i {
      font-size: 20px;
    }
  }
}
</style>
