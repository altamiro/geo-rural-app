// Crie ou modifique um arquivo em src/utils/esri-loader-config.js

import { loadModules, setDefaultOptions } from "esri-loader";

// Configurar opções padrão para o carregamento da API ArcGIS
setDefaultOptions({
  version: "4.24", // Versão específica do ArcGIS JS API
  css: true, // Carregar o CSS automaticamente
  url: "https://js.arcgis.com/4.24/", // URL específica para evitar redirecionamentos
  dojoConfig: {
    async: true,
    packages: [
      {
        name: "app",
        location:
          window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/app",
      },
    ],
  },
});

/**
 * Função wrapper para carregar módulos ArcGIS com tratamento de erro mais detalhado
 * @param {Array} modules - Array de strings com os nomes dos módulos a serem carregados
 * @param {Object} options - Opções adicionais para carregamento (opcional)
 * @returns {Promise} - Promise com os módulos carregados
 */
export async function loadEsriModules(modules, options = {}) {
  try {
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      throw new Error("Nenhum módulo ArcGIS especificado para carregamento");
    }

    // Tenta carregar os módulos da API ArcGIS com tratamento de erros detalhado
    return await loadModules(modules, options);
  } catch (error) {
    console.error(`Erro ao carregar módulos ArcGIS [${modules.join(", ")}]:`, error);

    // Tentar identificar problemas específicos
    if (error.message && error.message.includes("timeout")) {
      console.error("Erro de timeout. Verifique a conexão de rede ou bloqueadores de script.");
    } else if (error.message && error.message.includes("undefined dojo")) {
      console.error("Erro no carregamento do Dojo. Verifique a URL da API ArcGIS.");
    }

    throw error;
  }
}

// Exportar a função original também para compatibilidade
export { loadModules };

// Exportar uma função utilitária para verificar se a API ArcGIS está carregada
export function isArcGISLoaded() {
  return window.require !== undefined && window.esri !== undefined;
}

export function ensureArcGISLoaded() {
  // Adicionar variável de controle para evitar múltiplas chamadas
  if (window._arcgisLoadPromise) {
    return window._arcgisLoadPromise;
  }

  const loadPromise = new Promise((resolve, reject) => {
    // Verificar se já está carregado
    if (isArcGISLoaded()) {
      resolve(true);
      return;
    }

    // Definir timeout para falha
    const timeoutId = setTimeout(() => {
      window._arcgisLoadAttempted = true;
      reject(new Error("Timeout ao carregar ArcGIS API"));
    }, 20000); // 20 segundos de timeout

    // Adicionar script apenas se não existir
    if (!document.querySelector('script[src*="js.arcgis.com/4.24/"]')) {
      const script = document.createElement("script");
      script.src = "https://js.arcgis.com/4.24/";
      script.onload = () => {
        clearTimeout(timeoutId);
        // Esperar um pouco mais para garantir que todos os módulos sejam registrados
        setTimeout(() => {
          window._arcgisLoadAttempted = true;
          resolve(true);
        }, 500);
      };
      script.onerror = (error) => {
        clearTimeout(timeoutId);
        window._arcgisLoadAttempted = true;
        reject(error || new Error("Falha ao carregar API ArcGIS"));
      };

      document.head.appendChild(script);
    } else {
      // Script já existe, apenas aguardar carregamento
      const checkLoaded = setInterval(() => {
        if (isArcGISLoaded()) {
          clearInterval(checkLoaded);
          clearTimeout(timeoutId);
          window._arcgisLoadAttempted = true;
          resolve(true);
        }
      }, 100);
    }
  });

  // Armazenar a promise para reutilização
  window._arcgisLoadPromise = loadPromise;
  return loadPromise;
}
