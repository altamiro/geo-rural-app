/**
 * Utilitários de validação
 */
import { COVERAGE_THRESHOLDS, SP_MUNICIPALITIES } from './constants';

/**
 * Verifica se uma coordenada geográfica é válida
 * @param {Number} longitude - Longitude
 * @param {Number} latitude - Latitude
 * @returns {Boolean} - Se a coordenada é válida
 */
export function isValidCoordinate(longitude, latitude) {
  // Verificar se são números
  if (longitude === undefined || latitude === undefined ||
      isNaN(longitude) || isNaN(latitude)) {
    return false;
  }

  // Verificar se estão dentro dos limites válidos
  return (
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
  if (!municipalityId || typeof municipalityId !== 'string') {
    return false;
  }

  // IDs de município em SP começam com 'SP'
  return municipalityId.startsWith('SP') && SP_MUNICIPALITIES.includes(municipalityId);
}

/**
 * Verifica se há cobertura total do imóvel
 * @param {Number} coveragePercentage - Percentual de cobertura
 * @returns {Boolean} - Se a cobertura é completa
 */
export function isCompleteCoverage(coveragePercentage) {
  if (coveragePercentage === undefined || isNaN(coveragePercentage)) {
    return false;
  }

  // Permite uma pequena margem de erro devido a cálculos de geometria
  return coveragePercentage >= COVERAGE_THRESHOLDS.SUCCESS;
}

/**
 * Determina o status para exibição com base no percentual de cobertura
 * @param {Number} percentage - Percentual de cobertura
 * @returns {String} - Status: 'success', 'warning' ou 'exception'
 */
export function getCoverageStatus(percentage) {
  if (percentage === undefined || isNaN(percentage)) {
    return 'exception';
  }

  if (percentage < COVERAGE_THRESHOLDS.WARNING) {
    return 'exception';
  } else if (percentage < COVERAGE_THRESHOLDS.SUCCESS) {
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
  if (!areaString || typeof areaString !== 'string') {
    return false;
  }

  const areaRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  return areaRegex.test(areaString);
}

/**
 * Valida um objeto de camada
 * @param {Object} layer - Objeto da camada
 * @returns {Boolean} - Se a camada é válida
 */
export function isValidLayer(layer) {
  if (!layer || typeof layer !== 'object') {
    return false;
  }

  // Verificar propriedades obrigatórias
  return (
    layer.id &&
    typeof layer.id === 'string' &&
    layer.name &&
    typeof layer.name === 'string' &&
    !isNaN(layer.area)
  );
}

/**
 * Validar o formato de uma data
 * @param {String} dateString - Data em formato ISO
 * @returns {Boolean} - Se a data é válida
 */
export function isValidDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Verificar formato de data ISO
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  // Verificar se é uma data válida
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
