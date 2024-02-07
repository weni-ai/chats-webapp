<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <section class="send-flow">
    <select-flow v-model="selectedFlow" />
    <div v-if="showProgressBar">
      <modal-progress-template-submission @close="closeModalProgress" />
    </div>
    <footer class="send-flow__handlers">
      <unnnic-button
        class="send-flow__handlers__button"
        :text="$t('back')"
        size="small"
        type="tertiary"
        @click="$emit('back')"
      />
      <send-flow-button
        class="send-flow__handlers__button"
        :contacts="contacts"
        :selectedContact="selectedContact"
        :selectedFlow="selectedFlow"
        @send-flow-started="openModalProgress"
        @send-flow-finished="closeModalProgress"
      />
    </footer>
  </section>
</template>

<script>
import callUnnnicAlert from '@/utils/callUnnnicAlert';

import SelectFlow from './SelectFlow';
import SendFlowButton from './SendFlowButton';
import ModalProgressTemplateSubmission from './ModalProgressTemplateSubmission';

export default {
  name: 'SendFlow',

  components: {
    SelectFlow,
    SendFlowButton,
    ModalProgressTemplateSubmission,
  },

  data() {
    return {
      showProgressBar: false,

      selectedFlow: '',
    };
  },

  props: {
    contacts: {
      type: Array,
    },
    selectedContact: {
      type: Object,
    },
  },

  methods: {
    openModalProgress() {
      this.showProgressBar = true;
    },

    closeModalProgress() {
      this.showProgressBar = false;

      callUnnnicAlert({
        props: {
          text: this.$t('flows_trigger.successfully_triggered'),
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
