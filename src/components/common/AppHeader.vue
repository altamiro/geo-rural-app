<template lang="pug">
  .app-header
    .header-container
      .logo
        img(src="../assets/logo.png" alt="Logo")
        .app-title Georreferenciamento de Imóveis Rurais

      .header-actions
        .municipality-selector
          span.label Município:
          el-select(v-model="selectedMunicipality" placeholder="Selecione o município" @change="changeMunicipality")
            el-option(
              v-for="item in municipalities"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            )

        .header-buttons
          el-button(type="primary" @click="saveChanges") Salvar
          el-button(@click="openHelp") Ajuda
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'AppHeader',
  data() {
    return {
      selectedMunicipality: '',
      municipalities: [
        { id: 'SP001', name: 'São Paulo' },
        { id: 'SP002', name: 'Campinas' },
        { id: 'SP003', name: 'Ribeirão Preto' },
        { id: 'SP004', name: 'São José dos Campos' },
        { id: 'SP005', name: 'Santos' },
        { id: 'SP006', name: 'Sorocaba' },
        { id: 'SP007', name: 'Bauru' },
        { id: 'SP008', name: 'Piracicaba' },
        { id: 'SP009', name: 'Jundiaí' },
        { id: 'SP010', name: 'São José do Rio Preto' }
      ]
    }
  },
  methods: {
    ...mapActions({
      setMunicipality: 'property/setMunicipality'
    }),
    changeMunicipality() {
      const municipality = this.municipalities.find(m => m.id === this.selectedMunicipality)

      if (municipality) {
        this.setMunicipality({
          id: municipality.id,
          name: municipality.name
        })

        // Display confirmation message
        this.$message({
          message: `Município selecionado: ${municipality.name}`,
          type: 'success'
        })
      }
    },
    saveChanges() {
      // Validate if all required data is present
      this.$confirm('Deseja salvar todas as alterações?', 'Confirmação', {
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }).then(() => {
        // Would submit data to backend
        this.$message({
          type: 'success',
          message: 'Dados salvos com sucesso!'
        })
      }).catch(() => {
        // User canceled
      })
    },
    openHelp() {
      this.$alert('Sistema de Georreferenciamento de Imóveis Rurais\n\n' +
        '1. Selecione o município do imóvel\n' +
        '2. Desenhe a área do imóvel\n' +
        '3. Desenhe a sede do imóvel\n' +
        '4. Adicione outras camadas conforme necessário\n' +
        '5. Verifique se a cobertura está completa\n' +
        '6. Salve os dados', 'Ajuda', {
        confirmButtonText: 'OK'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;

  img {
    height: 40px;
    margin-right: 15px;
  }

  .app-title {
    font-size: 18px;
    font-weight: bold;
    color: #409EFF;
  }
}

.header-actions {
  display: flex;
  align-items: center;

  .municipality-selector {
    display: flex;
    align-items: center;
    margin-right: 20px;

    .label {
      margin-right: 10px;
      font-weight: bold;
    }
  }

  .header-buttons {
    display: flex;
    gap: 10px;
  }
}
</style>
