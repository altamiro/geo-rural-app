import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/pt-br';
import store from './store'
import './assets/styles/main.scss'

// Importar CSS do ArcGIS (importante para estilos dos widgets)
import '@arcgis/core/assets/esri/themes/light/main.css';

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

// Iniciar a aplicação Vue diretamente
new Vue({
  store,
  render: h => h(App)
}).$mount('#app');
console.log('Aplicação Vue iniciada');
