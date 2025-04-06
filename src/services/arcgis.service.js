/**
 * Serviço para funções específicas do ArcGIS Maps SDK
 * Centraliza as funções comuns usando importações locais
 */
import { INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM } from "@/utils/constants";

// Importações diretas dos módulos necessários
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Expand from "@arcgis/core/widgets/Expand";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Graphic from "@arcgis/core/Graphic";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Locator from "@arcgis/core/tasks/Locator";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

class ArcGISService {
  /**
   * Inicializa um novo mapa ArcGIS com camadas básicas
   * @param {String} containerId - ID do elemento HTML para o mapa
   * @returns {Promise<Object>} - Objetos do mapa inicializado
   */
  async initializeMap(containerId) {
    try {
      // Verificar se o container existe
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container #${containerId} não encontrado`);
      }

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

      // Vamos verificar se a view foi criada corretamente
      if (!view) {
        throw new Error("Falha ao criar a MapView");
      }

      // Adicionar galeria de mapas base
      let basemapGallery = null;
      try {
        basemapGallery = new BasemapGallery({
          view: view,
        });

        // Colocar galeria em um widget de expansão
        const bgExpand = new Expand({
          view: view,
          content: basemapGallery,
          expandIconClass: "esri-icon-basemap",
        });

        view.ui.add(bgExpand, "top-right");
      } catch (widgetError) {
        console.warn("Erro ao adicionar galeria de mapas base:", widgetError);
        // Continuar mesmo sem a galeria
      }

      // Garantir que os objetos essenciais estão disponíveis
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
  async initializeSketchViewModel(view, layer) {
    // Adicionar proteção contra chamadas com parâmetros inválidos
    if (!view || !layer) {
      console.error("View ou layer inválidos para SketchViewModel");
      return null;
    }

    try {
      // Verificar se a view foi inicializada
      if (!view.ready) {
        await view.when();
      }

      // Criar com configuração mínima para evitar problemas
      const sketchViewModel = new SketchViewModel({
        view: view,
        layer: layer,
        // Configurações básicas para evitar complexidade
        defaultCreateOptions: {
          mode: "click",
        },
        updateOnGraphicClick: false,
        defaultUpdateOptions: {
          toggleToolOnClick: false,
        },
      });

      return sketchViewModel;
    } catch (error) {
      console.error("Erro ao inicializar SketchViewModel:", error);
      return null;
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

      let Symbol;
      let symbolOptions = {};

      switch (type) {
        case "point":
          Symbol = SimpleMarkerSymbol;
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
          Symbol = SimpleLineSymbol;
          symbolOptions = {
            color: color,
            width: 2,
          };
          break;

        case "polygon":
          Symbol = SimpleFillSymbol;
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
