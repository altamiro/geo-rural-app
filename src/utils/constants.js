/**
 * Constantes da aplicação
 */

// Tipos de camada
export const LAYER_TYPES = {
  PROPERTY: 'property',
  HEADQUARTERS: 'headquarters',
  CONSOLIDATED: 'consolidated',
  NATIVE: 'native',
  FALLOW: 'fallow',
  ROADWAY: 'roadway',
  RAILWAY: 'railway',
  POWERLINE: 'powerline',
  PPA: 'ppa',
  RESTRICTED: 'restricted',
  RESERVE: 'reserve'
};

// Categorias de camada
export const LAYER_CATEGORIES = {
  PROPERTY: 'property',
  SOIL_COVERAGE: 'soil_coverage',
  ADMINISTRATIVE: 'administrative',
  RESTRICTED_USE: 'restricted_use',
  LEGAL_RESERVE: 'legal_reserve'
};

// Simbologias (cores) para cada tipo de camada
export const LAYER_SYMBOLOGY = {
  'property': { color: [0, 0, 255, 0.5], outline: [0, 0, 255, 1] },
  'headquarters': { color: [255, 0, 0, 1], outline: [255, 0, 0, 1] },
  'consolidated': { color: [255, 255, 0, 0.5], outline: [255, 255, 0, 1] },
  'native': { color: [0, 128, 0, 0.5], outline: [0, 128, 0, 1] },
  'fallow': { color: [165, 42, 42, 0.5], outline: [165, 42, 42, 1] },
  'roadway': { color: [128, 128, 128, 0.5], outline: [128, 128, 128, 1] },
  'railway': { color: [0, 0, 0, 0.5], outline: [0, 0, 0, 1] },
  'powerline': { color: [255, 165, 0, 0.5], outline: [255, 165, 0, 1] },
  'ppa': { color: [0, 255, 255, 0.5], outline: [0, 255, 255, 1] },
  'restricted': { color: [255, 0, 255, 0.5], outline: [255, 0, 255, 1] },
  'reserve': { color: [50, 205, 50, 0.5], outline: [50, 205, 50, 1] }
};

// Tipos de geometria
export const GEOMETRY_TYPES = {
  POINT: 'point',
  POLYLINE: 'polyline',
  POLYGON: 'polygon',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle'
};

// Mensagens padrão
export const MESSAGES = {
  PROPERTY_REQUIRED: 'A área do imóvel deve ser desenhada primeiro.',
  INVALID_LOCATION: 'A área do imóvel deve estar dentro do município selecionado e no estado de SP.',
  HEADQUARTERS_INSIDE: 'A sede do imóvel deve estar dentro da área do imóvel.',
  LAYER_INSIDE: 'A camada deve estar dentro dos limites da área do imóvel.',
  COVERAGE_COMPLETE: 'A cobertura do imóvel está completa.',
  COVERAGE_INCOMPLETE: 'A cobertura do imóvel está incompleta.',
  DELETE_CONFIRM: 'Tem certeza que deseja excluir esta camada?',
  DELETE_PROPERTY_CONFIRM: 'Excluir a área do imóvel removerá todas as demais camadas. Deseja continuar?'
};

// Centro do mapa inicial (São Paulo)
export const INITIAL_MAP_CENTER = [-49.0, -22.0];
export const INITIAL_MAP_ZOOM = 7;

// Tolerância para cálculos geométricos (em metros)
export const GEOMETRY_TOLERANCE = 0.1;

// Status de validação
export const VALIDATION_STATUS = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

// Intervalos de cobertura para status
export const COVERAGE_THRESHOLDS = {
  WARNING: 95, // Abaixo disso é exception
  SUCCESS: 99.9 // Acima disso é success
};

// Lista de IDs de município no estado de SP
export const SP_MUNICIPALITIES = [
  'SP001', 'SP002', 'SP003', 'SP004', 'SP005',
  'SP006', 'SP007', 'SP008', 'SP009', 'SP010'
];

// Mapeamento de tipos de camada para seus nomes legíveis
export const LAYER_TYPE_NAMES = {
  'property': 'Área do Imóvel',
  'headquarters': 'Sede do Imóvel',
  'consolidated': 'Área Consolidada',
  'native': 'Vegetação Nativa',
  'fallow': 'Área de Pousio',
  'roadway': 'Rodovia',
  'railway': 'Ferrovia',
  'powerline': 'Linha de Transmissão',
  'ppa': 'Área de Preservação Permanente',
  'restricted': 'Uso Restrito',
  'reserve': 'Reserva Legal'
};

// Mapeamento de tipos de camada para suas categorias
export const LAYER_TYPE_CATEGORIES = {
  'property': LAYER_CATEGORIES.PROPERTY,
  'headquarters': LAYER_CATEGORIES.PROPERTY,
  'consolidated': LAYER_CATEGORIES.SOIL_COVERAGE,
  'native': LAYER_CATEGORIES.SOIL_COVERAGE,
  'fallow': LAYER_CATEGORIES.SOIL_COVERAGE,
  'roadway': LAYER_CATEGORIES.ADMINISTRATIVE,
  'railway': LAYER_CATEGORIES.ADMINISTRATIVE,
  'powerline': LAYER_CATEGORIES.ADMINISTRATIVE,
  'ppa': LAYER_CATEGORIES.RESTRICTED_USE,
  'restricted': LAYER_CATEGORIES.RESTRICTED_USE,
  'reserve': LAYER_CATEGORIES.LEGAL_RESERVE
};

// Configurações de opacidade padrão
export const DEFAULT_OPACITY = {
  FILL: 0.5,
  OUTLINE: 1.0
};

// Configurações de validação
export const VALIDATION_CONFIG = {
  // Porcentagem mínima de sobreposição necessária para considerar uma camada dentro do imóvel
  MIN_OVERLAP_PERCENTAGE: 95,
  // Distância máxima (em metros) para considerar um ponto dentro de um polígono com tolerância
  POINT_TOLERANCE: 5
};

// Formatos de data
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  SHORT: 'DD/MM/YYYY'
};

// Unidades de medida
export const UNITS = {
  AREA: {
    HECTARE: 'ha',
    SQUARE_METER: 'm²',
    SQUARE_KILOMETER: 'km²'
  },
  DISTANCE: {
    METER: 'm',
    KILOMETER: 'km'
  }
};

// Fatores de conversão
export const CONVERSION_FACTORS = {
  SQUARE_METERS_TO_HECTARES: 0.0001,
  HECTARES_TO_SQUARE_METERS: 10000,
  SQUARE_METERS_TO_SQUARE_KILOMETERS: 0.000001,
  SQUARE_KILOMETERS_TO_SQUARE_METERS: 1000000
};
