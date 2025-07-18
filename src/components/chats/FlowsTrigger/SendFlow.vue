<template>
  <section
    class="send-flow"
    data-testid="send-flow-container"
  >
    <SelectFlow
      v-model="selectedFlow"
      data-testid="select-flow"
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
        @click="$emit('back')"
      />
      <SendFlowButton
        class="send-flow__handlers__button"
        :contacts="contacts"
        :selectedContact="selectedContact"
        :selectedFlow="selectedFlow"
        data-testid="send-flow-button"
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
  },
  emits: ['back', 'close'],

  data() {
    return {
      showProgressBar: false,

      selectedFlow: '',
    };
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
