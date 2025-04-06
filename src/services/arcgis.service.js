/**
 * Serviço para funções específicas do ArcGIS Maps SDK
 * Centraliza o carregamento de módulos e funções comuns
 */
import { loadEsriModules } from "@/utils/esri-loader-config";
import { INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM } from "@/utils/constants";

class ArcGISService {
  /**
   * Inicializa um novo mapa ArcGIS com camadas básicas
   * @param {String} containerId - ID do elemento HTML para o mapa
   * @returns {Promise<Object>} - Objetos do mapa inicializado
   */
  async initializeMap(containerId) {
    try {
      const [Map, MapView, GraphicsLayer, BasemapGallery, Expand] = await loadEsriModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/BasemapGallery",
        "esri/widgets/Expand",
      ]);

      // Criar camada de gráficos
      const graphicsLayer = new GraphicsLayer();

      // Criar mapa
      const map = new Map({
        basemap: "satellite",
        layers: [graphicsLayer],
      });

      // Criar view do mapa
      const view = new MapView({
        container: containerId,
        map: map,
        center: INITIAL_MAP_CENTER,
        zoom: INITIAL_MAP_ZOOM,
      });

      // Adicionar galeria de mapas base
      const basemapGallery = new BasemapGallery({
        view: view,
      });

      // Colocar galeria em um widget de expansão
      const bgExpand = new Expand({
        view: view,
        content: basemapGallery,
        expandIconClass: "esri-icon-basemap",
      });

      view.ui.add(bgExpand, "top-right");

      return {
        map,
        view,
        graphicsLayer,
        basemapGallery,
      };
    } catch (error) {
      console.error("Erro ao inicializar mapa:", error);
      throw error;
    }
  }

  /**
   * Inicializa o modelo para ferramentas de desenho
   * @param {Object} view - View do mapa ArcGIS
   * @param {Object} layer - Camada para desenho
   * @returns {Promise<Object>} - Modelo de desenho inicializado
   */
  // Modificar em src/services/arcgis.service.js
  async initializeSketchViewModel(view, layer) {
    try {
      if (!view) {
        throw new Error("View não definida para SketchViewModel");
      }

      if (!layer) {
        throw new Error("Layer não definida para SketchViewModel");
      }

      // Verificar se a view foi inicializada completamente
      if (view.ready !== true) {
        console.log("View ainda não está pronta. Aguardando...");
        await view.when();
      }

      // Carregar o módulo SketchViewModel
      const [SketchViewModel] = await loadEsriModules(["esri/widgets/Sketch/SketchViewModel"]);

      // Criar o SketchViewModel com configurações simplificadas inicialmente
      const sketchViewModel = new SketchViewModel({
        view: view,
        layer: layer,
        // Usar configurações mínimas para evitar problemas
        defaultCreateOptions: {
          mode: "click", // Modo mais simples em vez de freehand
        },
      });

      // Validar que o SketchViewModel foi criado corretamente
      if (!sketchViewModel) {
        throw new Error("Falha ao criar SketchViewModel");
      }

      // Adicionar manipuladores de eventos básicos para monitorar problemas
      sketchViewModel.on("create-error", (error) => {
        console.error("Erro durante a criação:", error);
      });

      console.log("SketchViewModel inicializado com sucesso");

      // Retornar o modelo apenas quando estiver realmente pronto
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(sketchViewModel);
        }, 100); // Pequeno atraso para garantir inicialização completa
      });
    } catch (error) {
      console.error("Erro ao inicializar SketchViewModel:", error);
      throw error;
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
      if (!geometry) {
        throw new Error("Geometria não definida para createGraphic");
      }

      const [Graphic] = await loadEsriModules(["esri/Graphic"]);

      return new Graphic({
        geometry,
        symbol,
        attributes,
      });
    } catch (error) {
      console.error("Erro ao criar gráfico:", error);
      throw error;
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
      if (!type) {
        throw new Error("Tipo de símbolo não definido");
      }

      if (!color || !Array.isArray(color) || color.length !== 4) {
        // Fallback para cor padrão se não receber uma cor válida
        color = [128, 128, 128, 0.5];
      }

      let symbolModule;
      let symbolOptions = {};

      switch (type) {
        case "point":
          symbolModule = "esri/symbols/SimpleMarkerSymbol";
          symbolOptions = {
            style: "circle",
            color: color,
            size: "8px",
            outline: {
              color: [color[0], color[1], color[2], 1],
              width: 1,
            },
          };
          break;

        case "polyline":
          symbolModule = "esri/symbols/SimpleLineSymbol";
          symbolOptions = {
            color: color,
            width: 2,
          };
          break;

        case "polygon":
          symbolModule = "esri/symbols/SimpleFillSymbol";
          symbolOptions = {
            color: color,
            outline: {
              color: [color[0], color[1], color[2], 1],
              width: 1,
            },
          };
          break;

        default:
          throw new Error(`Tipo de símbolo não suportado: ${type}`);
      }

      const [Symbol] = await loadEsriModules([symbolModule]);
      return new Symbol(symbolOptions);
    } catch (error) {
      console.error(`Erro ao criar símbolo ${type}:`, error);
      throw error;
    }
  }

  /**
   * Valida se um ponto está dentro de um polígono
   * @param {Object} point - Ponto a ser verificado
   * @param {Object} polygon - Polígono de referência
   * @returns {Promise<Boolean>} - Se o ponto está dentro do polígono
   */
  async isPointInPolygon(point, polygon) {
    try {
      if (!point || !polygon) {
        throw new Error("Ponto ou polígono não definidos");
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"]);
      return geometryEngine.contains(polygon, point);
    } catch (error) {
      console.error("Erro ao verificar ponto no polígono:", error);
      return false;
    }
  }

  /**
   * Busca localização usando o serviço de geocodificação ArcGIS
   * @param {String} searchText - Texto de busca
   * @returns {Promise<Array>} - Lista de resultados encontrados
   */
  async searchLocation(searchText) {
    try {
      if (!searchText) {
        return [];
      }

      const [Locator] = await loadEsriModules(["esri/tasks/Locator"]);

      const locator = new Locator({
        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      });

      const params = {
        address: {
          SingleLine: searchText,
        },
        outFields: ["*"],
        maxLocations: 5,
      };

      const results = await locator.addressToLocations(params);
      return results;
    } catch (error) {
      console.error("Erro ao buscar localização:", error);
      return [];
    }
  }
}

export default new ArcGISService();
