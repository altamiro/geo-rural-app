import { loadModules } from 'esri-loader'

/**
 * Utilitários para manipulação de geometrias
 */

/**
 * Converte área de metros quadrados para hectares
 * @param {Number} areaInSquareMeters - Área em metros quadrados
 * @returns {Number} - Área em hectares
 */
export function squareMetersToHectares(areaInSquareMeters) {
  if (!areaInSquareMeters || isNaN(areaInSquareMeters) || areaInSquareMeters < 0) {
    return 0;
  }
  return areaInSquareMeters / 10000;
}

/**
 * Formata um valor de área com duas casas decimais
 * @param {Number} area - Valor da área
 * @returns {String} - Área formatada
 */
export function formatArea(area) {
  if (!area || isNaN(area)) {
    return "0.00";
  }
  return area.toFixed(2);
}

/**
 * Simplifica uma geometria para melhorar o desempenho
 * @param {Object} geometry - Geometria Esri
 * @param {Number} tolerance - Tolerância para simplificação
 * @returns {Promise<Object>} - Geometria simplificada
 */
export async function simplifyGeometry(geometry, tolerance = 10) {
  try {
    if (!geometry) {
      throw new Error("Geometria não definida para simplificação");
    }

    const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"]);
    return geometryEngine.simplify(geometry, tolerance);
  } catch (error) {
    console.error("Erro ao simplificar geometria:", error);
    return geometry; // Retorna a geometria original em caso de erro
  }
}

/**
 * Converte uma geometria Esri para GeoJSON
 * @param {Object} geometry - Geometria Esri
 * @returns {Promise<Object>} - GeoJSON equivalente
 */
export async function geometryToGeoJSON(geometry) {
  try {
    if (!geometry) {
      throw new Error("Geometria não definida para conversão");
    }

    const [jsonUtils] = await loadModules(["esri/geometry/support/jsonUtils"]);
    return jsonUtils.geometryToJSON(geometry);
  } catch (error) {
    console.error("Erro ao converter geometria para GeoJSON:", error);
    return null;
  }
}

/**
 * Converte um GeoJSON para geometria Esri
 * @param {Object} geoJSON - GeoJSON
 * @returns {Promise<Object>} - Geometria Esri equivalente
 */
export async function geoJSONToGeometry(geoJSON) {
  try {
    if (!geoJSON) {
      throw new Error("GeoJSON não definido para conversão");
    }

    const [jsonUtils] = await loadModules(["esri/geometry/support/jsonUtils"]);
    return jsonUtils.fromJSON(geoJSON);
  } catch (error) {
    console.error("Erro ao converter GeoJSON para geometria:", error);
    return null;
  }
}

/**
 * Calcula o centróide de uma geometria
 * @param {Object} geometry - Geometria Esri
 * @returns {Promise<Object>} - Ponto centróide
 */
export async function calculateCentroid(geometry) {
  try {
    if (!geometry) {
      throw new Error("Geometria não definida para cálculo de centróide");
    }

    const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"]);
    return geometryEngine.centroid(geometry);
  } catch (error) {
    console.error("Erro ao calcular centróide:", error);
    return null;
  }
}

/**
 * Combina múltiplas geometrias em uma única
 * @param {Array} geometries - Array de geometrias Esri
 * @returns {Promise<Object>} - Geometria combinada
 */
export async function combineGeometries(geometries) {
  try {
    if (!geometries || !Array.isArray(geometries) || geometries.length === 0) {
      throw new Error("Geometrias não definidas para combinação");
    }

    // Filtrar geometrias inválidas
    const validGeometries = geometries.filter(geom => geom);

    if (validGeometries.length === 0) {
      throw new Error("Nenhuma geometria válida fornecida");
    }

    // Se houver apenas uma geometria, retorná-la diretamente
    if (validGeometries.length === 1) {
      return validGeometries[0];
    }

    const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"]);
    return geometryEngine.union(validGeometries);
  } catch (error) {
    console.error("Erro ao combinar geometrias:", error);
    return null;
  }
}
