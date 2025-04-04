/**
 * Serviço para cálculos de áreas e análises espaciais
 */
import { loadModules } from 'esri-loader'
import { squareMetersToHectares, formatArea } from '@/utils/geometry'
import { GEOMETRY_TOLERANCE } from '@/utils/constants'

class CalculationService {
  /**
   * Calcula a área de uma geometria em hectares
   * @param {Object} geometry - Geometria Esri
   * @returns {Promise<Number>} - Área em hectares
   */
  async calculateArea(geometry) {
    try {
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

      // Calcular área em metros quadrados
      const areaInSqMeters = geometryEngine.geodesicArea(geometry, "square-meters")

      // Converter para hectares
      return squareMetersToHectares(areaInSqMeters)
    } catch (error) {
      console.error("Erro ao calcular área:", error)
      return 0
    }
  }

  /**
   * Calcula área líquida (propriedade menos áreas administrativas)
   * @param {Number} propertyArea - Área total da propriedade
   * @param {Number} administrativeArea - Área administrativa total
   * @returns {Number} - Área líquida
   */
  calculateNetArea(propertyArea, administrativeArea) {
    return Math.max(0, propertyArea - administrativeArea)
  }

  /**
   * Calcula porcentagem de um valor em relação a outro
   * @param {Number} value - Valor a calcular
   * @param {Number} total - Valor total
   * @returns {Number} - Percentual (0-100)
   */
  calculatePercentage(value, total) {
    if (!total) return 0
    return (value / total) * 100
  }

  /**
   * Calcula sobreposição entre duas geometrias
   * @param {Object} geometry1 - Primeira geometria
   * @param {Object} geometry2 - Segunda geometria
   * @returns {Promise<Object>} - Geometria de sobreposição e área
   */
  async calculateOverlap(geometry1, geometry2) {
    try {
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

      // Calcular interseção
      const intersectGeometry = geometryEngine.intersect(geometry1, geometry2, GEOMETRY_TOLERANCE)

      if (!intersectGeometry) {
        return {
          geometry: null,
          area: 0,
          hasOverlap: false
        }
      }

      // Calcular área de sobreposição
      const areaInSqMeters = geometryEngine.geodesicArea(intersectGeometry, "square-meters")
      const area = squareMetersToHectares(areaInSqMeters)

      return {
        geometry: intersectGeometry,
        area,
        hasOverlap: area > 0
      }
    } catch (error) {
      console.error("Erro ao calcular sobreposição:", error)
      return {
        geometry: null,
        area: 0,
        hasOverlap: false
      }
    }
  }

  /**
   * Calcula porcentagem de cobertura entre camadas
   * @param {Object} baseGeometry - Geometria base (ex: propriedade)
   * @param {Array} coverageGeometries - Array de geometrias de cobertura
   * @returns {Promise<Object>} - Informações de cobertura
   */
  async calculateCoverage(baseGeometry, coverageGeometries) {
    try {
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

      // União de todas as geometrias de cobertura
      let unionGeometry = null

      for (const geometry of coverageGeometries) {
        if (!unionGeometry) {
          unionGeometry = geometry
        } else {
          unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE)
        }
      }

      if (!unionGeometry) {
        return {
          coverageGeometry: null,
          coveredArea: 0,
          uncoveredArea: 0,
          coveragePercentage: 0
        }
      }

      // Calcular área da base em metros quadrados
      const baseAreaInSqMeters = geometryEngine.geodesicArea(baseGeometry, "square-meters")

      // Calcular área de interseção (cobertura real)
      const intersectionGeometry = geometryEngine.intersect(unionGeometry, baseGeometry, GEOMETRY_TOLERANCE)

      if (!intersectionGeometry) {
        return {
          coverageGeometry: null,
          coveredArea: 0,
          uncoveredArea: squareMetersToHectares(baseAreaInSqMeters),
          coveragePercentage: 0
        }
      }

      // Calcular área coberta em metros quadrados
      const coveredAreaInSqMeters = geometryEngine.geodesicArea(intersectionGeometry, "square-meters")

      // Converter para hectares
      const coveredArea = squareMetersToHectares(coveredAreaInSqMeters)
      const baseArea = squareMetersToHectares(baseAreaInSqMeters)

      // Calcular área não coberta
      const uncoveredArea = baseArea - coveredArea

      // Calcular porcentagem de cobertura
      const coveragePercentage = this.calculatePercentage(coveredAreaInSqMeters, baseAreaInSqMeters)

      return {
        coverageGeometry: intersectionGeometry,
        coveredArea,
        uncoveredArea,
        coveragePercentage
      }
    } catch (error) {
      console.error("Erro ao calcular cobertura:", error)
      return {
        coverageGeometry: null,
        coveredArea: 0,
        uncoveredArea: 0,
        coveragePercentage: 0
      }
    }
  }
}

export default new CalculationService()
