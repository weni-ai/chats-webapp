<template>
  <UnnnicDrawer
    v-show="!showConfirmDiscartChangesModal"
    ref="newSectorDrawer"
    class="new-sector-drawer"
    :modelValue="modelValue"
    closeIcon="arrow_back"
    size="gt"
    :title="$t('config_chats.new_sector')"
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
        ? $refs.newSectorDrawer.close()
        : (activePageIndex = activePageIndex - 1)
    "
    @close="handleCloseNewSectorDrawer"
  >
    <template #content>
      <UnnnicNavigator
        :pages="newSectorPages"
        :activePage="activePage"
      />
      <section class="forms">
        <General
          v-show="activePage === $t('sector.general')"
          ref="sectorGeneral"
          v-model="sector"
          class="general-form"
          data-testid="general-form"
          @change-is-valid="updateIsValid($event, 'general')"
        />
        <ExtraOptions
          v-show="activePage === $t('sector.extra_options')"
          ref="sectorExtraOptions"
          v-model="sector"
          data-testid="extra-options-form"
          @change-is-valid="updateIsValid($event, 'extraOptions')"
        />
        <section class="forms__queue">
          <FormQueue
            v-show="activePage === $t('sector.queues')"
            ref="sectorQueue"
            v-model="sectorQueue"
            :sector="sector"
            showHelpers
            data-testid="queue-form"
            @change-is-valid="updateIsValid($event, 'queue')"
          />
        </section>
        <section
          v-show="activePage === $t('quick_messages.title')"
          class="forms__quick-message"
        >
          <section class="forms__quick-message__copilot">
            <p class="forms__title">
              {{ $t('copilot.name') }}
            </p>
            <UnnnicSwitch
              :modelValue="false"
              size="small"
              :textRight="$t(`settings.messages.copilot.status.off`)"
              data-testid="copilot-switch"
              disabled
            />
            <p class="forms__hint">
              {{ $t('config_chats.copilot.hint') }}
            </p>
          </section>
          <section class="forms__quick-message__container">
            <h1 class="forms__title">
              {{ $t('quick_messages.title') }}
            </h1>
            <UnnnicSimpleCard
              class="forms__quick-message__card"
              :title="$t('quick_messages.example_message')"
              :text="$t('quick_messages.example_message_description')"
              clickable
              data-testid="quick-message-card"
            >
            </UnnnicSimpleCard>
          </section>
        </section>
      </section>
    </template>
  </UnnnicDrawer>
  <DiscartChangesModal
    :showModal="showConfirmDiscartChangesModal"
    :title="$t('new_sector.discart.title')"
    :text="$t('new_sector.discart.hint')"
    data-testid="discart-changes-modal"
    @secondary-button-click="showConfirmDiscartChangesModal = false"
    @primary-button-click="$emit('close')"
  />
</template>

<script>
import General from '@/components/settings/forms/General.vue';
import ExtraOptions from '@/components/settings/forms/ExtraOptions.vue';
import FormQueue from '@/components/settings/forms/Queue.vue';
import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

import { useSettings } from '@/store/modules/settings';

import isMobile from 'is-mobile';

import Unnnic from '@weni/unnnic-system';
import { mapState, mapWritableState } from 'pinia';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

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
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      isMobile,
      activePageIndex: 0,
      newSectorPages: [
        this.$t('sector.general'),
        this.$t('sector.extra_options'),
        this.$t('sector.queues'),
        this.$t('quick_messages.title'),
      ],
      sector: {
        uuid: '',
        name: '',
        can_trigger_flows: true,
        can_edit_custom_fields: true,
        sign_messages: true,
        is_csat_enabled: true,
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
      sectorQueue: {
        name: '',
        currentAgents: [],
        agents: 0,
      },
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
        1: 'extraOptions',
        2: 'queue',
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

        const createdQueue = await Queue.create({
          name: this.sectorQueue.name,
          default_message: '',
          sectorUuid: this.sector.uuid,
        });

        await Promise.all(
          this.sectorQueue.currentAgents.map((agent) => {
            Queue.addAgent(createdQueue.uuid, agent.uuid);
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
  .forms {
    margin-top: $unnnic-spacing-sm;

    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-line-height-large * 1.5;
    }

    &__hint {
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }

    &__quick-message {
      display: grid;
      gap: $unnnic-spacing-sm;

      &__copilot {
        border: 1px solid $unnnic-color-neutral-soft;
        border-radius: $unnnic-border-radius-md;
        padding: $unnnic-spacing-sm;
        display: grid;
        gap: $unnnic-spacing-sm;
      }

      &__container {
        display: grid;
        gap: $unnnic-spacing-sm;
      }

      :deep(.forms__quick-message__card) {
        .unnnic-simple-card-header-container__title {
          color: $unnnic-color-neutral-darkest;
        }
      }
    }
  }
  :deep(.unnnic-navigator-pages__page) {
    max-width: 100%;
  }
}
</style>
