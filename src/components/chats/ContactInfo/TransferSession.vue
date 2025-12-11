<template>
  <AsideSlotTemplateSection class="transfer-session__section">
    <ModalProgressBarFalse
      v-if="showTransferProgressBar"
      :title="$t('contact_info.transfering_chat')"
      type="secondary"
      @close="closeTransferProgressBar"
    />

    <p
      class="transfer-session__title"
      data-testid="transfer-session-title"
    >
      {{ $tc('transfer_contact') }}
    </p>
    <section class="transfer-section">
      <RoomsTransferFields
        ref="roomsTransferFields"
        v-model="selectedQueue"
        size="sm"
        data-testid="transfer-fields"
        @transfer-complete="transferComplete"
      />

      <UnnnicButton
        class="transfer-session__handler"
        :text="$t('transfer')"
        type="primary"
        size="small"
        :disabled="selectedQueue.length === 0 || isViewMode"
        :loading="isLoading"
        data-testid="transfer-button"
        @click="transferRooms"
      />
    </section>
  </AsideSlotTemplateSection>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

import isMobile from 'is-mobile';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';
import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';

export default {
  name: 'TransferSession',

  components: {
    AsideSlotTemplateSection,
    RoomsTransferFields,
    ModalProgressBarFalse,
  },

  props: {
    isViewMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['transferred-contact'],

  data() {
    return {
      isMobile: isMobile(),

      selectedQueue: [],

      isLoading: false,
      showTransferProgressBar: false,
    };
  },

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
  },

  created() {
    this.setContactToTransfer(this.room.uuid);
  },

  beforeUnmount() {
    this.setContactToTransfer([]);
  },

  methods: {
    ...mapActions(useRooms, ['setContactToTransfer', 'setActiveRoom']),

    async transferRooms() {
      this.isLoading = true;

      if (this.isMobile) {
        await this.handleFalseTransferProgressBar();
      }

      this.$refs.roomsTransferFields.transfer();
    },

    transferComplete(status) {
      this.isLoading = false;

      if (status === 'success') {
        this.resetActiveRoom();
      }
    },

    resetActiveRoom() {
      this.setActiveRoom(null);
    },

    async handleFalseTransferProgressBar() {
      this.showTransferProgressBar = true;

      return new Promise((resolve) => {
        const waitForCloseTransferProgressBar = () => {
          if (!this.showTransferProgressBar) {
            resolve();
          } else {
            setTimeout(waitForCloseTransferProgressBar, 100);
          }
        };

        waitForCloseTransferProgressBar();
      }).then(() => {
        this.$emit('transferred-contact');
      });
    },
    closeTransferProgressBar() {
      this.showTransferProgressBar = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.transfer-session {
  &__section {
    padding: $unnnic-space-2;
  }

  &__title {
    margin-bottom: $unnnic-spacing-ant;

    font-weight: $unnnic-font-weight-bold;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-dark;
  }

  &__handler {
    margin-top: $unnnic-spacing-ant;
    width: 100%;
  }
}
</style>
