<template>
  <AsideSlotTemplateSection>
    <ModalProgressBarFalse
      v-if="showTransferProgressBar"
      :title="$t('contact_info.transfering_chat')"
      type="secondary"
      @close="closeTransferProgressBar"
    />

    <p class="transfer-session__title">
      {{ $tc('transfer_contact') }}
    </p>
    <section class="transfer-section">
      <RoomsTransferFields
        ref="roomsTransferFields"
        :selectedQueue.sync="selectedQueue"
        @transfer-complete="transferComplete"
        size="sm"
      />

      <UnnnicButton
        class="transfer-session__handler"
        :text="$t('transfer')"
        type="primary"
        size="small"
        @click="transferRooms"
        :disabled="selectedQueue.length === 0 || isViewMode"
        :loading="isLoading"
      />
    </section>
  </AsideSlotTemplateSection>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import isMobile from 'is-mobile';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import RoomsTransferFields from '@/components/chats/RoomsTransferFields';
import ModalProgressBarFalse from '@/components/ModalProgressBarFalse';

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

  data() {
    return {
      isMobile: isMobile(),

      selectedQueue: [],

      isLoading: false,
      showTransferProgressBar: false,
    };
  },

  created() {
    this.setContactToTransfer(this.room.uuid);
  },

  beforeDestroy() {
    this.setContactToTransfer([]);
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
    }),
  },

  methods: {
    ...mapActions({
      setContactToTransfer: 'chats/rooms/setContactToTransfer',
    }),

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
      this.$store.dispatch('chats/rooms/setActiveRoom', null);
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
