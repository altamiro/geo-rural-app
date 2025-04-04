import ValidationService from '@/services/validation.service'
import { MESSAGES, LAYER_TYPES } from '@/utils/constants'
import { isCompleteCoverage } from '@/utils/validation'

// Initial state
const state = {
  propertyPolygon: null,
  propertyArea: 0,
  administrativeServiceArea: 0,
  netArea: 0,
  anthropizedArea: 0,
  coveragePercentage: 0,
  municipalityId: null,
  municipalityName: null,
  loading: false,
  error: null
}

// Getters
const getters = {
  isPropertyDefined: state => !!state.propertyPolygon,
  isComplete: state => isCompleteCoverage(state.coveragePercentage)
}

// Actions
const actions = {
  /**
   * Set the active municipality
   * @param {Object} context - Vuex context
   * @param {Object} payload - Municipality data
   */
  setMunicipality({ commit }, { id, name }) {
    commit('SET_MUNICIPALITY', { id, name })
  },

  /**
   * Validate if property is within the selected municipality
   * @param {Object} context - Vuex context
   * @param {Object} geometry - Property geometry
   */
  async validatePropertyLocation({ state, commit }, geometry) {
    try {
      commit('SET_LOADING', true)

      if (!state.municipalityId) {
        commit('SET_ERROR', "Município não selecionado.")
        commit('SET_LOADING', false)
        return false
      }

      const isValid = await ValidationService.validatePropertyLocation(geometry, state.municipalityId)

      if (!isValid) {
        commit('SET_ERROR', MESSAGES.INVALID_LOCATION)
      }

      commit('SET_LOADING', false)
      return isValid
    } catch (error) {
      console.error("Error validating property location:", error)
      commit('SET_ERROR', "Erro ao validar localização do imóvel: " + error.message)
      commit('SET_LOADING', false)
      return false
    }
  },

  /**
   * Calculate derived areas based on property and other layers
   * @param {Object} context - Vuex context
   */
  async calculateAreas({ state, commit, rootState }) {
    try {
      if (!state.propertyPolygon) {
        return
      }

      commit('SET_LOADING', true)

      // Calculate administrative service area
      const serviceLayerIds = ['roadway', 'railway', 'powerline']
      let administrativeServiceArea = 0

      for (const id of serviceLayerIds) {
        const layer = rootState.layers.activeLayers.find(l => l.id === id)
        if (layer) {
          administrativeServiceArea += layer.area
        }
      }

      // Calculate net area (property area minus administrative service area)
      const netArea = Math.max(0, state.propertyArea - administrativeServiceArea)

      // Calculate anthropized area after 2008
      const layerGeometries = rootState.layers.layerGeometries

      const result = await ValidationService.calculateAnthropizedArea(
        state.propertyPolygon,
        layerGeometries
      )

      commit('SET_ADMINISTRATIVE_SERVICE_AREA', administrativeServiceArea)
      commit('SET_NET_AREA', netArea)
      commit('SET_ANTHROPIZED_AREA', result.area)
      commit('SET_LOADING', false)
    } catch (error) {
      console.error("Error calculating areas:", error)
      commit('SET_ERROR', "Erro ao calcular áreas: " + error.message)
      commit('SET_LOADING', false)
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

  SET_MUNICIPALITY(state, { id, name }) {
    state.municipalityId = id
    state.municipalityName = name
  },

  SET_PROPERTY_POLYGON(state, polygon) {
    state.propertyPolygon = polygon
  },

  SET_PROPERTY_AREA(state, area) {
    state.propertyArea = area
  },

  SET_ADMINISTRATIVE_SERVICE_AREA(state, area) {
    state.administrativeServiceArea = area
  },

  SET_NET_AREA(state, area) {
    state.netArea = area
  },

  SET_ANTHROPIZED_AREA(state, area) {
    state.anthropizedArea = area
  },

  SET_COVERAGE_PERCENTAGE(state, percentage) {
    state.coveragePercentage = percentage
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
