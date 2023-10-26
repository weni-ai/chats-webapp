<template>
  <div class="modal">
    <div class="modal-container unnnic-grid-span-3">
      <div class="modal-container-background">
        <div class="modal-background-color">
          <div class="content">
            <div class="header-format">
              <div class="header-text">Para encerrar classifique o Chat</div>
              <div class="sub-header-text">
                As tags ajudam a localizar os chats e também gerar bons relatórios
              </div>
            </div>
            <div class="tags-list">
              <chat-classifier v-model="tags" :tags="sectorTags"> </chat-classifier>
            </div>
            <div class="button-control">
              <unnnic-button
                type="tertiary"
                @click="closeModal"
                text="Cancelar"
                style="width: 162px; margin-right: 15px"
              />
              <unnnic-button
                type="secondary"
                @click="closeRoom"
                text="Encerrar chat"
                style="width: 162px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChatClassifier from '@/components/chats/ChatClassifier';
import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

export default {
  components: {
    ChatClassifier,
  },

  props: {
    room: {
      type: Object,
      default: () => {},
    },
  },

  data() {
    return {
      tags: [],
      sectorTags: [],
      page: 0,
      limit: 20,
    };
  },
  mounted() {
    this.classifyRoom();
  },

  methods: {
    async classifyRoom() {
      this.isLoading = true;
      let hasNext = false;
      try {
        const response = await Queue.tags(this.room.queue.uuid, this.page * 20, 20);
        this.page += 1;
        // this.sectorTags = response.results;
        this.sectorTags = this.sectorTags.concat(response.results);
        hasNext = response.next;
        this.isLoading = false;
      } finally {
        this.isLoading = false;
      }
      if (hasNext) {
        this.classifyRoom();
      }
    },
    async closeRoom() {
      const { uuid } = this.room;

      const tags = this.tags.map((tag) => tag.uuid);
      await Room.close(uuid, tags);
      this.$router.replace({ name: 'home' });
      this.$store.dispatch('chats/rooms/removeRoom', uuid);
      this.closeModal();
    },
    closeModal() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~@weni/unnnic-system/src/assets/scss/unnnic.scss';

.modal {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}

.modal-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.modal-container-background {
  width: 607px;
  box-shadow: 0 8px 16px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  border-radius: 0.25rem;
  overflow: hidden;
}
.modal-background-color {
  min-height: 296px;
  background-color: #f9f9f9;
  text-align: center;
}

.header-format {
  display: grid;
  justify-content: center;
  padding-top: 1.5rem;
  padding-bottom: 2.75rem;
}
.header-text {
  color: $unnnic-color-neutral-dark;
  font-weight: 700;
  font-size: 1.25rem;
  padding-bottom: 0.5rem;
}
.sub-header-text {
  color: $unnnic-color-neutral-cloudy;
  font-weight: 400;
  font-size: 0.75rem;
}

.tags-list {
  min-height: 125px;
  max-height: 125px;
  overflow-y: auto;
}

.button-control {
  display: flex;
  justify-content: center;
  width: 100%;
  padding-bottom: 1.5rem;
  padding-top: 1.5rem;
}
</style>
