<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <section class="flows-trigger">
    <div>
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
    </div>
    <div v-if="showProgressBar">
      <modal-progress-template-submission @close="closeModaProgress" />
    </div>
    <div class="flows-trigger__handlers">
      <unnnic-button
        :text="$t('back')"
        size="small"
        type="tertiary"
        @click="$emit('back')"
        style="width: 100%"
      />
      <unnnic-button
        :disabled="selectedFlow === ''"
        :text="$t('send')"
        size="small"
        type="primary"
        iconLeft="send-email-3-1"
        style="width: 100%"
        @click="sendFlow"
      />
    </div>
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
          this.loading = false;
          this.closeModaProgress();
        } catch (error) {
          this.loading = false;
          console.log(error);
        }
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

      unnnicCallAlert({
        props: {
          text: this.$t('flows_trigger.successfully_sent'),
          type: 'success',
        },
        seconds: 5,
      });

      this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
.flows-trigger {
  flex: 1 1;
  justify-content: space-between;

  &__handlers {
    display: flex;
    gap: $unnnic-spacing-xs;
  }
}
</style>
