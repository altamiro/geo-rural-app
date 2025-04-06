// src/utils/arcgis-config.js
import esriConfig from '@arcgis/core/config';

/**
 * Configure a API do ArcGIS com a URL do portal e outros parâmetros
 */
export function configureArcGIS() {
  // Configurações básicas
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurMUY5BTmwAEQ_xYLu2E-3bDVZH5VPuhuljcP7Bse8p3a2UvKly5Qq8wnmacoRtjOONaA-d-XLMEWDJu1c47Hq1AfhkkH0fo6pCDYj3jgMVJgV7bn4cmzElwkBT29pLoANtb9MBTktpeq-XfDWK8PjBXKj_EGrAqiJC-23V43ybsSknkXkVjGcl2rBvGKkW5561V6uQrfRvGCQO6hfp92nIw.AT1_PCvm7EkJ"; // Adicionar sua API key do ArcGIS aqui, se necessário

  // Ajustes de assetsPath se necessário (por padrão, assume que os assets estão em ./assets)
  // esriConfig.assetsPath = "./assets";

  // Para debugar problemas com CORS
  esriConfig.request.trustedServers = [
    "https://geocode.arcgis.com",
    "https://services.arcgisonline.com"
  ];

  // Definir tempo limite para requests
  esriConfig.request.timeout = 60000; // 60 segundos

  // Opcionalmente, desabilitar CORS para desenvolvimento local
  // esriConfig.request.corsEnabledServers.push("http://localhost");

  // Configurar cache
  esriConfig.request.useIdentity = false; // Desabilitar autenticação padrão se não for necessária

  // Logger de debug (remover em produção)
  // esriConfig.workers.loaderConfig = {
  //   has: {
  //     "esri-debug-logger": 1
  //   }
  // };

  console.log("ArcGIS configurado!");
}

export default {
  configureArcGIS
};
