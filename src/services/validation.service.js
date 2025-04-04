/**
 * Service for validating layer geometries based on business rules
 */
import { loadModules } from 'esri-loader'
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
      // Check if municipality is in São Paulo state
      if (!isSaoPauloMunicipality(municipalityId)) {
        console.error("Municipality not in São Paulo state")
        return false
      }

      // Load required modules
      const [geometryEngine, FeatureLayer] = await loadModules([
        "esri/geometry/geometryEngine",
        "esri/layers/FeatureLayer"
      ])

      // This would be a reference to the SP state municipalities layer
      // In a real implementation, this would be fetched from a service
      const municipalitiesLayer = new FeatureLayer({
        url: "https://services.arcgis.com/example/municipalities"
      })

      // Query the specific municipality
      const query = municipalitiesLayer.createQuery()
      query.where = `MUNICIPALITY_ID = '${municipalityId}'`
      query.returnGeometry = true

      const results = await municipalitiesLayer.queryFeatures(query)

      if (results.features.length === 0) {
        console.error("Municipality not found")
        return false
      }

      const municipalityGeometry = results.features[0].geometry

      // Check if property is within municipality, using tolerance for more accurate results
      // with complex geometries
      const isWithinMunicipality = geometryEngine.within(
        propertyGeometry,
        municipalityGeometry,
        GEOMETRY_TOLERANCE
      )

      return isWithinMunicipality
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
  async validateHeadquarters(headquartersGeometry, propertyGeometry, hydrographyGeometries) {
    try {
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

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
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

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

      // Layer-specific validations
      switch (layerType) {
        case 'native':
          // Additional validations for native vegetation
          break

        case 'consolidated':
          // Additional validations for consolidated areas
          break

        case 'fallow':
          // Additional validations for fallow areas
          break
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
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

      // Union all layer geometries
      let unionGeometry = null

      for (const geometry of layerGeometries) {
        if (!unionGeometry) {
          unionGeometry = geometry
        } else {
          // Use tolerance when creating the union to prevent small gaps
          unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE)
        }
      }

      if (!unionGeometry) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Nenhuma camada foi encontrada."
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
   * @param {Array} layerGeometries - Map of layer geometries by type
   * @returns {Object} - Result with area and geometry
   */
  async calculateAnthropizedArea(propertyGeometry, layerGeometries) {
    try {
      const [geometryEngine] = await loadModules(["esri/geometry/geometryEngine"])

      // Get all geometries except property
      const otherGeometries = Object.values(layerGeometries).filter(g => g !== propertyGeometry)

      // Union all other geometries
      let unionGeometry = null

      for (const geometry of otherGeometries) {
        if (!unionGeometry) {
          unionGeometry = geometry
        } else {
          // Use tolerance when creating the union to get more accurate results
          unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE)
        }
      }

      if (!unionGeometry) {
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
