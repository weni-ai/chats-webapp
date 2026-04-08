<template>
  <UnnnicDrawer
    v-show="!showConfirmDiscartChangesModal"
    ref="newSectorDrawer"
    class="new-sector-drawer"
    :modelValue="modelValue"
    closeIcon="close"
    size="gt"
    :primaryButtonText="activePageIndex === 3 ? $t('save') : $t('continue')"
    :secondaryButtonText="activePageIndex === 0 ? $t('cancel') : $t('back')"
    :disabledPrimaryButton="!isValid[activePageKey]"
    :loadingPrimaryButton="isLoadingCreate"
    data-testid="new-sector-drawer"
    @primary-button-click="
      activePageIndex === 3 ? finish() : (activePageIndex = activePageIndex + 1)
    "
    @secondary-button-click="
      activePageIndex === 0
        ? handleCloseNewSectorDrawer()
        : (activePageIndex = activePageIndex - 1)
    "
    @close="handleCloseNewSectorDrawer"
  >
    <template #title>
      <section class="new-sector-drawer__title-container">
        <h1 class="new-sector-drawer__title">
          {{ $t('config_chats.new_sector') }}
        </h1>
        <UnnnicTag
          :text="
            $t('step_of', {
              step: activePageIndex + 1,
              total: newSectorPages.length,
            })
          "
          scheme="bg-muted"
        />
      </section>
    </template>
    <template #content>
      <section class="forms">
        <General
          v-show="activePage === $t('sector.general')"
          ref="sectorGeneral"
          v-model="sector"
          class="general-form"
          data-testid="general-form"
          @change-is-valid="updateIsValid($event, 'general')"
        />
        <FormQueue
          v-show="activePage === $t('sector.queues')"
          ref="sectorQueue"
          v-model="sectorQueues"
          :sector="sector"
          showHelpers
          multiple
          data-testid="queue-form"
          @change-is-valid="updateIsValid($event, 'queue')"
        />
        <ExtraOptions
          v-show="activePage === $t('sector.extra_options')"
          ref="sectorExtraOptions"
          v-model="sector"
          data-testid="extra-options-form"
          @change-is-valid="updateIsValid($event, 'extraOptions')"
        />
        <section
          v-show="activePage === $t('quick_messages.title')"
          class="forms__quick-message"
        >
          TODO: Add quick messages form
        </section>
      </section>
    </template>
  </UnnnicDrawer>
  <DiscartChangesModal
    v-if="showConfirmDiscartChangesModal"
    v-model="showConfirmDiscartChangesModal"
    :title="$t('new_sector.discart.title')"
    :text="$t('new_sector.discart.hint')"
    data-testid="discart-changes-modal"
    @cancel="showConfirmDiscartChangesModal = false"
    @confirm="$emit('close')"
  />
</template>

<script>
import { mapState, mapWritableState } from 'pinia';

import General from '@/views/Settings/Forms/General.vue';
import ExtraOptions from '@/views/Settings/Forms/ExtraOptions.vue';
import FormQueue from '@/views/Settings/Forms/Queue/index.vue';
import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

import { useSettings } from '@/store/modules/settings';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import isMobile from 'is-mobile';

import Unnnic from '@weni/unnnic-system';

export default {
  name: 'NewSectorDrawer',
  components: {
    General,
    ExtraOptions,
    FormQueue,
    DiscartChangesModal,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      isMobile,
      activePageIndex: 0,
      newSectorPages: [
        this.$t('sector.general'),
        this.$t('sector.queues'),
        this.$t('sector.extra_options'),
        this.$t('quick_messages.title'),
      ],
      sector: {
        uuid: '',
        name: '',
        can_trigger_flows: true,
        can_edit_custom_fields: true,
        sign_messages: true,
        is_csat_enabled: false,
        automatic_message: {
          is_active: false,
          text: '',
        },
        config: {
          secondary_project: '',
        },
        managers: [],
        maxSimultaneousChatsByAgent: '',
        required_tags: false,
      },
      sectorQueues: [
        {
          name: '',
          queue_limit: { is_active: false, limit: null },
          currentAgents: [],
          agents: 0,
        },
      ],
      useDefaultSectorQueue: 0,
      isValid: {
        general: false,
        extraOptions: true,
        queue: false,
        quick_messages: true,
      },
      isLoadingCreate: false,
      showConfirmDiscartChangesModal: false,
    };
  },
  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapWritableState(useSettings, ['sectors']),
    ...mapState(useConfig, ['enableGroupsMode']),
    showDiscartQuestion() {
      const { name, maxSimultaneousChatsByAgent, managers } = this.sector;

      return !!(
        name ||
        Number(maxSimultaneousChatsByAgent || 0) ||
        managers.length
      );
    },
    activePageKey() {
      const mapper = {
        0: 'general',
        1: 'queue',
        2: 'extraOptions',
        3: 'quick_messages',
      };
      return mapper[this.activePageIndex];
    },
    activePage() {
      return this.newSectorPages[this.activePageIndex];
    },
    enableAutomaticCsatFeature() {
      return this.featureFlags.active_features?.includes('weniChatsCSAT');
    },
    enableQueueLimitFeature() {
      return this.featureFlags.active_features?.includes('weniChatsQueueLimit');
    },
  },
  mounted() {
    this.listenConnect();
  },
  methods: {
    listenConnect() {
      window.addEventListener('message', (message) => {
        const { event } = message.data;
        if (event === 'close') this.$refs.newSectorDrawer?.close();
      });
    },
    async finish() {
      try {
        this.isLoadingCreate = true;
        const {
          can_edit_custom_fields,
          can_trigger_flows,
          sign_messages,
          name,
          maxSimultaneousChatsByAgent,
          managers,
          config,
          automatic_message,
          is_csat_enabled,
        } = this.sector;

        const createSectorBody = {
          can_edit_custom_fields,
          can_trigger_flows,
          sign_messages,
          name,
          rooms_limit: this.enableGroupsMode
            ? '0'
            : maxSimultaneousChatsByAgent,
          config: this.enableGroupsMode
            ? config
            : { ...config, secondary_project: undefined },
          automatic_message,
          is_csat_enabled: this.enableAutomaticCsatFeature
            ? is_csat_enabled
            : false,
        };

        const createdSector = await Sector.create(createSectorBody);

        this.sectors.unshift(createdSector);

        window.parent.postMessage(
          { event: 'addSector', data: createdSector },
          '*',
        );

        this.sector = { ...this.sector, ...createdSector };

        await this.$nextTick();

        await this.$refs.sectorGeneral.saveWorkingDays();

        await this.$refs.sectorGeneral.initCountryHolidays();

        await this.$refs.sectorGeneral.createCustomHolidays();

        await Promise.all(
          managers.map((manager) => {
            return Sector.addManager(this.sector.uuid, manager.uuid);
          }),
        );

        await this.$refs.sectorExtraOptions.save(true);

        const createQueuesRequests = this.sectorQueues.map((sectorQueue) =>
          Queue.create({
            name: sectorQueue.name,
            default_message: '',
            sectorUuid: this.sector.uuid,
            queue_limit: this.enableQueueLimitFeature
              ? sectorQueue.queue_limit
              : { is_active: false, limit: null },
          }),
        );

        const createdQueues = await Promise.all(createQueuesRequests);

        await Promise.all(
          createdQueues.map((createdQueue, index) => {
            return Promise.all(
              this.sectorQueues[index].currentAgents.map((agent) => {
                return Queue.addAgent(createdQueue.uuid, agent.uuid);
              }),
            );
          }),
        );

        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('new_sector.alert.create_success', {
              sectorName: createdSector.name,
            }),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('new_sector.alert.create_error'),
            type: 'error',
          },
          seconds: 5,
        });
        console.log(error);
      } finally {
        this.isLoadingCreate = false;
        window.parent.postMessage({ event: 'changeOverlay', data: false }, '*');
        this.handleCloseNewSectorDrawer(true);
      }
    },
    updateIsValid(valid, key) {
      this.isValid[key] = valid;
    },
    handleCloseNewSectorDrawer(forceClose) {
      if (this.showDiscartQuestion && !forceClose) {
        this.showConfirmDiscartChangesModal = true;
      } else {
        this.$emit('close');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.new-sector-drawer {
  &__title-container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
  }
  &__title {
    font: $unnnic-font-display-2;
    color: $unnnic-color-fg-emphasized;
  }
}
</style>
