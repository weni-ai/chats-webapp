<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <section class="template-messages">
      <div @click="$emit('close')" style="cursor: pointer">
        <unnnic-icon icon="keyboard-arrow-left-1" /> Selecionar modelo de mensagem
        <unnnic-tool-tip enabled text="Não definido ainda" side="right">
          <unnnic-icon-svg scheme="neutral-clean" icon="information-circle-4" size="sm" />
        </unnnic-tool-tip>
      </div>
      <div style="padding-left: 12px">
        <unnnic-select
          v-if="templates.length > 1"
          v-model="filteredTemplate"
          label="Selecionar modelo"
          size="md"
          class="input"
          @input="selectTemplate(filteredTemplate)"
        >
          <option
            v-for="el in templates"
            :key="el.id"
            :value="el.content"
            :selected="el === filteredTemplate"
          >
            {{ el.name }}
          </option>
        </unnnic-select>
      </div>
      <div style="padding-left: 12px">
        <div class="selected-template" v-if="this.selectedTemplate">
          <div class="example-text">
            <span>{{ this.selectedTemplate }}</span>
          </div>
        </div>
      </div>
      <div v-if="showModalProgress">
        <modal-progress-template-submission @close="closeModaProgress" />
      </div>
      <div v-if="showModal">
        <unnnicModal
          modalIcon="check-circle-1-1"
          scheme="feedback-green"
          text="Modelo de Mensagem enviado"
          description="Sua mensagem foi enviada aos contatos selecionados"
          @close="closeModal"
        />
      </div>
    </section>
    <div
      style="display: flex; justify-content: space-between; padding-left: 12px"
      @click="openModalProgress"
    >
      <unnnic-button
        :disabled="selectedTemplate === ''"
        text="Enviar"
        size="small"
        type="secondary"
        iconLeft="send-email-3-1"
        style="width: 100%"
      />
    </div>
  </div>
</template>

<script>
import TemplateMessages from '@/services/api/resources/chats/templateMessage.js';
import ModalProgressTemplateSubmission from './ModalProgressTemplateSubmission';

export default {
  name: 'LayoutTemplateMessage',

  components: {
    ModalProgressTemplateSubmission,
  },

  mounted() {
    this.groupList();
  },
  methods: {
    openModalProgress() {
      this.showModalProgress = true;
    },
    closeModaProgress() {
      this.showModalProgress = false;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    selectTemplate(template) {
      this.selectedTemplate = template;
    },

    async groupList() {
      try {
        const response = await TemplateMessages.getFlows();
        this.templates = response.results;
        console.log(this.templates, `listOfGroups`);
      } catch (error) {
        console.log(error);
      }
    },
  },
  data: () => ({
    showModalProgress: false,
    showModal: false,
    template: '',
    selectedTemplate: '',
    filteredTemplate: '',
    templates: [],
  }),
};
</script>

<style lang="scss" scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;
  padding-bottom: $unnnic-spacing-inset-nano;
  padding: 0px;

  .template-messages {
    flex: 1 1;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;
    overflow-y: auto;
  }
}
.selected-template {
  width: 100%;
  max-width: 99%;
  border-radius: 0.6rem;
  padding: 1rem;
  background-color: $unnnic-color-background-carpet;
  .example-text {
    word-break: break-word;
    font-family: $unnnic-font-family-secondary;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-md;
  }
}
</style>
