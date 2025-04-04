import { loadModules } from 'esri-loader'
import { INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM } from '@/utils/constants'

// Initial state
const state = {
  map: null,
  view: null,
  basemapGallery: null,
  graphicsLayer: null,
  sketchViewModel: null,
  selectedBasemap: 'satellite',
  loading: false,
  error: null
}

// Getters
const getters = {
  isMapInitialized: state => !!state.map && !!state.view
}

// Actions
const actions = {
  /**
   * Initialize the map and related components
   * @param {Object} context - Vuex context
   * @param {String} containerId - DOM container ID for the map
   */
  async initializeMap({ commit, state }, containerId) {
    try {
      commit('SET_LOADING', true)

      // Load required modules
      const [Map, MapView, GraphicsLayer, BasemapGallery, Expand] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GraphicsLayer",
        "esri/widgets/BasemapGallery",
        "esri/widgets/Expand"
      ])

      // Create graphics layer
      const graphicsLayer = new GraphicsLayer()

      // Create map
      const map = new Map({
        basemap: state.selectedBasemap,
        layers: [graphicsLayer]
      })

      // Create map view
      const view = new MapView({
        container: containerId,
        map: map,
        center: INITIAL_MAP_CENTER,
        zoom: INITIAL_MAP_ZOOM
      })

      // Create basemap gallery
      const basemapGallery = new BasemapGallery({
        view: view
      })

      // Place basemap gallery in an expand widget
      const bgExpand = new Expand({
        view: view,
        content: basemapGallery,
        expandIconClass: "esri-icon-basemap"
      })

      view.ui.add(bgExpand, "top-right")

      // Store references
      commit('SET_MAP', map)
      commit('SET_VIEW', view)
      commit('SET_BASEMAP_GALLERY', basemapGallery)
      commit('SET_GRAPHICS_LAYER', graphicsLayer)

      commit('SET_LOADING', false)
      return { map, view, graphicsLayer }
    } catch (error) {
      console.error("Error initializing map:", error)
      commit('SET_ERROR', "Erro ao inicializar o mapa: " + error.message)
      commit('SET_LOADING', false)
      return null
    }
  },

  /**
   * Set the sketch view model
   * @param {Object} context - Vuex context
   * @param {Object} sketchViewModel - SketchViewModel instance
   */
  SET_SKETCH_VIEW_MODEL({ commit }, sketchViewModel) {
    commit('SET_SKETCH_VIEW_MODEL', sketchViewModel)
  },

  /**
   * Change the basemap
   * @param {Object} context - Vuex context
   * @param {String} basemapId - Basemap ID
   */
  changeBasemap({ commit, state }, basemapId) {
    if (state.map) {
      state.map.basemap = basemapId
      commit('SET_SELECTED_BASEMAP', basemapId)
    }
  },

  /**
   * Clear all graphics from the map
   * @param {Object} context - Vuex context
   */
  clearGraphics({ state }) {
    if (state.graphicsLayer) {
      state.graphicsLayer.removeAll()
    }
  },

  /**
   * Add a graphic to the map
   * @param {Object} context - Vuex context
   * @param {Object} graphic - Esri Graphic object
   */
  addGraphic({ state }, graphic) {
    if (state.graphicsLayer) {
      state.graphicsLayer.add(graphic)
    }
  },

  /**
   * Remove a specific graphic from the map
   * @param {Object} context - Vuex context
   * @param {Object} graphic - Esri Graphic object
   */
  removeGraphic({ state }, graphic) {
    if (state.graphicsLayer) {
      state.graphicsLayer.remove(graphic)
    }
  },

  /**
   * Zoom to a specific geometry
   * @param {Object} context - Vuex context
   * @param {String} layerId - Layer ID to zoom to
   */
  zoomToGeometry({ state, rootState }, layerId) {
    if (!state.view) return

    // Get the geometry from the layers store
    const geometry = rootState.layers.layerGeometries[layerId]

    if (geometry) {
      state.view.goTo(geometry)
    }
  },

  /**
   * Zoom to the extent of all graphics
   * @param {Object} context - Vuex context
   */
  zoomToAllGraphics({ state }) {
    if (state.view && state.graphicsLayer && state.graphicsLayer.graphics.length > 0) {
      state.view.goTo(state.graphicsLayer.graphics.toArray())
    }
  }
}

// Mutations
const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },

  SET_ERROR(state, error) {
    state.error = error
  },

  SET_MAP(state, map) {
    state.map = map
  },

  SET_VIEW(state, view) {
    state.view = view
  },

  SET_BASEMAP_GALLERY(state, basemapGallery) {
    state.basemapGallery = basemapGallery
  },

  SET_GRAPHICS_LAYER(state, graphicsLayer) {
    state.graphicsLayer = graphicsLayer
  },

  SET_SKETCH_VIEW_MODEL(state, sketchViewModel) {
    state.sketchViewModel = sketchViewModel
  },

  SET_SELECTED_BASEMAP(state, basemapId) {
    state.selectedBasemap = basemapId
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
