<template>
  <section
    class="send-flow"
    data-testid="send-flow-container"
  >
    <SelectFlow
      v-model="selectedFlow"
      data-testid="select-flow"
      @update:project-uuid-flow="updateProjectUuidFlow"
    />
    <div v-if="showProgressBar">
      <ModalProgressBarFalse
        :title="$t('flows_trigger.sending')"
        @close="closeModalProgress"
      />
    </div>
    <footer class="send-flow__handlers">
      <UnnnicButton
        class="send-flow__handlers__button"
        :text="$t('back')"
        size="small"
        type="tertiary"
        data-testid="back-button"
        @click="noHasContacts ? $emit('close') : $emit('back')"
      />
      <SendFlowButton
        class="send-flow__handlers__button"
        :contacts="contacts"
        :selectedContact="selectedContact"
        :selectedFlow="selectedFlow"
        data-testid="send-flow-button"
        @back-to-contact-list="backToContactList"
        @send-flow-started="openModalProgress"
        @send-flow-finished="closeModalProgressWithResult"
      />
    </footer>
  </section>
</template>

<script>
import callUnnnicAlert from '@/utils/callUnnnicAlert';

import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';

import SelectFlow from './SelectFlow.vue';
import SendFlowButton from './SendFlowButton.vue';

export default {
  name: 'SendFlow',

  components: {
    SelectFlow,
    SendFlowButton,
    ModalProgressBarFalse,
  },

  props: {
    contacts: {
      type: Array,
      default: () => [],
    },
    selectedContact: {
      type: Object,
      default: () => {},
    },
    isProjectPrincipal: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['back', 'close', 'update:projectUuidFlow', 'update:selectedFlow'],

  data() {
    return {
      showProgressBar: false,

      selectedFlow: '',
      projectUuidFlow: '',
    };
  },

  computed: {
    noHasContacts() {
      return !this.selectedContact && this.contacts.length === 0;
    },
  },

  watch: {
    selectedFlow(newSelectedFlow) {
      this.$emit('update:selectedFlow', newSelectedFlow);
    },
  },

  methods: {
    openModalProgress() {
      this.showProgressBar = true;
    },

    closeModalProgress() {
      this.showProgressBar = false;

      this.$emit('close');
    },

    closeModalProgressWithResult({ hasError }) {
      this.showProgressBar = false;

      callUnnnicAlert({
        props: {
          text: hasError
            ? this.$t('flows_trigger.error_triggering')
            : this.$t('flows_trigger.successfully_triggered'),
          type: hasError ? 'error' : 'success',
        },
        seconds: 5,
      });

      this.$emit('close');
    },

    updateProjectUuidFlow(projectUuidFlow) {
      this.projectUuidFlow = projectUuidFlow;
      this.$emit('update:projectUuidFlow', projectUuidFlow);
    },

    backToContactList() {
      this.$emit('back');
    },
  },
};
</script>

<style lang="scss" scoped>
.send-flow {
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  height: 100%;

  &__handlers {
    display: flex;
    gap: $unnnic-spacing-xs;

    &__button {
      flex: 1;
    }
  }
}
</style>
