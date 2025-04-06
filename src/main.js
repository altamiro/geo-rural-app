import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/pt-br';
import store from './store'
import './assets/styles/main.scss'
import { ensureArcGISLoaded } from './utils/esri-loader-config'

Vue.use(ElementUI, { locale });

Vue.config.productionTip = false

// Handler global de erros
Vue.config.errorHandler = function(err, vm, info) {
  console.error('Erro global Vue:', err.message);
  console.error('Componente:', vm?.$options?.name || 'Desconhecido');
  console.error('Info:', info);
};

// Listener global para erros JS - com prevenção de recursão
window.addEventListener('error', (event) => {
  // Evitar logging excessivo
  if (event.error && !window._lastErrorLogged) {
    window._lastErrorLogged = event.error.message;
    console.error('Erro global JavaScript:', event.error.message);

    // Resetar após um tempo para permitir novos logs
    setTimeout(() => {
      window._lastErrorLogged = null;
    }, 1000);
  }
});

// Variáveis para controle de tentativas
let arcgisLoadAttempted = false;

// Iniciar a aplicação Vue sem depender da API ArcGIS
const startVueApp = () => {
  new Vue({
    store,
    render: h => h(App)
  }).$mount('#app');
  console.log('Aplicação Vue iniciada');
};

// Carregar a API ArcGIS de forma independente
const loadArcGISAPI = async () => {
  if (arcgisLoadAttempted) {
    console.log('Já tentou carregar ArcGIS, ignorando chamada duplicada');
    return;
  }

  arcgisLoadAttempted = true;

  try {
    // Tentar carregar a API com timeout de segurança
    const loadPromise = ensureArcGISLoaded();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao carregar ArcGIS API')), 15000);
    });

    await Promise.race([loadPromise, timeoutPromise]);
    console.log('ArcGIS API carregada com sucesso');

    // Guardar no estado global que a API foi carregada
    store.commit('map/SET_ARCGIS_LOADED', true);
  } catch (error) {
    console.error('Erro ao carregar ArcGIS API:', error);
    store.commit('map/SET_ARCGIS_LOADED', false);
    store.commit('map/SET_ERROR', 'Não foi possível carregar a API ArcGIS. Algumas funcionalidades de mapa estarão indisponíveis.');
  }
};

// Inicialização principal da aplicação
const initializeApp = () => {
  // Sempre iniciar a aplicação Vue primeiro
  startVueApp();

  // Carregar ArcGIS separadamente
  loadArcGISAPI().catch(error => {
    console.error('Falha ao carregar ArcGIS:', error);
  });
};

// Verificar se o DOM está pronto para inicializar a aplicação
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM já está pronto
  initializeApp();
}
