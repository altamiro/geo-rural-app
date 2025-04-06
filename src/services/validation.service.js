/**
 * Service for validating layer geometries based on business rules
 */
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import { MESSAGES, GEOMETRY_TOLERANCE } from "@/utils/constants";
import { squareMetersToHectares } from "@/utils/geometry";
import { isCompleteCoverage } from "@/utils/validation";

class ValidationService {
  /**
   * Validates if a property polygon is within a specified municipality in São Paulo state
   * @param {Object} propertyGeometry - The Esri geometry of the property
   * @param {String} municipalityId - The ID of the declared municipality
   * @param {Object} municipalityGeometry - The Esri geometry of the municipality (optional)
   * @returns {Promise<Object>} - Validation result with status and message
   */
  async validatePropertyLocation(propertyGeometry, municipalityId, municipalityGeometry = null) {
    try {
      if (!propertyGeometry) {
        return {
          isValid: false,
          message: "Geometria da propriedade não fornecida",
        };
      }

      if (!municipalityId) {
        return {
          isValid: false,
          message: "ID do município não fornecido",
        };
      }

      // Verificar se o município está no estado de SP
      // Em um ambiente real, utilizaríamos um serviço ou banco de dados para validar
      const isSP = municipalityId.startsWith("35"); // IDs de municípios SP começam com 35

      if (!isSP) {
        return {
          isValid: false,
          message: "O município deve estar localizado no estado de São Paulo",
        };
      }

      // Se temos a geometria do município, verificar se a propriedade está dentro dele
      if (municipalityGeometry) {
        // Verificar se a propriedade está dentro do município, com uma pequena tolerância
        const isWithin = geometryEngine.within(
          propertyGeometry,
          municipalityGeometry,
          GEOMETRY_TOLERANCE
        );

        // Se não estiver totalmente dentro, verificar se há sobreposição significativa
        if (!isWithin) {
          const intersection = geometryEngine.intersect(propertyGeometry, municipalityGeometry);

          if (!intersection) {
            return {
              isValid: false,
              message: "A propriedade deve estar dentro dos limites do município selecionado",
            };
          }

          // Calcular área de interseção e comparar com a área total da propriedade
          const intersectionArea = geometryEngine.geodesicArea(intersection, "square-meters");
          const propertyArea = geometryEngine.geodesicArea(propertyGeometry, "square-meters");

          const overlapPercentage = (intersectionArea / propertyArea) * 100;

          // Se a sobreposição for menor que 90%, consideramos inválido
          if (overlapPercentage < 90) {
            return {
              isValid: false,
              message: `A propriedade deve estar majoritariamente dentro do município (sobreposição atual: ${overlapPercentage.toFixed(
                2
              )}%)`,
            };
          }
        }
      }

      // No ambiente de demonstração, validamos como verdadeiro se não temos a geometria
      // Em um ambiente real, faríamos uma verificação mais rigorosa
      return {
        isValid: true,
        message: "Propriedade válida para o município selecionado",
      };
    } catch (error) {
      console.error("Erro ao validar localização da propriedade:", error);
      return {
        isValid: false,
        message: "Erro ao validar localização: " + error.message,
      };
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
          message: "Geometrias não fornecidas para validação",
        };
      }

      // Check if headquarters is within property, using tolerance for better precision
      const isWithinProperty = geometryEngine.within(
        headquartersGeometry,
        propertyGeometry,
        GEOMETRY_TOLERANCE
      );

      if (!isWithinProperty) {
        return {
          isValid: false,
          message: MESSAGES.HEADQUARTERS_INSIDE,
        };
      }

      // Check if headquarters overlaps with hydrography, using tolerance to catch near intersections
      for (const hydroGeometry of hydrographyGeometries) {
        if (!hydroGeometry) continue;

        const overlapsHydrography = geometryEngine.intersects(
          headquartersGeometry,
          hydroGeometry,
          GEOMETRY_TOLERANCE
        );

        if (overlapsHydrography) {
          return {
            isValid: false,
            message: "A sede do imóvel não pode estar em área de hidrografia.",
          };
        }
      }

      return {
        isValid: true,
        message: "Sede do imóvel validada com sucesso.",
      };
    } catch (error) {
      console.error("Error validating headquarters:", error);
      return {
        isValid: false,
        message: "Erro ao validar a sede do imóvel.",
      };
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
          message: "Geometrias não fornecidas para validação",
        };
      }

      // Check if layer is within property, using tolerance for better precision
      const intersection = geometryEngine.intersect(
        layerGeometry,
        propertyGeometry,
        GEOMETRY_TOLERANCE
      );

      if (!intersection) {
        return {
          isValid: false,
          message: MESSAGES.LAYER_INSIDE,
        };
      }

      // If not fully within property, clip to property boundaries
      // Uses tolerance to prevent tiny sliver geometries at boundaries
      if (!geometryEngine.equals(layerGeometry, intersection, GEOMETRY_TOLERANCE)) {
        return {
          isValid: true,
          message: "Camada ajustada para os limites do imóvel.",
          clipResult: intersection,
        };
      }

      return {
        isValid: true,
        message: "Camada validada com sucesso.",
      };
    } catch (error) {
      console.error(`Error validating ${layerType}:`, error);
      return {
        isValid: false,
        message: "Erro ao validar a camada.",
      };
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
          message: "Geometria da propriedade não fornecida",
        };
      }

      if (!layerGeometries || !Array.isArray(layerGeometries) || layerGeometries.length === 0) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Nenhuma camada foi encontrada.",
        };
      }

      // Filter out null geometries
      const validGeometries = layerGeometries.filter((geom) => geom);

      if (validGeometries.length === 0) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Nenhuma camada válida foi encontrada.",
        };
      }

      // Union all layer geometries
      let unionGeometry = null;

      // If there's only one geometry, use it directly
      if (validGeometries.length === 1) {
        unionGeometry = validGeometries[0];
      } else {
        // Otherwise, build the union
        for (const geometry of validGeometries) {
          if (!unionGeometry) {
            unionGeometry = geometry;
          } else {
            try {
              // Use tolerance when creating the union to prevent small gaps
              unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE);
            } catch (error) {
              console.error("Error in union operation:", error);
              // Continue with the current union if there's an error
            }
          }
        }
      }

      if (!unionGeometry) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Erro ao unir geometrias das camadas.",
        };
      }

      // Calculate coverage area using tolerance for more accurate area calculations
      const propertyArea = geometryEngine.geodesicArea(propertyGeometry, "square-meters");

      // Use tolerance when calculating the intersection to prevent small gaps
      const intersectionGeometry = geometryEngine.intersect(
        unionGeometry,
        propertyGeometry,
        GEOMETRY_TOLERANCE
      );

      if (!intersectionGeometry) {
        return {
          isValid: false,
          coveragePercentage: 0,
          message: "Erro ao calcular interseção das camadas com a propriedade.",
        };
      }

      const coveredArea = geometryEngine.geodesicArea(intersectionGeometry, "square-meters");

      // Calculate coverage percentage
      const coveragePercentage = (coveredArea / propertyArea) * 100;

      // Check if coverage is complete (allowing for small margin of error due to geometrical calculations)
      // We use isCompleteCoverage utility which already has a tolerance built in
      const isComplete = isCompleteCoverage(coveragePercentage);

      return {
        isValid: isComplete,
        coveragePercentage: coveragePercentage,
        message: isComplete
          ? MESSAGES.COVERAGE_COMPLETE
          : `Faltam ${(100 - coveragePercentage).toFixed(2)}% de cobertura da área do imóvel.`,
      };
    } catch (error) {
      console.error("Error validating complete coverage:", error);
      return {
        isValid: false,
        coveragePercentage: 0,
        message: "Erro ao validar a cobertura completa.",
      };
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
          geometry: null,
        };
      }

      if (!layerGeometries || Object.keys(layerGeometries).length === 0) {
        // Se não há camadas, toda a área é considerada antropizada
        const areaInSqMeters = geometryEngine.geodesicArea(propertyGeometry, "square-meters");
        return {
          area: squareMetersToHectares(areaInSqMeters),
          geometry: propertyGeometry,
        };
      }

      // Get all geometries except property
      const otherGeometries = Object.entries(layerGeometries)
        .filter(([key, geom]) => key !== "property" && geom)
        .map(([, geom]) => geom);

      if (otherGeometries.length === 0) {
        // Se não há outras camadas, toda a área é considerada antropizada
        const areaInSqMeters = geometryEngine.geodesicArea(propertyGeometry, "square-meters");
        return {
          area: squareMetersToHectares(areaInSqMeters),
          geometry: propertyGeometry,
        };
      }

      // Union all other geometries
      let unionGeometry = null;

      // If there's only one geometry, use it directly
      if (otherGeometries.length === 1) {
        unionGeometry = otherGeometries[0];
      } else {
        // Otherwise, build the union
        for (const geometry of otherGeometries) {
          if (!unionGeometry) {
            unionGeometry = geometry;
          } else {
            try {
              // Use tolerance when creating the union
              unionGeometry = geometryEngine.union([unionGeometry, geometry], GEOMETRY_TOLERANCE);
            } catch (error) {
              console.error("Error in union operation:", error);
              // Continue with the current union if there's an error
            }
          }
        }
      }

      if (!unionGeometry) {
        // Se houve erro ao unir geometrias, retorna área zero
        return {
          area: 0,
          geometry: null,
        };
      }

      // Find difference between property and other geometries
      // Using tolerance to get more accurate difference calculation
      const anthropizedGeometry = geometryEngine.difference(
        propertyGeometry,
        unionGeometry,
        GEOMETRY_TOLERANCE
      );

      if (!anthropizedGeometry) {
        return {
          area: 0,
          geometry: null,
        };
      }

      // Calculate area in hectares
      const areaInSqMeters = geometryEngine.geodesicArea(anthropizedGeometry, "square-meters");
      const anthropizedArea = squareMetersToHectares(areaInSqMeters);

      return {
        area: anthropizedArea,
        geometry: anthropizedGeometry,
      };
    } catch (error) {
      console.error("Error calculating anthropized area:", error);
      return {
        area: 0,
        geometry: null,
      };
    }
  }
}

export default new ValidationService();
