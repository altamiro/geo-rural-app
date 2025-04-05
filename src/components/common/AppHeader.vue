<template lang="pug">
  .app-header
    .header-container
      .logo
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
import municipalitiesData from '@/dados/geojs-35-mun.json'

export default {
  name: 'AppHeader',
  data() {
    return {
      selectedMunicipality: '',
      municipalities: []
    }
  },
  created() {
    // Processar os dados do GeoJSON na inicialização do componente
    this.processGeoJSONData()
  },
  methods: {
    ...mapActions({
      setMunicipality: 'property/setMunicipality',
      addMunicipalityLayer: 'map/addMunicipalityLayer'
    }),

    // Método para processar o GeoJSON e extrair os municípios
    processGeoJSONData() {
      try {
        // Verificar se temos dados válidos
        if (!municipalitiesData || !municipalitiesData.features || !Array.isArray(municipalitiesData.features)) {
          console.error('Formato de dados de municípios inválido');
          this.municipalities = []; // Definir um array vazio como fallback
          return;
        }

        // Mapear as features com validação adicional
        this.municipalities = municipalitiesData.features
          .filter(feature => feature && feature.properties && feature.geometry)
          .map(feature => ({
            id: feature.properties.id || '',
            name: feature.properties.name || 'Sem nome',
            description: feature.properties.description || '',
            geometry: feature.geometry
          }));

        console.log(`Carregados ${this.municipalities.length} municípios do arquivo GeoJSON`);
      } catch (error) {
        console.error('Erro ao processar dados GeoJSON:', error);
        this.municipalities = [];
      }
    },

    changeMunicipality() {
      const municipality = this.municipalities.find(m => m.id === this.selectedMunicipality);

      if (municipality) {
        // Validar a geometria antes de prosseguir
        if (!municipality.geometry ||
          !municipality.geometry.type ||
          !municipality.geometry.coordinates ||
          !Array.isArray(municipality.geometry.coordinates) ||
          !Array.isArray(municipality.geometry.coordinates[0])) {
          this.$message.error(`Geometria inválida para o município ${municipality.name}`);
          return;
        }

        // Definir município no store
        this.setMunicipality({
          id: municipality.id,
          name: municipality.name
        });

        // Adicionar limite do município ao mapa
        this.addMunicipalityLayer(municipality.geometry);

        // Mensagem de confirmação
        this.$message({
          message: `Município selecionado: ${municipality.name}`,
          type: 'success'
        });

        // Centralizar o mapa no município
        this.$emit('zoom-to-municipality', municipality.geometry);
      }
    },

    saveChanges() {
      // Mesma lógica anterior
      this.$confirm('Deseja salvar todas as alterações?', 'Confirmação', {
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: 'Dados salvos com sucesso!'
        })
      }).catch(() => {
        // Usuário cancelou
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
