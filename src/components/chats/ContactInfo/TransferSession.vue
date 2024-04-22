<template>
  <AsideSlotTemplateSection>
    <UnnnicModal
      :text="$t('successfully_transferred_chat')"
      :description="
        $t('successfully_transferred_contact_to.line', {
          name: transferContactTo?.[0]?.label || '',
        })
      "
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      :showModal="showSuccessfulTransferModal"
      @close="(showSuccessfulTransferModal = false), navigate('home')"
    />
    <ModalProgressBarFalse
      v-if="showTransferProgressBar"
      :title="$t('contact_info.transfering_chat')"
      type="secondary"
      @close="closeTransferProgressBar"
    />
    <p class="title-transfer-chat">
      {{ $tc('transfer_contact') }}
    </p>
    <section class="transfer-section">
      <!-- <section>
        <section class="select-destination__field">
          <UnnnicLabel :label="$t('queue')" />
          <UnnnicSelectSmart
            v-model="selectedQueue"
            :options="queues"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
          />
        </section>
        <section class="select-destination__field">
          <UnnnicLabel :label="$t('agent')" />
          <UnnnicSelectSmart
            v-model="selectedAgent"
            :disabled="isAgentsFieldDisabled"
            :options="agents"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
          />
        </section>
      </section> -->
      <section class="transfer__radios">
        <UnnnicRadio
          size="sm"
          v-model="transferRadio"
          value="agent"
          :disabled="isViewMode"
        >
          {{ $t('agent') }}
        </UnnnicRadio>

        <UnnnicRadio
          size="sm"
          v-model="transferRadio"
          value="queue"
          :disabled="isViewMode"
        >
          {{ $t('queue') }}
        </UnnnicRadio>
      </section>
      <UnnnicSelectSmart
        v-model="transferContactTo"
        :options="transferOptions"
        autocomplete
        autocompleteIconLeft
        autocompleteClearOnFocus
        :disabled="!!transferContactError || isViewMode"
      />

      <UnnnicButton
        class="transfer__button"
        :text="$t('transfer')"
        type="primary"
        size="small"
        @click="transferContact"
        :disabled="transferContactTo.length === 0 || isViewMode"
      />
    </section>
  </AsideSlotTemplateSection>
</template>

<script>
import isMobile from 'is-mobile';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import Room from '@/services/api/resources/chats/room';
import { mapState } from 'vuex';
import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';
import { unnnicCallAlert } from '@weni/unnnic-system';
import ModalProgressBarFalse from '@/components/ModalProgressBarFalse';

export default {
  name: 'TransferSession',

  components: {
    AsideSlotTemplateSection,
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
      transferOptions: [],
      transferContactTo: [],
      queues: [],
      transferRadio: 'agent',
      transferContactError: '',
      showTransferProgressBar: false,
      showSuccessfulTransferModal: false,
      page: 0,
    };
  },

  async created() {
    const { room } = this;

    try {
      const treatedAgents = [{ value: '', label: this.$t('select_agent') }];
      const agents = (
        await Sector.agents({ sectorUuid: room.queue.sector })
      ).filter((agent) => agent.email !== this.$store.state.profile.me.email);

      agents.forEach(({ first_name, last_name, email }) => {
        treatedAgents.push({
          label: [first_name, last_name].join(' ').trim() || email,
          value: email,
        });
      });
      this.transferOptions = treatedAgents;
    } catch (error) {
      if (error?.response?.status === 403) {
        this.transferContactError = this.$t(
          'chats.transfer.does_not_have_permission',
        );
      } else {
        throw error;
      }
    }
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
    }),

    transferPersonSelected() {
      const selectedOptionValue = this.transferContactTo?.[0]?.value;
      return this.transferOptions.find(
        (option) => option.value === selectedOptionValue,
      );
    },
  },

  methods: {
    async getQueues() {
      this.loading = true;
      let hasNext = false;
      try {
        const newQueues = await Queue.listByProject(this.page * 10, 10);
        this.page += 1;

        const treatedQueues = [{ value: '', label: this.$t('select_queue') }];
        this.queues
          .concat(newQueues.results)
          .forEach(({ name, sector_name, uuid }) => {
            treatedQueues.push({
              label: `${name} | ${this.$t('sector.title')} ${sector_name}`,
              value: uuid,
            });
          });
        this.transferOptions = treatedQueues;

        hasNext = newQueues.next;

        this.loading = false;
      } finally {
        this.loading = false;
      }
      if (hasNext) {
        this.getQueues();
      }
    },

    async listAgents() {
      try {
        this.transferOptions = (
          await Sector.agents({ sectorUuid: this.room.queue.sector })
        )
          .filter((agent) => agent.email !== this.$store.state.profile.me.email)
          .map(({ first_name, last_name, email }) => {
            return {
              name: [first_name, last_name].join(' ').trim() || email,
              email,
            };
          });
      } catch (error) {
        if (error?.response?.status === 403) {
          this.transferContactError = this.$t(
            'chats.transfer.does_not_have_permission',
          );
        } else {
          throw error;
        }
      }
    },

    async transferContact() {
      if (this.isMobile) {
        await this.handleFalseTransferProgressBar();
      }
      if (this.transferRadio === 'agent') {
        await Room.take(this.room.uuid, this.transferPersonSelected.value);
      }
      if (this.transferRadio === 'queue') {
        await Room.take(
          this.room.uuid,
          null,
          this.transferPersonSelected.value,
        );
      }

      if (this.isMobile) {
        this.$store.dispatch('chats/rooms/setActiveRoom', null);
        return;
      }

      this.showSuccessfulTransferModal = true;
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

    showAlert(text, type = 'success') {
      unnnicCallAlert({
        props: {
          text,
          type,
          size: 'small',
        },
        seconds: 5,
      });
    },
  },

  watch: {
    transferRadio: {
      handler() {
        if (this.transferRadio === 'queue') {
          this.transferContactTo = [];
          this.page = 0;
          this.getQueues();
        }
        if (this.transferRadio === 'agent') {
          this.transferContactTo = [];
          this.listAgents();
        }
      },
    },
    transferContactError(error) {
      this.showAlert(error, 'error');
    },
  },
};
</script>

<style lang="scss" scoped>
.title-transfer-chat {
  font-weight: $unnnic-font-weight-bold;
  font-size: $unnnic-font-size-body-gt;
  color: $unnnic-color-neutral-dark;
}

.transfer-section {
  .transfer__radios {
    margin-top: $unnnic-spacing-ant;
    margin-bottom: $unnnic-spacing-xs;
  }
  .transfer__button {
    margin-top: $unnnic-spacing-xs;
    width: 100%;
  }
}
</style>
