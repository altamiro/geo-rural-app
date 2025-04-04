/**
 * Serviço para cálculos de áreas e análises espaciais
 */
import { loadEsriModules } from "@/utils/esri-loader-config";
import { squareMetersToHectares } from '@/utils/geometry'
import { GEOMETRY_TOLERANCE } from '@/utils/constants'

class CalculationService {
  /**
   * Calcula a área de uma geometria em hectares
   * @param {Object} geometry - Geometria Esri
   * @returns {Promise<Number>} - Área em hectares
   */
  async calculateArea(geometry) {
    try {
      if (!geometry) {
        console.warn("Geometria não definida para cálculo de área")
        return 0
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

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
    if (!propertyArea || propertyArea <= 0) return 0
    if (!administrativeArea) administrativeArea = 0

    return Math.max(0, propertyArea - administrativeArea)
  }

  /**
   * Calcula porcentagem de um valor em relação a outro
   * @param {Number} value - Valor a calcular
   * @param {Number} total - Valor total
   * @returns {Number} - Percentual (0-100)
   */
  calculatePercentage(value, total) {
    if (!total || total <= 0) return 0
    if (!value || value < 0) value = 0

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
      if (!geometry1 || !geometry2) {
        return {
          geometry: null,
          area: 0,
          hasOverlap: false
        }
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

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
      if (!baseGeometry) {
        return {
          coverageGeometry: null,
          coveredArea: 0,
          uncoveredArea: 0,
          coveragePercentage: 0
        }
      }

      // Se não tem geometrias de cobertura, retorna 0%
      if (!coverageGeometries || !Array.isArray(coverageGeometries) || coverageGeometries.length === 0) {
        const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])
        const baseAreaInSqMeters = geometryEngine.geodesicArea(baseGeometry, "square-meters")
        const baseArea = squareMetersToHectares(baseAreaInSqMeters)

        return {
          coverageGeometry: null,
          coveredArea: 0,
          uncoveredArea: baseArea,
          coveragePercentage: 0
        }
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

      // União de todas as geometrias de cobertura
      let unionGeometry = null

      for (const geometry of coverageGeometries) {
        if (!geometry) continue

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

  /**
   * Verifica se duas geometrias se sobrepõem
   * @param {Object} geometry1 - Primeira geometria
   * @param {Object} geometry2 - Segunda geometria
   * @returns {Promise<Boolean>} - Se as geometrias se sobrepõem
   */
  async doGeometriesOverlap(geometry1, geometry2) {
    try {
      if (!geometry1 || !geometry2) return false

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])
      return geometryEngine.overlaps(geometry1, geometry2) ||
             geometryEngine.contains(geometry1, geometry2) ||
             geometryEngine.contains(geometry2, geometry1)
    } catch (error) {
      console.error("Erro ao verificar sobreposição:", error)
      return false
    }
  }
}

export default new CalculationService()
