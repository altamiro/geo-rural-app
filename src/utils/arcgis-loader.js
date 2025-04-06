// Importações diretas da biblioteca @arcgis/core
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Expand from '@arcgis/core/widgets/Expand';
import Locator from '@arcgis/core/tasks/Locator';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import * as jsonUtils from '@arcgis/core/geometry/support/jsonUtils';

// Importar o CSS do ArcGIS (adicione isso no seu main.js ou no componente principal)
import '@arcgis/core/assets/esri/themes/light/main.css';

/**
 * Objeto que contém os módulos ArcGIS importados para uso na aplicação
 */
const arcgisModules = {
  Map,
  MapView,
  GraphicsLayer,
  Graphic,
  SketchViewModel,
  BasemapGallery,
  Expand,
  Locator,
  geometryEngine,
  jsonUtils
};

/**
 * Função para obter módulos ArcGIS
 * @param {Array} moduleNames - Array de strings com os nomes dos módulos
 * @returns {Promise<Array>} - Promise com os módulos carregados
 */
export async function loadEsriModules(moduleNames) {
  if (!moduleNames || !Array.isArray(moduleNames) || moduleNames.length === 0) {
    throw new Error("Nenhum módulo ArcGIS especificado para carregamento");
  }

  try {
    // Mapear os nomes dos módulos para os módulos reais
    const modules = moduleNames.map(moduleName => {
      // Tratar módulos com namespaces (como esri/geometry/geometryEngine)
      const normalizedName = moduleName.replace('esri/', '').split('/');

      if (normalizedName.length === 1) {
        // Módulo simples (ex: "esri/Map")
        const modulePart = normalizedName[0];
        if (!arcgisModules[modulePart]) {
          throw new Error(`Módulo não encontrado: ${moduleName}`);
        }
        return arcgisModules[modulePart];
      } else {
        // Módulos com namespaces (ex: "esri/geometry/geometryEngine")
        // Para esses casos, geralmente usamos as importações namespace (ex: * as geometryEngine)
        const lastPart = normalizedName[normalizedName.length - 1];
        if (!arcgisModules[lastPart]) {
          throw new Error(`Módulo não encontrado: ${moduleName}`);
        }
        return arcgisModules[lastPart];
      }
    });

    return modules;
  } catch (error) {
    console.error(`Erro ao carregar módulos ArcGIS [${moduleNames.join(", ")}]:`, error);
    throw error;
  }
}

/**
 * Verifica se o ArcGIS está pronto para uso
 * @returns {boolean} - true se os módulos básicos estão disponíveis
 */
export function isArcGISLoaded() {
  return !!arcgisModules.Map && !!arcgisModules.MapView;
}

/**
 * Função que garante que o ArcGIS está carregado
 * @returns {Promise<boolean>} - Promise que resolve quando os módulos estão prontos
 */
export function ensureArcGISLoaded() {
  return Promise.resolve(true); // Sempre disponível com importação local
}

export default arcgisModules;
