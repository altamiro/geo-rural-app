/**
 * Utilitários para manipulação de geometrias
 */

/**
 * Converte área de metros quadrados para hectares
 * @param {Number} areaInSquareMeters - Área em metros quadrados
 * @returns {Number} - Área em hectares
 */
export function squareMetersToHectares(areaInSquareMeters) {
  return areaInSquareMeters / 10000;
}

/**
 * Formata um valor de área com duas casas decimais
 * @param {Number} area - Valor da área
 * @returns {String} - Área formatada
 */
export function formatArea(area) {
  return area.toFixed(2);
}

/**
 * Simplifica uma geometria para melhorar o desempenho
 * @param {Object} geometry - Geometria Esri
 * @param {Number} tolerance - Tolerância para simplificação
 * @returns {Object} - Geometria simplificada
 */
export async function simplifyGeometry(geometry, tolerance = 10) {
  const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"]);
  return geometryEngine.simplify(geometry);
}

/**
 * Converte uma geometria Esri para GeoJSON
 * @param {Object} geometry - Geometria Esri
 * @returns {Object} - GeoJSON equivalente
 */
export async function geometryToGeoJSON(geometry) {
  const [jsonUtils] = await loadModules(["esri/geometry/support/jsonUtils"]);
  return jsonUtils.geometryToJSON(geometry);
}

/**
 * Converte um GeoJSON para geometria Esri
 * @param {Object} geoJSON - GeoJSON
 * @returns {Object} - Geometria Esri equivalente
 */
export async function geoJSONToGeometry(geoJSON) {
  const [jsonUtils] = await loadModules(["esri/geometry/support/jsonUtils"]);
  return jsonUtils.fromJSON(geoJSON);
}
