<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <section class="flows-trigger">
    <section class="flows-trigger__config">
      <unnnic-label :label="$t('flows_trigger.select')" />
      <unnnic-select-smart
        v-model="flowUuid"
        :options="templates"
        autocomplete
        autocompleteIconLeft
        autocompleteClearOnFocus
        @input="getFlowInfos(flowUuid?.[0].value)"
      />
      <trigger-flows-template-loading v-if="isLoadingFlowsInfos" />
      <section class="flows-trigger__preview-template">
        <p class="flows-trigger__preview-template__content">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro praesentium nisi
          repellendus, et, recusandae, perferendis quos unde vitae neque placeat at quibusdam
          perspiciatis similique! Eos cumque delectus nihil laudantium ipsa!
        </p>
        <div class="flows-trigger__preview-template__variable">
          <unnnic-label label="{1}" />
          <unnnic-input :placeholder="$t('flows_trigger.preview_template_unavailable')" />
        </div>
      </section>
    </section>
    <div v-if="showProgressBar">
      <modal-progress-template-submission @close="closeModaProgress" />
    </div>
    <section class="flows-trigger__handlers">
      <unnnic-button :text="$t('back')" size="small" type="tertiary" @click="$emit('back')" />
      <unnnic-button
        :disabled="!selectedFlow || isLoadingFlowsInfos"
        :text="$t('send')"
        size="small"
        type="primary"
        iconLeft="send-email-3-1"
        @click="sendFlow"
      />
    </section>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import { unnnicCallAlert } from '@weni/unnnic-system';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import TriggerFlowsTemplateLoading from '@/views/loadings/FlowsTrigger/TriggerFlowsTemplateLoading';

import ModalProgressTemplateSubmission from './ModalProgressTemplateSubmission';

export default {
  name: 'SelectFlow',

  components: {
    ModalProgressTemplateSubmission,
    TriggerFlowsTemplateLoading,
  },

  data() {
    return {
      showProgressBar: false,
      template: '',
      selectedTemplate: '',
      filteredTemplate: '',
      flowUuid: [],
      flowTemplateVariables: null,
      templates: [{ value: '', label: this.$t('search_or_select') }],
      loading: false,
      selectedFlow: '',
      loadingFlows: false,
      status: '',
      progressText: '',
      isLoadingFlowsInfos: false,
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

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
    }),
  },

  methods: {
    async flows() {
      this.loadingFlows = true;
      try {
        const response = await FlowsTrigger.getFlows();

        const treatedTemplates = [
          {
            value: '',
            label: this.$t('search_or_select'),
          },
        ];
        response.forEach((flow) => {
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

    async getFlowInfos(uuid) {
      this.isLoadingFlowsInfos = true;

      try {
        await FlowsTrigger.getFlowTrigger(uuid);
        this.selectedFlow = uuid;
      } catch (error) {
        console.log('An error occurred when trying get flow definitions:', error);
      }
      try {
        this.flowTemplateVariables = [
          {
            uuid: '919b776e-f607-4777-8d81-da6a63f31274',
            template: {
              uuid: '93f2e2df-9d69-4f1f-961a-1d52f821a3d8',
              name: 'marcar_consulta2',
            },
            variables: ['@fields.namedisparo', '@fields.cartaosusdisparo'],
          },
          {
            uuid: 'bbe6ee4f-602c-4fd2-ae2b-59b6b45e591d',
            template: {
              uuid: 'd22d65cd-db50-4b78-ac32-162d949ddb69',
              name: 'continuacao_atendimento_1',
            },
            variables: ['@contact.first_name'],
          },
        ];
        const responseFlowVariables = await FlowsTrigger.getFlowTemplateVariables(uuid);
        console.log({ responseFlowVariables });
      } catch (error) {
        console.log('An error occurred when trying get flow template variables:', error);
      }

      this.isLoadingFlowsInfos = false;
    },

    async sendFlow() {
      this.loading = true;
      if (!this.selectedContact) this.findId(this.contacts, this.groups);

      this.openModalProgress();
      (this.selectedContact ? [this.selectedContact] : this.contacts).forEach(async (contact) => {
        const prepareObj = {
          flow: this.selectedFlow,
          groups: this.idGruops,
          contacts: this.selectedContact ? [this.selectedContact.external_id] : [contact.uuid],
          room: this.room?.uuid,
          contact_name: this.selectedContact ? this.selectedContact.name : contact.name,
        };

        try {
          await FlowsTrigger.sendFlow(prepareObj);
          this.closeModaProgress();
          unnnicCallAlert({
            props: {
              text: this.$t('flows_trigger.successfully_sent'),
              type: 'success',
            },
            seconds: 5,
          });
          this.$emit('close');
        } catch (error) {
          unnnicCallAlert({
            props: {
              text: this.$t('flows_trigger.error_sent'),
              type: 'error',
            },
            seconds: 5,
          });
          console.log(error);
        }

        this.loading = false;
      });
    },

    findId(contacts, groups) {
      this.idContactsList = contacts.map((el) => el.uuid);
      this.idGruops = groups.map((el) => el.uuid);
    },

    openModalProgress() {
      this.showProgressBar = true;
    },

    closeModaProgress() {
      this.showProgressBar = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.flows-trigger {
  flex: 1 1;
  justify-content: space-between;

  &__config {
    overflow: auto;
  }

  &__handlers {
    display: flex;
    gap: $unnnic-spacing-xs;
  }

  &__preview-template {
    margin-top: $unnnic-spacing-sm;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;

    &__content {
      border-radius: $unnnic-border-radius-sm;

      padding: $unnnic-spacing-xs;

      background-color: $unnnic-color-neutral-white;

      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-regular;
      color: $unnnic-color-neutral-dark;

      text-align: left;
    }
  }
}
</style>
