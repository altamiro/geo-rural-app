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
  console.error('Erro global Vue:', err);
  console.error('Componente:', vm);
  console.error('Info:', info);
};

// Listener global para erros JS
window.addEventListener('error', (event) => {
  console.error('Erro global JavaScript:', event.error);
});

// Verificar se a aplicação está pronta para inicializar
const checkResourcesLoaded = () => {
  // Verificar se estilos críticos foram carregados
  const styleSheets = document.styleSheets;
  const hasStyles = styleSheets && styleSheets.length > 0;

  // Verificar se o elemento de app existe
  const appElement = document.getElementById('app');

  return hasStyles && appElement;
};

// Iniciar a aplicação
const startApp = () => {
  try {
    new Vue({
      store,
      render: h => h(App)
    }).$mount('#app');
  } catch (error) {
    console.error('Erro ao iniciar aplicação Vue:', error);
  }
};

// Função para iniciar a aplicação quando todos os recursos necessários estiverem prontos
const initializeAppWhenReady = () => {
  // Tentar carregar a API ArcGIS
  ensureArcGISLoaded()
    .then(() => {
      console.log('ArcGIS API carregada com sucesso');
      startApp();
    })
    .catch(error => {
      console.error('Erro ao carregar ArcGIS API:', error);
      // Ainda podemos iniciar a aplicação, mas algumas funcionalidades de mapa não funcionarão
      console.warn('Iniciando aplicação sem APIs de mapa completas');
      startApp();
    });
};

// Verificar se recursos básicos já estão carregados
if (checkResourcesLoaded()) {
  // Recursos básicos já carregados, continuar com o carregamento do ArcGIS
  console.log('Recursos básicos carregados, carregando ArcGIS...');
  initializeAppWhenReady();
} else {
  // Aguardar pelo carregamento dos recursos básicos
  console.log('Aguardando carregamento de recursos básicos...');
  window.addEventListener('load', () => {
    console.log('Recursos básicos carregados após evento load, carregando ArcGIS...');
    initializeAppWhenReady();
  });
}
