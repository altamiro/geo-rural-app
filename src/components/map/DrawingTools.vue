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
import { mapActions, mapState } from 'vuex'

export default {
  name: 'DrawingTools',
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
      activeTool: null
    }
  },
  computed: {
    ...mapState({
      sketchViewModel: state => state.map.sketchViewModel,
      view: state => state.map.view
    }),
    isLayerSelected() {
      return !!this.selectedLayer
    }
  },
  methods: {
    ...mapActions([
      'deleteLayer'
    ]),
    activateTool(tool) {
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

      // Define a ferramenta ativa e configura o SketchViewModel
      this.activeTool = tool

      if (!this.sketchViewModel) {
        console.error("Sketch view model não inicializado")
        return
      }

      // Definir modo de criação para cada ferramenta
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
