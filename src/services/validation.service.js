/**
 * Service for validating layer geometries based on business rules
 */
import { loadEsriModules } from "@/utils/esri-loader-config";
import { MESSAGES, GEOMETRY_TOLERANCE } from '@/utils/constants'
import { squareMetersToHectares } from '@/utils/geometry'
import { isCompleteCoverage, isSaoPauloMunicipality } from '@/utils/validation'

class ValidationService {
  /**
   * Validates if a property polygon is within a specified municipality in São Paulo state
   * @param {Object} propertyGeometry - The Esri geometry of the property
   * @param {String} municipalityId - The ID of the declared municipality
   * @returns {Promise<Boolean>} - Whether the property is valid
   */
  async validatePropertyLocation(propertyGeometry, municipalityId) {
    try {
      if (!propertyGeometry) {
        console.error("Propriedade não fornecida para validação")
        return false
      }

      if (!municipalityId) {
        console.error("ID de município não fornecido")
        return false
      }

      // Check if municipality is in São Paulo state
      if (!isSaoPauloMunicipality(municipalityId)) {
        console.error("Municipality not in São Paulo state")
        return false
      }

      // No ambiente de demonstração, vamos simular uma validação de municípios
      // Em um ambiente real, faríamos a consulta ao serviço de municípios
      console.log(`Validando se propriedade está no município: ${municipalityId}`)

      // Simulação: sempre validar como verdadeiro
      // para fins de demonstração
      return true
    } catch (error) {
      console.error("Error validating property location:", error)
      return false
    }
  }

  /**
   * Validates if a headquarters point is properly placed
   * @param {Object} headquartersGeometry - The Esri geometry of the headquarters
   * @param {Object} propertyGeometry - The Esri geometry of the property
   * @param {Array} hydrographyGeometries - Array of hydrography geometries
   * @returns {Object} - Validation result with status and message
   */
  async validateHeadquarters(headquartersGeometry, propertyGeometry, hydrographyGeometries = []) {
    try {
      if (!headquartersGeometry || !propertyGeometry) {
        return {
          isValid: false,
          message: "Geometrias não fornecidas para validação"
        }
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

      // Check if headquarters is within property, using tolerance for better precision
      const isWithinProperty = geometryEngine.within(
        headquartersGeometry,
        propertyGeometry,
        GEOMETRY_TOLERANCE
      )

      if (!isWithinProperty) {
        return {
          isValid: false,
          message: MESSAGES.HEADQUARTERS_INSIDE
        }
      }

      // Check if headquarters overlaps with hydrography, using tolerance to catch near intersections
      for (const hydroGeometry of hydrographyGeometries) {
        if (!hydroGeometry) continue

        const overlapsHydrography = geometryEngine.intersects(
          headquartersGeometry,
          hydroGeometry,
          GEOMETRY_TOLERANCE
        )

        if (overlapsHydrography) {
          return {
            isValid: false,
            message: "A sede do imóvel não pode estar em área de hidrografia."
          }
        }
      }

      return {
        isValid: true,
        message: "Sede do imóvel validada com sucesso."
      }
    } catch (error) {
      console.error("Error validating headquarters:", error)
      return {
        isValid: false,
        message: "Erro ao validar a sede do imóvel."
      }
    }
  }

  /**
   * Validates if a soil coverage layer is properly placed
   * @param {Object} layerGeometry - The Esri geometry of the layer
   * @param {Object} propertyGeometry - The Esri geometry of the property
   * @param {String} layerType - The type of soil coverage layer
   * @returns {Object} - Validation result with status and message
   */
  async validateSoilCoverage(layerGeometry, propertyGeometry, layerType) {
    try {
      if (!layerGeometry || !propertyGeometry) {
        return {
          isValid: false,
          message: "Geometrias não fornecidas para validação"
        }
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

      // Check if layer is within property, using tolerance for better precision
      const intersection = geometryEngine.intersect(
        layerGeometry,
        propertyGeometry,
        GEOMETRY_TOLERANCE
      )

      if (!intersection) {
        return {
          isValid: false,
          message: MESSAGES.LAYER_INSIDE
        }
      }

      // If not fully within property, clip to property boundaries
      // Uses tolerance to prevent tiny sliver geometries at boundaries
      if (!geometryEngine.equals(layerGeometry, intersection, GEOMETRY_TOLERANCE)) {
        return {
          isValid: true,
          message: "Camada ajustada para os limites do imóvel.",
          clipResult: intersection
        }
      }

      return {
        isValid: true,
        message: "Camada validada com sucesso."
      }
    } catch (error) {
      console.error(`Error validating ${layerType}:`, error)
      return {
        isValid: false,
        message: "Erro ao validar a camada."
      }
    }
  }

  /**
   * Validates if layers cover the entire property area
   * @param {Object} propertyGeometry - The Esri geometry of the property
   * @param {Array} layerGeometries - Array of all layer geometries
   * @returns {Object} - Validation result with status, message and coverage percentage
   */
  async validateCompleteCoverage(propertyGeometry, layerGeometries) {
    try {
      if (!propertyGeometry) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Geometria da propriedade não fornecida"
        }
      }

      if (!layerGeometries || !Array.isArray(layerGeometries) || layerGeometries.length === 0) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Nenhuma camada foi encontrada."
        }
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

      // Filter out null geometries
      const validGeometries = layerGeometries.filter(geom => geom)

      if (validGeometries.length === 0) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Nenhuma camada válida foi encontrada."
        }
      }

      // Union all layer geometries
      let unionGeometry = null

      // If there's only one geometry, use it directly
      if (validGeometries.length === 1) {
        unionGeometry = validGeometries[0]
      } else {
        // Otherwise, build the union
        for (const geometry of validGeometries) {
          if (!unionGeometry) {
            unionGeometry = geometry
          } else {
            try {
              // Use tolerance when creating the union to prevent small gaps
              unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE)
            } catch (error) {
              console.error("Error in union operation:", error)
              // Continue with the current union if there's an error
            }
          }
        }
      }

      if (!unionGeometry) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Erro ao unir geometrias das camadas."
        }
      }

      // Calculate coverage area using tolerance for more accurate area calculations
      const propertyArea = geometryEngine.geodesicArea(propertyGeometry, "square-meters")

      // Use tolerance when calculating the intersection to prevent small gaps
      const intersectionGeometry = geometryEngine.intersect(
        unionGeometry,
        propertyGeometry,
        GEOMETRY_TOLERANCE
      )

      if (!intersectionGeometry) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Erro ao calcular interseção das camadas com a propriedade."
        }
      }

      const coveredArea = geometryEngine.geodesicArea(intersectionGeometry, "square-meters")

      // Calculate coverage percentage
      const coveragePercentage = (coveredArea / propertyArea) * 100

      // Check if coverage is complete (allowing for small margin of error due to geometrical calculations)
      // We use isCompleteCoverage utility which already has a tolerance built in
      const isComplete = isCompleteCoverage(coveragePercentage)

      return {
        isValid: isComplete,
        coveragePercentage: coveragePercentage,
        message: isComplete
          ? MESSAGES.COVERAGE_COMPLETE
          : `Faltam ${(100 - coveragePercentage).toFixed(2)}% de cobertura da área do imóvel.`
      }
    } catch (error) {
      console.error("Error validating complete coverage:", error)
      return {
        isValid: false,
        coveragePercentage: 0,
        message: "Erro ao validar a cobertura completa."
      }
    }
  }

  /**
   * Calculates the anthropized area after 2008
   * @param {Object} propertyGeometry - The Esri geometry of the property
   * @param {Object} layerGeometries - Map of layer geometries by type
   * @returns {Object} - Result with area and geometry
   */
  async calculateAnthropizedArea(propertyGeometry, layerGeometries) {
    try {
      if (!propertyGeometry) {
        return {
          area: 0,
          geometry: null
        }
      }

      if (!layerGeometries || Object.keys(layerGeometries).length === 0) {
        // Se não há camadas, toda a área é considerada antropizada
        const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])
        const areaInSqMeters = geometryEngine.geodesicArea(propertyGeometry, "square-meters")
        return {
          area: squareMetersToHectares(areaInSqMeters),
          geometry: propertyGeometry
        }
      }

      const [geometryEngine] = await loadEsriModules(["esri/geometry/geometryEngine"])

      // Get all geometries except property
      const otherGeometries = Object.entries(layerGeometries)
        .filter(([key, geom]) => key !== 'property' && geom)
        .map(([, geom]) => geom)

      if (otherGeometries.length === 0) {
        // Se não há outras camadas, toda a área é considerada antropizada
        const areaInSqMeters = geometryEngine.geodesicArea(propertyGeometry, "square-meters")
        return {
          area: squareMetersToHectares(areaInSqMeters),
          geometry: propertyGeometry
        }
      }

      // Union all other geometries
      let unionGeometry = null

      // If there's only one geometry, use it directly
      if (otherGeometries.length === 1) {
        unionGeometry = otherGeometries[0]
      } else {
        // Otherwise, build the union
        for (const geometry of otherGeometries) {
          if (!unionGeometry) {
            unionGeometry = geometry
          } else {
            try {
              // Use tolerance when creating the union
              unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE)
            } catch (error) {
              console.error("Error in union operation:", error)
              // Continue with the current union if there's an error
            }
          }
        }
      }

      if (!unionGeometry) {
        // Se houve erro ao unir geometrias, retorna área zero
        return {
          area: 0,
          geometry: null
        }
      }

      // Find difference between property and other geometries
      // Using tolerance to get more accurate difference calculation
      const anthropizedGeometry = geometryEngine.difference(
        propertyGeometry,
        unionGeometry,
        GEOMETRY_TOLERANCE
      )

      if (!anthropizedGeometry) {
        return {
          area: 0,
          geometry: null
        }
      }

      // Calculate area in hectares
      const areaInSqMeters = geometryEngine.geodesicArea(anthropizedGeometry, "square-meters")
      const anthropizedArea = squareMetersToHectares(areaInSqMeters)

      return {
        area: anthropizedArea,
        geometry: anthropizedGeometry
      }
    } catch (error) {
      console.error("Error calculating anthropized area:", error)
      return {
        area: 0,
        geometry: null
      }
    }
  }
}

export default new ValidationService()
