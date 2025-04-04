import ValidationService from '@/services/validation.service'
import { loadModules } from 'esri-loader'
import { LAYER_TYPES, LAYER_CATEGORIES, LAYER_SYMBOLOGY, MESSAGES } from '@/utils/constants'
import { formatArea, squareMetersToHectares } from '@/utils/geometry'

// Initial state
const state = {
  activeLayers: [],
  layerGeometries: {},
  layerVisibility: {},
  layerSymbology: LAYER_SYMBOLOGY,
  loading: false,
  error: null
}

// Getters
const getters = {
  getLayerById: (state) => (id) => {
    return state.activeLayers.find(layer => layer.id === id)
  },
  getLayerGeometry: (state) => (id) => {
    return state.layerGeometries[id] || null
  },
  getLayersByCategory: (state) => (category) => {
    return state.activeLayers.filter(layer => layer.category === category)
  },
  getLayerSymbology: (state) => (id) => {
    return state.layerSymbology[id] || { color: [128, 128, 128, 0.5], outline: [128, 128, 128, 1] }
  },
  isLayerVisible: (state) => (id) => {
    return state.layerVisibility[id] !== false // Default is visible
  },
  totalCoverage: (state, getters, rootState) => {
    if (!rootState.property.propertyArea || rootState.property.propertyArea === 0) {
      return 0
    }

    // Sum all layer areas except property layer
    const totalLayerArea = state.activeLayers
      .filter(layer => layer.id !== LAYER_TYPES.PROPERTY)
      .reduce((sum, layer) => sum + layer.area, 0)

    return Math.min((totalLayerArea / rootState.property.propertyArea) * 100, 100)
  }
}

// Actions
const actions = {
  /**
   * Add a new layer to the map
   * @param {Object} context - Vuex context
   * @param {Object} payload - Layer details with geometry, id, and metadata
   */
  async addLayer({ commit, state, rootState, dispatch }, { id, name, category, geometry, symbolType }) {
    try {
      commit('SET_LOADING', true)

      // Validate inputs
      if (!id || !name || !geometry) {
        commit('SET_ERROR', "Dados da camada incompletos.")
        commit('SET_LOADING', false)
        return { success: false, message: "Dados da camada incompletos." }
      }

      let isValid = true
      let validationMessage = null
      let finalGeometry = geometry

      // Get the appropriate validation method based on layer type
      switch (category) {
        case LAYER_CATEGORIES.PROPERTY:
          if (id === LAYER_TYPES.PROPERTY) {
            // Validate property is within municipality in SP
            const municipalityId = rootState.property.municipalityId
            if (!municipalityId) {
              commit('SET_ERROR', "Município não selecionado.")
              commit('SET_LOADING', false)
              return { success: false, message: "Município não selecionado." }
            }

            isValid = await ValidationService.validatePropertyLocation(geometry, municipalityId)
            validationMessage = isValid
              ? "Área do imóvel validada com sucesso."
              : MESSAGES.INVALID_LOCATION
          } else if (id === LAYER_TYPES.HEADQUARTERS) {
            // Validate headquarters is within property and not overlapping hydrography
            const propertyGeometry = state.layerGeometries[LAYER_TYPES.PROPERTY]
            if (!propertyGeometry) {
              commit('SET_ERROR', MESSAGES.PROPERTY_REQUIRED)
              commit('SET_LOADING', false)
              return { success: false, message: MESSAGES.PROPERTY_REQUIRED }
            }

            const hydrographyGeometries = [] // Would be populated from a service or other layers

            const validation = await ValidationService.validateHeadquarters(
              geometry,
              propertyGeometry,
              hydrographyGeometries
            )

            isValid = validation.isValid
            validationMessage = validation.message
          }
          break

        case LAYER_CATEGORIES.SOIL_COVERAGE:
        case LAYER_CATEGORIES.ADMINISTRATIVE:
        case LAYER_CATEGORIES.RESTRICTED_USE:
        case LAYER_CATEGORIES.LEGAL_RESERVE:
          // Validate other layers are within property
          const propertyGeometry = state.layerGeometries[LAYER_TYPES.PROPERTY]
          if (!propertyGeometry) {
            commit('SET_ERROR', MESSAGES.PROPERTY_REQUIRED)
            commit('SET_LOADING', false)
            return { success: false, message: MESSAGES.PROPERTY_REQUIRED }
          }

          const validation = await ValidationService.validateSoilCoverage(
            geometry,
            propertyGeometry,
            id
          )

          isValid = validation.isValid
          validationMessage = validation.message

          // If geometry needs to be clipped to property boundaries
          if (isValid && validation.clipResult) {
            finalGeometry = validation.clipResult
          }
          break
      }

      if (!isValid) {
        commit('SET_ERROR', validationMessage)
        commit('SET_LOADING', false)
        return { success: false, message: validationMessage }
      }

      // Calculate area in hectares
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])
      const areaInSqMeters = geometryEngine.geodesicArea(finalGeometry, "square-meters")
      const area = squareMetersToHectares(areaInSqMeters)

      // Create layer object
      const layer = {
        id,
        name,
        category: category || 'unknown',
        area,
        timestamp: new Date().toISOString(),
        symbolType: symbolType || 'default'
      }

      // Add layer to state
      commit('ADD_LAYER', layer)
      commit('SET_LAYER_GEOMETRY', { id, geometry: finalGeometry })
      commit('SET_LAYER_VISIBILITY', { id, visible: true })

      // Handle special case for property layer
      if (id === LAYER_TYPES.PROPERTY) {
        commit('property/SET_PROPERTY_POLYGON', finalGeometry, { root: true })
        commit('property/SET_PROPERTY_AREA', area, { root: true })
      }

      // Update calculated areas
      dispatch('property/calculateAreas', null, { root: true })

      // Validate complete coverage
      if (category !== LAYER_CATEGORIES.PROPERTY) {
        dispatch('validateCompleteCoverage')
      }

      commit('SET_LOADING', false)
      return { success: true, message: validationMessage || "Camada adicionada com sucesso." }
    } catch (error) {
      console.error("Error adding layer:", error)
      commit('SET_ERROR', "Erro ao adicionar camada: " + error.message)
      commit('SET_LOADING', false)
      return { success: false, message: "Erro ao adicionar camada: " + error.message }
    }
  },

  /**
   * Update an existing layer
   * @param {Object} context - Vuex context
   * @param {Object} payload - Layer update details
   */
  async updateLayer({ commit, state, dispatch }, { id, geometry }) {
    try {
      commit('SET_LOADING', true)

      const layer = state.activeLayers.find(l => l.id === id)

      if (!layer) {
        commit('SET_ERROR', "Camada não encontrada.")
        commit('SET_LOADING', false)
        return { success: false, message: "Camada não encontrada." }
      }

      // Calculate new area
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])
      const areaInSqMeters = geometryEngine.geodesicArea(geometry, "square-meters")
      const area = squareMetersToHectares(areaInSqMeters)

      // Update layer
      commit('UPDATE_LAYER', { id, updates: { area } })
      commit('SET_LAYER_GEOMETRY', { id, geometry })

      // Special case for property layer
      if (id === LAYER_TYPES.PROPERTY) {
        commit('property/SET_PROPERTY_POLYGON', geometry, { root: true })
        commit('property/SET_PROPERTY_AREA', area, { root: true })
      }

      // Update calculated areas
      dispatch('property/calculateAreas', null, { root: true })

      // Validate complete coverage
      dispatch('validateCompleteCoverage')

      commit('SET_LOADING', false)
      return { success: true, message: "Camada atualizada com sucesso." }
    } catch (error) {
      console.error("Error updating layer:", error)
      commit('SET_ERROR', "Erro ao atualizar camada: " + error.message)
      commit('SET_LOADING', false)
      return { success: false, message: "Erro ao atualizar camada: " + error.message }
    }
  },

  /**
   * Delete a layer
   * @param {Object} context - Vuex context
   * @param {String} id - Layer ID to delete
   */
  async deleteLayer({ commit, state, dispatch }, id) {
    try {
      commit('SET_LOADING', true)

      // Check if layer exists
      const layerIndex = state.activeLayers.findIndex(l => l.id === id)

      if (layerIndex === -1) {
        commit('SET_ERROR', "Camada não encontrada.")
        commit('SET_LOADING', false)
        return { success: false, message: "Camada não encontrada." }
      }

      // Special case for property layer - remove all dependent layers
      if (id === LAYER_TYPES.PROPERTY) {
        // Remove all layers
        state.activeLayers.forEach(layer => {
          if (layer.id !== LAYER_TYPES.PROPERTY) {
            commit('REMOVE_LAYER', layer.id)
            commit('REMOVE_LAYER_GEOMETRY', layer.id)
          }
        })
      }

      // Remove the layer
      commit('REMOVE_LAYER', id)
      commit('REMOVE_LAYER_GEOMETRY', id)

      // Special case for property layer
      if (id === LAYER_TYPES.PROPERTY) {
        commit('property/SET_PROPERTY_POLYGON', null, { root: true })
        commit('property/SET_PROPERTY_AREA', 0, { root: true })
      }

      // Update calculated areas
      dispatch('property/calculateAreas', null, { root: true })

      // Validate complete coverage
      dispatch('validateCompleteCoverage')

      commit('SET_LOADING', false)
      return { success: true, message: "Camada removida com sucesso." }
    } catch (error) {
      console.error("Error deleting layer:", error)
      commit('SET_ERROR', "Erro ao remover camada: " + error.message)
      commit('SET_LOADING', false)
      return { success: false, message: "Erro ao remover camada: " + error.message }
    }
  },

  /**
   * Toggle layer visibility
   * @param {Object} context - Vuex context
   * @param {Object} payload - Layer ID and visibility state
   */
  toggleLayerVisibility({ commit }, { id, visible }) {
    commit('SET_LAYER_VISIBILITY', { id, visible })
  },

  /**
   * Update layer symbology
   * @param {Object} context - Vuex context
   * @param {Object} payload - Layer ID and symbology object
   */
  updateLayerSymbology({ commit }, { id, symbology }) {
    commit('SET_LAYER_SYMBOLOGY', { id, symbology })
  },

  /**
   * Validate if property is completely covered by layers
   * @param {Object} context - Vuex context
   */
  async validateCompleteCoverage({ commit, state, rootState }) {
    try {
      const propertyGeometry = state.layerGeometries[LAYER_TYPES.PROPERTY]

      if (!propertyGeometry) {
        return { isValid: false, coverage: 0, message: MESSAGES.PROPERTY_REQUIRED }
      }

      // Get all layer geometries except property
      const layerGeometries = Object.entries(state.layerGeometries)
        .filter(([key]) => key !== LAYER_TYPES.PROPERTY)
        .map(([, geometry]) => geometry)

      const result = await ValidationService.validateCompleteCoverage(
        propertyGeometry,
        layerGeometries
      )

      commit('property/SET_COVERAGE_PERCENTAGE', result.coveragePercentage, { root: true })

      return result
    } catch (error) {
      console.error("Error validating coverage:", error)
      return { isValid: false, coverage: 0, message: "Erro ao validar cobertura completa." }
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

  ADD_LAYER(state, layer) {
    // Add only if not already present
    if (!state.activeLayers.some(l => l.id === layer.id)) {
      state.activeLayers.push(layer)
    } else {
      // If layer exists, update it
      const index = state.activeLayers.findIndex(l => l.id === layer.id)
      state.activeLayers[index] = { ...state.activeLayers[index], ...layer }
    }
  },

  UPDATE_LAYER(state, { id, updates }) {
    const layerIndex = state.activeLayers.findIndex(l => l.id === id)
    if (layerIndex !== -1) {
      state.activeLayers[layerIndex] = {
        ...state.activeLayers[layerIndex],
        ...updates
      }
    }
  },

  REMOVE_LAYER(state, id) {
    state.activeLayers = state.activeLayers.filter(l => l.id !== id)
  },

  SET_LAYER_GEOMETRY(state, { id, geometry }) {
    state.layerGeometries = {
      ...state.layerGeometries,
      [id]: geometry
    }
  },

  REMOVE_LAYER_GEOMETRY(state, id) {
    const { [id]: removed, ...rest } = state.layerGeometries
    state.layerGeometries = rest
  },

  SET_LAYER_VISIBILITY(state, { id, visible }) {
    state.layerVisibility = {
      ...state.layerVisibility,
      [id]: visible
    }
  },

  SET_LAYER_SYMBOLOGY(state, { id, symbology }) {
    state.layerSymbology = {
      ...state.layerSymbology,
      [id]: symbology
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
