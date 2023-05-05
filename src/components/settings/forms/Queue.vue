<template>
  <section class="form-queue">
    <!-- <p v-if="showInfoIcon" class="form-queue__description">{{ infoText }}</p> -->
    <p class="title">
      {{ label }}
      <unnnic-tool-tip enabled side="right" :text="$t('new_sector.queues_tip')" maxWidth="23rem">
        <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
      </unnnic-tool-tip>
    </p>
    <div style="margin-bottom: 24px">
      <unnnic-chat-text
        style="max-width: 100%; max-height: 100%"
        titleColor="neutral-dark"
        size="small"
        title="Mensagem automática"
        info="Defina uma resposta automática para ser enviada ao contato enquanto 
            está aguardando atendimento, deixe em branco caso não queira 
            nenhuma mensagem."
      >
        <template slot="actions">
          <unnnic-button-icon
            v-if="!editContent"
            type="secondary"
            size="small"
            icon="pencil-write-1"
            @click="editDescription"
          />
        </template>
        <template slot="description">
          <div style="word-break: break-all">
            <span v-show="!editContent">{{ description }}</span>
            <div v-show="editContent">
              <unnnic-text-area
                @focus="focusTextEditor"
                size="sm"
                placeholder="Por enquanto você não definiu uma mensagem automática, defina uma mensagem para seus contatos que estão aguardando"
                v-model="queue.default_message"
                ref="textEditor"
              />
            </div>
          </div>
        </template>
      </unnnic-chat-text>
    </div>

    <section class="controls">
      <unnnic-input
        v-model="queue.name"
        label="Nome da fila"
        placeholder="Exemplo: Pagamentos"
        class="input"
      />
      <unnnic-button v-if="isEditing" text="Salvar" type="secondary" @click="addQueue" />
    </section>

    <section v-if="isEditing" class="form-queue__queues">
      <sector-queues-list :sector="sector.name" :queues="queues" @visualize="visualize" />
    </section>
  </section>
</template>

<script>
import SectorQueuesList from '@/components/settings/lists/ListSectorQueues';

export default {
  name: 'FormQueue',

  components: {
    SectorQueuesList,
  },

  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    queues: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    sector: {
      type: Object,
      default: () => ({}),
    },
    showInfoIcon: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    description:
      'Por enquanto você não definiu uma mensagem automática, defina uma mensagem para seus contatos que estão aguardando',
    editContent: false,
    content: '',
  }),

  computed: {
    queue: {
      get() {
        return this.value;
      },
      set(queue) {
        this.$emit('input', queue);
      },
    },
  },

  methods: {
    focusTextEditor() {
      this.$nextTick(() => {
        this.$refs.textEditor?.focus();
      });
    },
    editDescription() {
      this.editContent = true;
      // this.focusTextEditor();
    },
    cancelEditDescription() {
      this.editContent = false;
    },
    visualize(queue) {
      console.log(queue, 'visualize');
      this.$emit('visualize', queue);
    },
    addQueue() {
      this.$emit('add-queue', this.queue);
    },
    validate() {
      return !!this.queue.name;
    },
  },

  watch: {
    queue: {
      deep: true,
      immediate: true,
      handler() {
        this.$emit('validate', this.validate());
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.form-queue {
  &__description {
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
    margin: $unnnic-spacing-inline-xs 0 $unnnic-spacing-inline-md;
  }

  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-stack-sm;
    margin-bottom: 1.5rem;

    .input {
      flex: 1 1;
    }
  }
}
</style>
