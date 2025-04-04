/**
 * Utilitários de validação
 */

/**
 * Verifica se uma coordenada geográfica é válida
 * @param {Number} longitude - Longitude
 * @param {Number} latitude - Latitude
 * @returns {Boolean} - Se a coordenada é válida
 */
export function isValidCoordinate(longitude, latitude) {
  return (
    !isNaN(longitude) &&
    !isNaN(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

/**
 * Verifica se um município está no estado de São Paulo
 * @param {String} municipalityId - ID do município
 * @returns {Boolean} - Se o município está em SP
 */
export function isSaoPauloMunicipality(municipalityId) {
  // IDs de município em SP começam com 'SP'
  return municipalityId && municipalityId.startsWith('SP');
}

/**
 * Verifica se há cobertura total do imóvel
 * @param {Number} coveragePercentage - Percentual de cobertura
 * @returns {Boolean} - Se a cobertura é completa
 */
export function isCompleteCoverage(coveragePercentage) {
  // Permite uma pequena margem de erro devido a cálculos de geometria
  return coveragePercentage >= 99.9;
}

/**
 * Determina o status para exibição com base no percentual de cobertura
 * @param {Number} percentage - Percentual de cobertura
 * @returns {String} - Status: 'success', 'warning' ou 'exception'
 */
export function getCoverageStatus(percentage) {
  if (percentage < 95) {
    return 'exception';
  } else if (percentage < 100) {
    return 'warning';
  } else {
    return 'success';
  }
}

/**
 * Valida se o formato de área está correto
 * @param {String} areaString - Valor de área em formato string
 * @returns {Boolean} - Se o formato é válido
 */
export function validateAreaFormat(areaString) {
  const areaRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  return areaRegex.test(areaString);
}
