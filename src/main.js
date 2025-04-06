import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/pt-br';
import store from './store'
import './assets/styles/main.scss'

import { isArcGISLoaded } from './utils/esri-loader-config';

// Use ElementUI
Vue.use(ElementUI, { locale });

Vue.config.productionTip = false

// Adicionar em main.js
Vue.config.errorHandler = function(err, vm, info) {
  console.error('Erro global Vue:', err);
  console.error('Componente:', vm);
  console.error('Info:', info);

  // Implementar sistema de log ou monitoramento
  // logErrorToService(err, vm, info);
};

window.addEventListener('error', (event) => {
  console.error('Erro global JavaScript:', event.error);
  // logErrorToService(event.error);
});

const startApp = () => {
  new Vue({
    store,
    render: h => h(App)
  }).$mount('#app');
};

if (isArcGISLoaded()) {
  startApp();
} else {
  // Adicionar script ArcGIS manualmente se necessário
  const arcgisScript = document.createElement('script');
  arcgisScript.src = 'https://js.arcgis.com/4.24/';
  arcgisScript.onload = startApp;
  document.head.appendChild(arcgisScript);
}

