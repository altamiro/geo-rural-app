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
      // Check if a layer is selected
      if (!this.isLayerSelected) {
        this.$message.warning('Selecione uma camada antes de usar as ferramentas de desenho.')
        return
      }

      // For non-property layers, check if property is drawn
      if (this.selectedLayer !== 'property' && !this.isPropertyDrawn) {
        this.$message.warning('Você deve desenhar a área do imóvel primeiro.')
        return
      }

      // Set active tool and configure sketch view model
      this.activeTool = tool

      if (!this.sketchViewModel) {
        console.error("Sketch view model not initialized")
        return
      }

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
          // Only allow point for headquarters
          if (this.selectedLayer !== 'headquarters') {
            this.$message.warning('A ferramenta de ponto só pode ser usada para a sede do imóvel.')
            this.activeTool = null
            return
          }
          this.sketchViewModel.create('point')
          break

        case 'edit':
          this.sketchViewModel.update(this.sketchViewModel.updateGraphics)
          break

        case 'delete':
          // Show confirmation dialog
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
        // Zoom to the extent of all graphics
        this.view.goTo(this.sketchViewModel.layer.graphics)
      }
    },

    panMode() {
      if (this.sketchViewModel) {
        // Deactivate any drawing tools and enable pan mode
        this.sketchViewModel.cancel()
        this.activeTool = null
      }
    }
