<template lang="pug">
  .drawing-tools
    .tool-container
      .tool-title Ferramentas de Desenho
      .tools-list
        .tool-button(@click="activateTool('polygon')" :class="{ active: activeTool === 'polygon' }")
          el-tooltip(content="Polígono" placement="right")
            i.el-icon-share
        .tool-button(@click="activateTool('rectangle')" :class="{ active: activeTool === 'rectangle' }")
          el-tooltip(content="Retângulo" placement="right")
            i.el-icon-picture-outline
        .tool-button(@click="activateTool('circle')" :class="{ active: activeTool === 'circle' }")
          el-tooltip(content="Círculo" placement="right")
            i.el-icon-refresh-right
        .tool-button(@click="activateTool('point')" :class="{ active: activeTool === 'point' }")
          el-tooltip(content="Ponto" placement="right")
            i.el-icon-location-information
        .tool-button(@click="activateTool('edit')" :class="{ active: activeTool === 'edit' }")
          el-tooltip(content="Editar" placement="right")
            i.el-icon-edit
        .tool-button(@click="activateTool('delete')" :class="{ active: activeTool === 'delete' }")
          el-tooltip(content="Excluir" placement="right")
            i.el-icon-delete

    .zoom-container
      .zoom-button(@click="zoomIn")
        i.el-icon-plus
      .zoom-button(@click="zoomOut")
        i.el-icon-minus
      .zoom-button(@click="zoomToExtent")
        i.el-icon-full-screen
      .zoom-button(@click="panMode")
        i.el-icon-rank
</template>

<script>
import { mapActions } from 'vuex'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'

export default {
  name: 'DrawingTools',
  inject: ['mapReady', 'sketchReady'],
  props: {
    selectedLayer: {
      type: String,
      default: null
    },
    isPropertyDrawn: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTool: null,
      sketchViewModel: null,
      view: null
    }
  },
  computed: {
    isLayerSelected() {
      return !!this.selectedLayer
    }
  },
  mounted() {
    this.initializeSketchViewModel()
  },
  methods: {
    ...mapActions({
      deleteLayer: 'layers/deleteLayer'
    }),
    initializeSketchViewModel() {
      // Verificar se mapa e ferramentas estão prontos
      if (!this.mapReady() || !this.sketchReady()) {
        return
      }

      try {
        // Create a graphics layer to use with SketchViewModel
        const graphicsLayer = new GraphicsLayer()

        // Get the map view
        this.view = this.$store.state.map.view

        // Add the graphics layer to the map
        this.view.map.add(graphicsLayer)

        // Create SketchViewModel
        this.sketchViewModel = new SketchViewModel({
          view: this.view,
          layer: graphicsLayer
        })

        // Add event listeners for sketch events if needed
        this.sketchViewModel.on('create', (event) => {
          if (event.state === 'complete') {
            // Handle creation of graphic
            console.log('Graphic created:', event.graphic)
          }
        })

        this.sketchViewModel.on('update', (event) => {
          if (event.state === 'complete') {
            // Handle updating of graphic
            console.log('Graphic updated:', event.graphics)
          }
        })
      } catch (error) {
        console.error("Erro ao inicializar SketchViewModel:", error)
        this.$message.error(`Erro ao inicializar ferramentas de desenho: ${error.message}`)
      }
    },
    activateTool(tool) {
      // Verificar se mapa e ferramentas estão prontos
      if (!this.mapReady() || !this.sketchReady()) {
        this.$message.warning('As ferramentas de desenho ainda não estão prontas. Aguarde um momento.');
        return;
      }

      // Valida se uma camada está selecionada
      if (!this.isLayerSelected) {
        this.$message.warning('Selecione uma camada antes de usar as ferramentas de desenho.')
        return
      }

      // Verifica se a propriedade está desenhada antes de adicionar outras camadas
      if (this.selectedLayer !== 'property' && !this.isPropertyDrawn) {
        this.$message.warning('Você deve desenhar a área do imóvel primeiro.')
        return
      }

      // Define a ferramenta ativa
      this.activeTool = tool

      // Emitir evento para o componente pai saber qual ferramenta foi ativada
      this.$emit('draw', { tool, layerId: this.selectedLayer })

      // Definir modo de criação para cada ferramenta
      try {
        switch (tool) {
          case 'polygon':
            this.sketchViewModel.create('polygon', { mode: 'freehand' })
            break

          case 'rectangle':
            this.sketchViewModel.create('rectangle')
            break

          case 'circle':
            this.sketchViewModel.create('circle')
            break

          case 'point':
            // Só permite ponto para a sede do imóvel
            if (this.selectedLayer !== 'headquarters') {
              this.$message.warning('A ferramenta de ponto só pode ser usada para a sede do imóvel.')
              this.activeTool = null
              return
            }
            this.sketchViewModel.create('point')
            break

          case 'edit':
            this.sketchViewModel.update()
            break

          case 'delete':
            this.$confirm('Tem certeza que deseja excluir esta camada?', 'Confirmação', {
              confirmButtonText: 'Sim',
              cancelButtonText: 'Não',
              type: 'warning'
            }).then(() => {
              this.deleteLayer(this.selectedLayer)
              this.activeTool = null
            }).catch(() => {
              this.activeTool = null
            })
            break
        }
      } catch (error) {
        console.error("Erro ao ativar ferramenta de desenho:", error)
        this.$message.error(`Erro ao ativar a ferramenta: ${error.message}`)
        this.activeTool = null
      }
    },

    zoomIn() {
      if (this.view) {
        this.view.zoom += 1
      }
    },

    zoomOut() {
      if (this.view) {
        this.view.zoom -= 1
      }
    },

    zoomToExtent() {
      if (this.view && this.sketchViewModel && this.sketchViewModel.layer) {
        // Zoom para a extensão de todos os gráficos
        this.view.goTo(this.sketchViewModel.layer.graphics)
      }
    },

    panMode() {
      if (this.sketchViewModel) {
        // Cancelar qualquer ferramenta de desenho ativa
        this.sketchViewModel.cancel()
        this.activeTool = null

        // Se a view existir, ativar o modo de pan
        if (this.view) {
          this.view.container.style.cursor = 'default'
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.drawing-tools {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 10px;
}

.tool-container {
  margin-bottom: 15px;
}

.tool-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-button {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #ecf5ff;
    color: #409EFF;
  }

  i {
    font-size: 18px;
    margin-right: 10px;
  }
}

.zoom-container {
  display: flex;
  justify-content: space-between;
}

.zoom-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f5f7fa;
  transition: all 0.3s ease;

  &:hover {
    background-color: #e4e7ed;
  }

  i {
    font-size: 18px;
    color: #606266;
  }
}
</style>
