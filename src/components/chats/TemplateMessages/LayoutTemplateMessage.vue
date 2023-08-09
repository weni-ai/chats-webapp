<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <section class="template-messages">
      <div @click="$emit('close')" style="cursor: pointer">
        <unnnic-icon icon="keyboard-arrow-left-1" /> Selecionar fluxo
        <unnnic-tool-tip
          enabled
          maxWidth="18rem"
          text="Os fluxos disponíveis aqui devem ser previamente cadastrados no módulo de fluxos, caso tenha dúvidas converse com seu gerente."
          side="bottom"
        >
          <unnnic-icon-svg scheme="neutral-clean" icon="information-circle-4" size="sm" />
        </unnnic-tool-tip>
      </div>
      <div style="padding-left: 12px" v-if="!loadingFlows">
        <unnnic-select
          v-model="flowUuid"
          label="Selecionar fluxo"
          size="md"
          class="input"
          @input="templateMessage(flowUuid)"
        >
          <!-- <option value=""></option> -->
          <option
            v-for="item in templates"
            :key="item.uuid"
            :value="item.uuid"
            :selected="item.uuid === flowUuid"
          >
            {{ item.name }}
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
      @click="sendTemplate"
    >
      <unnnic-button
        :disabled="selectedFlow === ''"
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

  data: () => ({
    showModalProgress: false,
    showModal: false,
    template: '',
    selectedTemplate: '',
    filteredTemplate: '',
    flowUuid: '',
    templates: [],
    loading: false,
    selectedFlow: '',
    loadingFlows: false,
    status: '',
    progressText: '',
  }),

  mounted() {
    this.flows();
  },

  props: {
    contacts: {
      type: Array,
    },
    groups: {
      type: Array,
    },
    selectedContact: {
      type: Object,
    },
  },

  methods: {
    async flows() {
      this.loadingFlows = true;
      try {
        const response = await TemplateMessages.getFlows();
        this.templates = response.results;
        this.loadingFlows = false;
      } catch (error) {
        this.loadingFlows = false;
        console.log(error);
      }
    },

    async templateMessage(uuid) {
      this.selectedFlow = uuid;
      try {
        const response = await TemplateMessages.getTemplateFlow(uuid);
        this.template = response.results;
      } catch (error) {
        console.log(error);
      }
    },

    async sendTemplate() {
      this.loading = true;
      if (!this.selectedContact) this.findId(this.contacts, this.groups);
      const prepareObj = {
        flow: this.selectedFlow,
        groups: this.idGruops,
        contacts: this.selectedContact ? [this.selectedContact.external_id] : this.idContactsList,
        room: this.selectedContact ? this.selectedContact.uuid : null,
      };
      this.openModalProgress();
      try {
        await TemplateMessages.sendTemplate(prepareObj);
        this.loading = false;
        this.closeModaProgress();
      } catch (error) {
        this.loading = false;
        console.log(error);
      }
    },

    findId(contacts, groups) {
      this.idContactsList = contacts.map((el) => el.uuid);
      this.idGruops = groups.map((el) => el.uuid);
    },

    openModalProgress() {
      this.showModalProgress = true;
    },

    closeModaProgress() {
      this.showModalProgress = false;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      window.location.reload(true);
    },
  },
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
