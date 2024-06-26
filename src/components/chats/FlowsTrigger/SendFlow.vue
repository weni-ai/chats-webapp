<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <section class="send-flow">
    <SelectFlow v-model="selectedFlow" />
    <div v-if="showProgressBar">
      <ModalProgressBarFalse
        @close="closeModalProgress"
        :title="$t('flows_trigger.sending')"
      />
    </div>
    <footer class="send-flow__handlers">
      <UnnnicButton
        class="send-flow__handlers__button"
        :text="$t('back')"
        size="small"
        type="tertiary"
        @click="$emit('back')"
      />
      <SendFlowButton
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
