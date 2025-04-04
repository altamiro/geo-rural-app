# Geo Rural App

Aplicativo de georreferenciamento para imóveis rurais.

## Visão Geral

Este aplicativo permite a vetorização de diferentes camadas geográficas dentro dos limites de um imóvel localizado em um município específico do estado de São Paulo. O sistema possui uma interface amigável e validação conforme regras de negócio específicas.

## Tecnologias Utilizadas

- Vue.js 2.6.14
- ArcGIS Maps SDK for JavaScript
- Element-UI 2.15.14
- Pug 3.0.3 para templates
- Vuex para gerenciamento de estado

## Funcionalidades Principais

- Visualização de mapa com camadas de imagem de fundo
- Ferramentas de vetorização para diferentes tipos de camadas
- Validação de geometrias conforme regras de negócio
- Cálculo automático de áreas (total, líquida, antropizada)
- Verificação de cobertura completa do imóvel

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run serve

# Compilar para produção
npm run build

# Executar linter
npm run lint
```

## Estrutura do Projeto

```
src/
├── assets/
│   └── styles/
│       ├── main.scss
│       └── variables.scss
├── components/
│   ├── common/
│   │   ├── AppHeader.vue
│   │   └── AppFooter.vue
│   ├── map/
│   │   ├── MapContainer.vue
│   │   ├── LayerSelector.vue
│   │   ├── DrawingTools.vue
│   │   ├── MapLegend.vue
│   │   └── PropertyInfo.vue
│   └── sidebar/
│       ├── SidebarContainer.vue
│       ├── LayerList.vue
│       ├── LayerDetails.vue
│       └── ValidationPanel.vue
├── services/
│   ├── arcgis.service.js
│   ├── validation.service.js
│   └── calculation.service.js
├── store/
│   ├── index.js
│   ├── modules/
│   │   ├── map.js
│   │   ├── layers.js
│   │   └── property.js
├── utils/
│   ├── geometry.js
│   ├── validation.js
│   └── constants.js
├── views/
│   └── GeoView.vue
├── App.vue
└── main.js
```

## Regras de Negócio

- A área do imóvel deve estar dentro do município declarado e no estado de SP
- A sede do imóvel deve estar dentro da área do imóvel e não pode sobrepor hidrografia
- A área líquida do imóvel é calculada subtraindo áreas de servidão administrativa
- A área antropizada é calculada pela fórmula: Área do imóvel - (áreas vetorizadas restantes)
- A cobertura completa (100%) do imóvel é obrigatória
- A exclusão da área do imóvel remove todas as demais camadas automaticamente
