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
          v-model="sector"
          class="general-form"
        />
        <ExtraOptions v-show="activePage === $t('sector.extra_options')" />
        <section
          v-show="activePage === $t('sector.queues')"
          class="forms__queue"
        >
          <p class="forms__hint">
            As filas são grupos de atendimento dentro do setor, você poderá
            criar novas filas ou editar quando quiser.
          </p>
          <h1 class="forms__title">Definições da fila</h1>
          <Queue v-model="sector" />
        </section>
        <ListSectorMessages
          v-show="activePage === $t('quick_messages.title')"
          :sector="sector"
        />
      </section>
    </template>
  </UnnnicDrawer>
</template>

<script>
import General from '@/components/settings/forms/General.vue';
import ExtraOptions from '@/components/settings/forms/ExtraOptions.vue';
import Queue from '@/components/settings/forms/Queue.vue';
import ListSectorMessages from '@/components/settings/lists/ListSectorMessages.vue';
export default {
  name: 'NewSectorModal',
  components: {
    General,
    ExtraOptions,
    Queue,
    ListSectorMessages,
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
        can_trigger_flows: '',
        can_edit_custom_fields: '',
        sign_messages: '',
        workingDay: {
          start: '',
          end: '',
          dayOfWeek: 'week-days',
        },
        managers: [],
        maxSimultaneousChatsByAgent: '',
      },
    };
  },
  computed: {
    activePage() {
      return this.newSectorPages[this.activePageIndex];
    },
  },
  methods: {
    finish() {
      this.$refs.newSectorDrawer.close();
    },
  },
};
</script>

<style lang="scss" scoped>
.new-sector-drawer {
  .forms {
    margin-top: $unnnic-spacing-sm;

    &__queue {
      display: grid;
      gap: 16px;
    }

    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-line-height-large * 1.5;
    }
  }
  :deep(.unnnic-navigator-pages__page) {
    max-width: 100%;
  }
}
</style>
