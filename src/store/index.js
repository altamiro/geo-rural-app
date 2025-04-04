import Vue from 'vue'
import Vuex from 'vuex'
import map from './modules/map'
import layers from './modules/layers'
import property from './modules/property'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    map,
    layers,
    property
  }
})
