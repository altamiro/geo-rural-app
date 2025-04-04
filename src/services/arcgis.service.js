/**
 * Serviço para funções específicas do ArcGIS Maps SDK
 * Centraliza o carregamento de módulos e funções comuns
 */
import { loadModules } from 'esri-loader'
import { INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM } from '@/utils/constants'

class ArcGISService {
  /**
   * Inicializa um novo mapa ArcGIS com camadas básicas
   * @param {String} containerId - ID do elemento HTML para o mapa
   * @returns {Promise<Object>} - Objetos do mapa inicializado
   */
  async initializeMap(containerId) {
    try {
      const [Map, MapView, GraphicsLayer, BasemapGallery, Expand] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/BasemapGallery",
        "esri/widgets/Expand"
      ])

      // Criar camada de gráficos
      const graphicsLayer = new GraphicsLayer()

      // Criar mapa
      const map = new Map({
        basemap: "satellite",
        layers: [graphicsLayer]
      })

      // Criar view do mapa
      const view = new MapView({
        container: containerId,
        map: map,
        center: INITIAL_MAP_CENTER,
        zoom: INITIAL_MAP_ZOOM
      })

      // Adicionar galeria de mapas base
      const basemapGallery = new BasemapGallery({
        view: view
      })

      // Colocar galeria em um widget de expansão
      const bgExpand = new Expand({
        view: view,
        content: basemapGallery,
        expandIconClass: "esri-icon-basemap"
      })

      view.ui.add(bgExpand, "top-right")

      return {
        map,
        view,
        graphicsLayer,
        basemapGallery
      }
    } catch (error) {
      console.error("Erro ao inicializar mapa:", error)
      throw error
    }
  }

  /**
   * Inicializa o modelo para ferramentas de desenho
   * @param {Object} view - View do mapa ArcGIS
   * @param {Object} layer - Camada para desenho
   * @returns {Promise<Object>} - Modelo de desenho inicializado
   */
  async initializeSketchViewModel(view, layer) {
    try {
      const [SketchViewModel] = await loadModules([
        "esri/widgets/Sketch/SketchViewModel"
      ])

      const sketchViewModel = new SketchViewModel({
        view: view,
        layer: layer,
        defaultCreateOptions: {
          mode: "freehand"
        }
      })

      return sketchViewModel
    } catch (error) {
      console.error("Erro ao inicializar SketchViewModel:", error)
      throw error
    }
  }

  /**
   * Cria um gráfico para exibir no mapa
   * @param {Object} geometry - Geometria Esri
   * @param {Object} symbol - Símbolo para renderização
   * @param {Object} attributes - Atributos do gráfico
   * @returns {Promise<Object>} - Objeto Graphic criado
   */
  async createGraphic(geometry, symbol, attributes = {}) {
    try {
      const [Graphic] = await loadModules(["esri/Graphic"])

      return new Graphic({
        geometry,
        symbol,
        attributes
      })
    } catch (error) {
      console.error("Erro ao criar gráfico:", error)
      throw error
    }
  }

  /**
   * Cria símbolos para diferentes tipos de geometria
   * @param {String} type - Tipo de geometria (point, polyline, polygon)
   * @param {Array} color - Cor RGBA [r, g, b, a]
   * @returns {Promise<Object>} - Símbolo criado
   */
  async createSymbol(type, color) {
    try {
      let symbolModule
      let symbolOptions = {}

      switch (type) {
        case 'point':
          symbolModule = "esri/symbols/SimpleMarkerSymbol"
          symbolOptions = {
            style: "circle",
            color: color,
            size: "8px",
            outline: {
              color: [color[0], color[1], color[2], 1],
              width: 1
            }
          }
          break

        case 'polyline':
          symbolModule = "esri/symbols/SimpleLineSymbol"
          symbolOptions = {
            color: color,
            width: 2
          }
          break

        case 'polygon':
          symbolModule = "esri/symbols/SimpleFillSymbol"
          symbolOptions = {
            color: color,
            outline: {
              color: [color[0], color[1], color[2], 1],
              width: 1
            }
          }
          break

        default:
          throw new Error(`Tipo de símbolo não suportado: ${type}`)
      }

      const [Symbol] = await loadModules([symbolModule])
      return new Symbol(symbolOptions)
    } catch (error) {
      console.error(`Erro ao criar símbolo ${type}:`, error)
      throw error
    }
  }
}

export default new ArcGISService()
