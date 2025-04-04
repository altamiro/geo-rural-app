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
