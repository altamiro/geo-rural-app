/* eslint-disable no-unused-vars */

import { loadEsriModules } from "@/utils/esri-loader-config";
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
    try {
      // Verificação para prevenir processamento recursivo
      if (state._processingMunicipality) return;
      commit("SET_PROCESSING_MUNICIPALITY", true);

      // Adicione um timeout de segurança em caso de falha
      const timeoutId = setTimeout(() => {
        commit("SET_PROCESSING_MUNICIPALITY", false);
      }, 10000); // 10 segundos

      // Adicione setTimeout para quebrar possível recursão
      setTimeout(async () => {
        try {
          // Se não há geometria, retornar
          if (
            !geometry ||
            !geometry.coordinates ||
            !Array.isArray(geometry.coordinates) ||
            !Array.isArray(geometry.coordinates[0])
          ) {
            console.error("Geometria do município inválida");
            clearTimeout(timeoutId);
            commit("SET_PROCESSING_MUNICIPALITY", false);
            return;
          }

          // Se não há mapa ou view inicializados, retornar
          if (!state.map || !state.view) {
            console.error("Mapa ou view não inicializados");
            return;
          }

          // Se já existir uma camada de município, remover
          if (state.municipalityLayer) {
            state.map.remove(state.municipalityLayer);
          }

          const [Graphic, GraphicsLayer] = await loadEsriModules([
            "esri/Graphic",
            "esri/layers/GraphicsLayer",
          ]);

          // Criar camada para o município
          const municipalityLayer = new GraphicsLayer({
            id: "municipalityLayer",
            title: "Limite do Município",
          });

          // Criar símbolo para o município
          const symbol = {
            type: "simple-fill",
            color: [0, 0, 255, 0.1], // Azul transparente
            outline: {
              color: [0, 0, 255, 0.7],
              width: 2,
            },
          };

          // Converter a geometria do GeoJSON para formato Esri
          // Dependendo da estrutura, você pode precisar converter o sistema de coordenadas
          const municipalityGraphic = new Graphic({
            geometry: {
              type: "polygon",
              rings: geometry.coordinates[0],
            },
            symbol: symbol,
            attributes: {
              name: "Limite do Município",
            },
          });

          // Adicionar gráfico à camada
          municipalityLayer.add(municipalityGraphic);

          // Adicionar camada ao mapa
          state.map.add(municipalityLayer);

          // Fazer zoom para o município
          state.view.goTo({
            target: municipalityGraphic.geometry,
            zoom: 10, // Ajuste o zoom conforme necessário
          });

          // Salvar referência da camada
          commit("SET_MUNICIPALITY_LAYER", municipalityLayer);
        } finally {
          clearTimeout(timeoutId);
          commit("SET_PROCESSING_MUNICIPALITY", false);
        }
      }, 0);
      return true;
    } catch (error) {
      commit("SET_PROCESSING_MUNICIPALITY", false);
      console.error("Erro ao adicionar camada de município:", error);
      commit("SET_ERROR", "Erro ao adicionar camada de município: " + error.message);
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
