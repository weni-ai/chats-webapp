<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <section class="template-messages">
      <div>
        <unnnic-label :label="$t('flows_trigger.select')" />
        <unnnic-select-smart
          v-model="flowUuid"
          :options="templates"
          autocomplete
          autocompleteIconLeft
          autocompleteClearOnFocus
          @input="templateMessage(flowUuid?.[0].value)"
        />
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
    </section>
    <div class="template-messages__handlers">
      <unnnic-button-next
        :text="$t('back')"
        size="small"
        type="ghost"
        @click="$emit('back')"
        style="width: 100%"
      />
      <unnnic-button-next
        :disabled="selectedFlow === ''"
        :text="$t('send')"
        size="small"
        type="primary"
        iconLeft="send-email-3-1"
        style="width: 100%"
        @click="sendTemplate"
      />
    </div>
  </div>
</template>

<script>
import { unnnicCallAlert } from '@weni/unnnic-system';
import TemplateMessages from '@/services/api/resources/chats/templateMessage.js';
import ModalProgressTemplateSubmission from './ModalProgressTemplateSubmission';

export default {
  name: 'LayoutTemplateMessage',

  components: {
    ModalProgressTemplateSubmission,
  },

  data() {
    return {
      showModalProgress: false,
      template: '',
      selectedTemplate: '',
      filteredTemplate: '',
      flowUuid: [],
      templates: [{ value: '', label: this.$t('search_or_select') }],
      loading: false,
      selectedFlow: '',
      loadingFlows: false,
      status: '',
      progressText: '',
    };
  },

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

        const treatedTemplates = [
          {
            value: '',
            label: this.$t('search_or_select'),
          },
        ];
        response.results.forEach((flow) => {
          const { name, uuid } = flow;

          treatedTemplates.push({
            value: uuid,
            label: name,
          });
        });
        this.templates = treatedTemplates;

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

      unnnicCallAlert({
        props: {
          text: this.$t('flows_trigger.successfully_sent'),
          type: 'success',
          scheme: 'feedback-green',
        },
        seconds: 5,
      });

      this.$emit('close');
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

    &__handlers {
      display: flex;
      gap: $unnnic-spacing-xs;
    }
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
