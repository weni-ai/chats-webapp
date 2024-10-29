<template>
  <UnnnicDrawer
    ref="newSectorDrawer"
    class="new-sector-drawer"
    :modelValue="modelValue"
    closeIcon="arrow_back"
    size="xl"
    :title="$t('config_chats.new_sector')"
    :primaryButtonText="activePageIndex === 3 ? $t('save') : $t('continue')"
    :secondaryButtonText="activePageIndex === 0 ? $t('cancel') : $t('back')"
    :disabledPrimaryButton="!isValid[activePageKey]"
    :loadingPrimaryButton="isLoadingCreate"
    @primary-button-click="
      activePageIndex === 3 ? finish() : (activePageIndex = activePageIndex + 1)
    "
    @secondary-button-click="
      activePageIndex === 0
        ? $refs.newSectorDrawer.close()
        : (activePageIndex = activePageIndex - 1)
    "
    @close="$emit('close')"
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
          @change-is-valid="updateIsValid($event, 'general')"
        />
        <ExtraOptions
          v-show="activePage === $t('sector.extra_options')"
          ref="sectorExtraOptions"
          v-model="sector"
          @change-is-valid="updateIsValid($event, 'extraOptions')"
        />
        <section class="forms__queue">
          <FormQueue
            v-show="activePage === $t('sector.queues')"
            ref="sectorQueue"
            v-model="sectorQueue"
            :sector="sector"
            showHelpers
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
</template>

<script>
import General from '@/components/settings/forms/General.vue';
import ExtraOptions from '@/components/settings/forms/ExtraOptions.vue';
import FormQueue from '@/components/settings/forms/Queue.vue';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

import isMobile from 'is-mobile';

export default {
  name: 'NewSectorModal',
  components: {
    General,
    ExtraOptions,
    FormQueue,
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
        workingDay: {
          start: '',
          end: '',
          dayOfWeek: 'week-days',
        },
        managers: [],
        maxSimultaneousChatsByAgent: '',
      },
      sectorQueue: {
        name: '',
        currentAgents: [],
        agents: 0,
      },
      useDefaultSectorQueue: 0,
      isValid: {
        general: false,
        extraOptions: false,
        queue: false,
        quick_messages: true,
      },
      isLoadingCreate: false,
    };
  },
  computed: {
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
  },
  methods: {
    async finish() {
      try {
        this.isLoadingCreate = true;
        const {
          can_edit_custom_fields,
          can_trigger_flows,
          sign_messages,
          name,
          workingDay,
          maxSimultaneousChatsByAgent,
          managers,
        } = this.sector;

        const createSectorBody = {
          can_edit_custom_fields,
          can_trigger_flows,
          sign_messages,
          name,
          work_start: workingDay.start,
          work_end: workingDay.end,
          rooms_limit: maxSimultaneousChatsByAgent,
        };

        const createdSector = await Sector.create(createSectorBody);

        this.sector = { ...this.sector, ...createdSector };

        await this.$nextTick();

        await Promise.all(
          managers.map((manager) => {
            return Sector.addManager(this.sector.uuid, manager.uuid);
          }),
        );

        await this.$refs.sectorExtraOptions.save();

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

        this.$refs.newSectorDrawer.close();
      } catch (error) {
        console.log(error);
      } finally {
        this.isLoadingCreate = false;
      }
    },
    updateIsValid(valid, key) {
      this.isValid[key] = valid;
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
