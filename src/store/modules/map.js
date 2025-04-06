/* eslint-disable no-unused-vars */

import { loadEsriModules, ensureArcGISLoaded } from "@/utils/esri-loader-config";
import { INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM } from "@/utils/constants";

// Initial state
const state = {
  map: null,
  view: null,
  basemapGallery: null,
  graphicsLayer: null,
  municipalityLayer: null,
  sketchViewModel: null,
  selectedBasemap: "satellite",
  mapInitialized: false,
  sketchViewModelReady: false,
  loading: false,
  error: null,
};

// Getters
const getters = {
  isMapInitialized: (state) => state.mapInitialized,
  isSketchViewModelReady: (state) => state.sketchViewModelReady && state.sketchViewModel !== null,
};

// Actions
const actions = {
  async addMunicipalityLayer({ state, commit }, geometry) {
    // Verificar primeiro se o mapa e a view existem
    if (!state.map || !state.view) {
      console.error("Mapa ou view não inicializados");
      return false;
    }

    // Garantir que a view está pronta antes de adicionar camadas
    try {
      await state.view.when();
    } catch (error) {
      console.error("Erro ao aguardar a inicialização da view:", error);
      return false;
    }

    try {
      // Verificar se já está processando para evitar recursão
      if (state._processingMunicipality) {
        console.log("Já está processando município, ignorando chamada");
        return false;
      }

      commit("SET_PROCESSING_MUNICIPALITY", true);

      // Garantir que a API está carregada
      await ensureArcGISLoaded();

      // Importante: definir um timeout para garantir que o flag será resetado
      const safetyTimeout = setTimeout(() => {
        commit("SET_PROCESSING_MUNICIPALITY", false);
      }, 5000);

      try {
        // Validar a geometria antes de qualquer processamento
        if (
          !geometry ||
          !geometry.coordinates ||
          !Array.isArray(geometry.coordinates) ||
          geometry.coordinates.length === 0 ||
          !Array.isArray(geometry.coordinates[0])
        ) {
          console.error("Geometria do município inválida", geometry);
          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return false;
        }

        // Se não há mapa ou view inicializados, retornar
        if (!state.map || !state.view) {
          console.error("Mapa ou view não inicializados");
          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return false;
        }

        // Se já existir uma camada de município, remover
        if (state.municipalityLayer) {
          state.map.remove(state.municipalityLayer);
        }

        // Carregar módulos de forma segura
        let Graphic, GraphicsLayer;
        try {
          [Graphic, GraphicsLayer] = await loadEsriModules([
            "esri/Graphic",
            "esri/layers/GraphicsLayer",
          ]);
        } catch (loadError) {
          console.error("Erro ao carregar módulos ArcGIS", loadError);
          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return false;
        }

        // Criar camada para o município
        const municipalityLayer = new GraphicsLayer({
          id: "municipalityLayer",
          title: "Limite do Município",
        });

        // Criar símbolo para o município
        const symbol = {
          type: "simple-fill",
          color: [0, 0, 255, 0.1],
          outline: {
            color: [0, 0, 255, 0.7],
            width: 2,
          },
        };

        // Converter coordenadas de forma segura
        let rings;
        try {
          // Certifique-se de que estamos trabalhando com um array de coordenadas válido
          rings = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : [];

          // Verificar se as coordenadas são válidas (pelo menos 3 pontos para um polígono)
          if (rings.length < 3) {
            throw new Error("Número insuficiente de coordenadas para formar um polígono");
          }
        } catch (error) {
          console.error("Erro ao processar coordenadas", error);
          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return false;
        }

        // Criar o graphic com verificação de erros
        let municipalityGraphic;
        try {
          municipalityGraphic = new Graphic({
            geometry: {
              type: "polygon",
              rings: rings,
            },
            symbol: symbol,
            attributes: {
              name: "Limite do Município",
            },
          });
        } catch (graphicError) {
          console.error("Erro ao criar gráfico do município", graphicError);
          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return false;
        }

        // Adicionar gráfico à camada
        try {
          municipalityLayer.add(municipalityGraphic);

          // Adicionar camada ao mapa
          state.map.add(municipalityLayer);

          // Fazer zoom para o município com timeout para segurança
          try {
            state.view.goTo(
              {
                target: municipalityGraphic.geometry,
                zoom: 10,
              },
              {
                duration: 1000,
                easing: "ease-in-out",
              }
            );
          } catch (zoomError) {
            console.warn("Erro ao fazer zoom para município", zoomError);
            // Continuar mesmo com erro de zoom
          }

          // Salvar referência da camada
          commit("SET_MUNICIPALITY_LAYER", municipalityLayer);

          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return true;
        } catch (finalError) {
          console.error("Erro ao adicionar camada ao mapa", finalError);
          clearTimeout(safetyTimeout);
          commit("SET_PROCESSING_MUNICIPALITY", false);
          return false;
        }
      } catch (mainError) {
        console.error("Erro principal no processamento do município", mainError);
        clearTimeout(safetyTimeout);
        commit("SET_PROCESSING_MUNICIPALITY", false);
        return false;
      }
    } catch (outerError) {
      console.error("Erro externo no processamento do município", outerError);
      commit("SET_PROCESSING_MUNICIPALITY", false);
      return false;
    }
  },

  /**
   * Initialize the map and related components
   * @param {Object} context - Vuex context
   * @param {String} containerId - DOM container ID for the map
   */
  async initializeMap({ commit, state }, containerId) {
    try {
      commit("SET_LOADING", true);

      // Load required modules
      const [Map, MapView, GraphicsLayer, BasemapGallery, Expand] = await loadEsriModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/BasemapGallery",
        "esri/widgets/Expand",
      ]);

      // Create graphics layer
      const graphicsLayer = new GraphicsLayer();

      // Create map
      const map = new Map({
        basemap: state.selectedBasemap,
        layers: [graphicsLayer],
      });

      // Create map view
      const view = new MapView({
        container: containerId,
        map: map,
        center: INITIAL_MAP_CENTER,
        zoom: INITIAL_MAP_ZOOM,
      });

      // Create basemap gallery
      const basemapGallery = new BasemapGallery({
        view: view,
      });

      // Place basemap gallery in an expand widget
      const bgExpand = new Expand({
        view: view,
        content: basemapGallery,
        expandIconClass: "esri-icon-basemap",
      });

      view.ui.add(bgExpand, "top-right");

      // Store references
      commit("SET_MAP", map);
      commit("SET_VIEW", view);
      commit("SET_BASEMAP_GALLERY", basemapGallery);
      commit("SET_GRAPHICS_LAYER", graphicsLayer);

      commit("SET_LOADING", false);
      return { map, view, graphicsLayer };
    } catch (error) {
      console.error("Error initializing map:", error);
      commit("SET_ERROR", "Erro ao inicializar o mapa: " + error.message);
      commit("SET_LOADING", false);
      return null;
    }
  },

  /**
   * Set the sketch view model
   * @param {Object} context - Vuex context
   * @param {Object} sketchViewModel - SketchViewModel instance
   */
  SET_SKETCH_VIEW_MODEL({ commit, state }, sketchViewModel) {
    if (!sketchViewModel) {
      console.error("Tentativa de definir um SketchViewModel nulo ou indefinido");
      return;
    }

    commit("SET_SKETCH_VIEW_MODEL", sketchViewModel);
    commit("SET_SKETCH_VIEW_MODEL_READY", true);

    // Log para debug
    console.log("SketchViewModel armazenado no Vuex com sucesso");
  },

  /**
   * Inicializa o estado do mapa
   * @param {Object} context - Vuex context
   */
  setMapInitialized({ commit }) {
    commit("SET_MAP_INITIALIZED", true);
  },

  /**
   * Change the basemap
   * @param {Object} context - Vuex context
   * @param {String} basemapId - Basemap ID
   */
  changeBasemap({ commit, state }, basemapId) {
    if (state.map) {
      state.map.basemap = basemapId;
      commit("SET_SELECTED_BASEMAP", basemapId);
    }
  },

  /**
   * Clear all graphics from the map
   * @param {Object} context - Vuex context
   */
  clearGraphics({ state }) {
    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll();
    }
  },

  /**
   * Add a graphic to the map
   * @param {Object} context - Vuex context
   * @param {Object} graphic - Esri Graphic object
   */
  addGraphic({ state }, graphic) {
    if (state.graphicsLayer) {
      state.graphicsLayer.add(graphic);
    }
  },

  /**
   * Remove a specific graphic from the map
   * @param {Object} context - Vuex context
   * @param {Object} graphic - Esri Graphic object
   */
  removeGraphic({ state }, graphic) {
    if (state.graphicsLayer) {
      state.graphicsLayer.remove(graphic);
    }
  },

  /**
   * Zoom to a specific geometry
   * @param {Object} context - Vuex context
   * @param {String} layerId - Layer ID to zoom to
   */
  zoomToGeometry({ state, rootState }, layerId) {
    if (!state.view) return;

    // Get the geometry from the layers store
    const geometry = rootState.layers.layerGeometries[layerId];

    if (geometry) {
      state.view.goTo(geometry);
    }
  },

  /**
   * Zoom to the extent of all graphics
   * @param {Object} context - Vuex context
   */
  zoomToAllGraphics({ state }) {
    if (state.view && state.graphicsLayer && state.graphicsLayer.graphics.length > 0) {
      state.view.goTo(state.graphicsLayer.graphics.toArray());
    }
  },
};

// Mutations
const mutations = {
  SET_MAP_INITIALIZED(state, status) {
    state.mapInitialized = status;
  },

  SET_SKETCH_VIEW_MODEL_READY(state, status) {
    state.sketchViewModelReady = status;
  },

  SET_LOADING(state, loading) {
    state.loading = loading;
  },

  SET_ERROR(state, error) {
    state.error = error;
  },

  SET_MAP(state, map) {
    state.map = map;
  },

  SET_VIEW(state, view) {
    state.view = view;
  },

  SET_BASEMAP_GALLERY(state, basemapGallery) {
    state.basemapGallery = basemapGallery;
  },

  SET_GRAPHICS_LAYER(state, graphicsLayer) {
    state.graphicsLayer = graphicsLayer;
  },

  SET_SKETCH_VIEW_MODEL(state, sketchViewModel) {
    state.sketchViewModel = sketchViewModel;
  },

  SET_SELECTED_BASEMAP(state, basemapId) {
    state.selectedBasemap = basemapId;
  },

  SET_MUNICIPALITY_LAYER(state, layer) {
    state.municipalityLayer = layer;
  },

  SET_PROCESSING_MUNICIPALITY(state, status) {
    state._processingMunicipality = status;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
