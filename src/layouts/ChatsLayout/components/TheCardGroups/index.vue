<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <UnnnicInput
      v-model="nameOfContact"
      iconLeft="search-1"
      :iconRight="nameOfContact ? 'close-1' : ''"
      :iconRightClickable="true"
      @icon-right-click="nameOfContact = ''"
      size="sm"
      :placeholder="$t('chats.search_contact')"
    ></UnnnicInput>
    <div class="order-by">
      <UnnnicToolTip
        enabled
        text="Selecionar filas"
        side="right"
      >
        <UnnnicButton
          iconCenter="filter_list"
          type="secondary"
          size="small"
          @click="openModalQueue"
        />
      </UnnnicToolTip>
      <div>
        <span>{{ $t('chats.room_list.order_by') }}</span>
      </div>
      <div
        class="apply-filter"
        style="cursor: pointer"
      >
        <span
          :style="{
            fontWeight: lastCreatedFilter ? '700' : '400',
          }"
          @click="
            listRoom(false, '-last_interaction'),
              ((lastCreatedFilter = true), (createdOnFilter = false))
          "
          >{{ $t('chats.room_list.most_recent') }}</span
        >
        <span> | </span>
        <span
          :style="{
            fontWeight: createdOnFilter ? '700' : '400',
          }"
          @click="
            listRoom(false, 'last_interaction'),
              ((createdOnFilter = true), (lastCreatedFilter = false))
          "
        >
          {{ $t('chats.room_list.older') }}</span
        >
      </div>
    </div>
    <RoomsListLoading v-if="isLoadingRooms" />
    <section
      v-else
      class="chat-groups"
      @scroll="
        (event) => {
          handleScroll(event.srcElement);
        }
      "
    >
      <CardGroup
        v-if="discussions.length"
        :label="$t('chats.discussions', { length: discussions.length })"
        :discussions="discussions"
        @open="openDiscussion"
      />
      <CardGroup
        v-if="rooms_queue.length"
        :label="$t('chats.waiting', { length: rooms_queue.length })"
        :rooms="rooms_queue"
        @open="openRoom"
      />
      <CardGroup
        v-if="rooms.length"
        :label="$t('chats.in_progress', { length: rooms.length })"
        :rooms="rooms"
        @open="openRoom"
      />
      <CardGroup
        v-if="rooms_sent_flows.length"
        :label="$t('chats.sent_flows', { length: rooms_sent_flows.length })"
        :rooms="rooms_sent_flows"
        @open="openRoom"
      />
      <p
        v-if="showNoResultsError"
        class="no-results"
      >
        {{ isSearching ? $t('without_results') : $t('without_chats') }}
      </p>
    </section>
    <UnnnicModal
      v-if="showModalQueue"
      @close="closeModalQueue"
      class="queue-modal"
      text="Selecionar filas de atendimento"
    >
      <section class="queue-modal-form">
        <div class="queue-modal-select">
          <div class="queue-modal-input">
            <div v-if="queueTags.length === 0">
              <!-- <UnnnicIconSvg
                icon="alert-circle-1"
                scheme="neutral-white"
                size="sm"
              /> -->
              <p>Selecione pelo menos uma fila para salvar alterações</p>
            </div>
            <UnnnicLabel label="Selecione as filas" />
            <UnnnicSelectSmart
              v-model="queueTags"
              :options="queueTagsOptions"
              multipleWithoutSelectsMessage="Nenhuma fila selecionada"
              multiple
              @change="handleQueuesOptions"
            />
          </div>
        </div>
      </section>
      <template #options>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          size="large"
          @click="closeModalQueue()"
        />
        <UnnnicButton
          :text="$t('save')"
          type="primary"
          size="large"
          :disabled="!verifySelectedLength"
          @click="saveListQueues"
        />
      </template>
    </UnnnicModal>
  </div>
</template>
<script>
import { mapState, mapGetters } from 'vuex';
import Room from '@/services/api/resources/chats/room';
// import Profile from '@/services/api/resources/profile';
import RoomsListLoading from '@/views/loadings/RoomsList.vue';
import CardGroup from './CardGroup';
export default {
  name: 'TheCardGroups',
  components: {
    RoomsListLoading,
    CardGroup,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    isViewMode: {
      type: Boolean,
      default: false,
    },
    viewedAgent: {
      type: String,
    },
  },
  data: () => ({
    page: 0,
    limit: 100,
    nameOfContact: '',
    timerId: 0,
    isLoadingRooms: true,
    createdOnFilter: false,
    lastCreatedFilter: true,
    isSearching: false,
    showModalQueue: false,
    queueTags: [],
    queueTagsOptions: [
      {
        value: '',
        label: 'Selecione suas filas',
        role: '',
      },
    ],
  }),
  async mounted() {
    this.listRoom();
    this.listDiscussions();
    // this.getListQueues();
  },
  computed: {
    ...mapGetters({
      rooms: 'chats/rooms/agentRooms',
      rooms_queue: 'chats/rooms/waitingQueue',
      rooms_sent_flows: 'chats/rooms/waitingContactAnswer',
    }),
    ...mapState({
      discussions: (state) => state.chats.discussions.discussions,
      listRoomHasNext: (state) => state.chats.rooms.listRoomHasNext,
      me: (state) => state.profile.me,
    }),
    totalUnreadMessages() {
      return this.rooms.reduce(
        (total, room) =>
          total +
          (this.$store.state.chats.rooms.newMessagesByRoom[room.uuid]?.messages
            ?.length || 0),
        0,
      );
    },
    showNoResultsError() {
      return (
        !this.isLoadingRooms &&
        this.rooms.length === 0 &&
        this.rooms_queue.length === 0 &&
        this.rooms_sent_flows.length === 0 &&
        this.discussions.length === 0
      );
    },
    verifySelectedLength() {
      // console.log(this.queueTags.length);
      return this.queueTags.length > 0;
    },
  },
  watch: {
    totalUnreadMessages: {
      immediate: true,
      handler() {
        window.parent.postMessage(
          {
            event: 'chats:update-unread-messages',
            unreadMessages: this.totalUnreadMessages,
          },
          '*',
        );
      },
    },
    nameOfContact: {
      handler(newNameOfContact) {
        const TIME_TO_WAIT_TYPING = 1300;
        if (this.timerId !== 0) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.listRoom(false);
          if (newNameOfContact) {
            this.isSearching = true;
          } else {
            this.isSearching = false;
          }
        }, TIME_TO_WAIT_TYPING);
      },
    },

    // ['me.email'](newEmail) {
    //   if (newEmail) {
    //     this.getListQueues();
    //   }
    // },

    queueTags: function (queueTags) {
      this.handleQueuesOptions(queueTags);
    },

    queueTagsOptions: {
      handler(newVal) {
        if (newVal.length === 0) {
          this.queueTagsOptions = [
            {
              uuid: null,
              role: 0,
              label: 'Selecione suas filas',
            },
          ];
        }
        console.log(newVal.length);
      },
    },
  },
  methods: {
    async openRoom(room) {
      await this.$store.dispatch('chats/discussions/setActiveDiscussion', null);
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
    },
    async openDiscussion(discussion) {
      await this.$store.dispatch(
        'chats/discussions/setActiveDiscussion',
        discussion,
      );
    },
    clearField() {
      this.nameOfContact = '';
    },
    async listRoom(concat, order = '-last_interaction') {
      this.isLoadingRooms = true;
      const { viewedAgent } = this;
      try {
        await this.$store.dispatch('chats/rooms/getAll', {
          offset: this.page * this.limit,
          concat,
          order,
          limit: this.limit,
          contact: this.nameOfContact,
          viewedAgent,
        });
        this.isLoadingRooms = false;
      } catch {
        this.isLoadingRooms = false;
        console.error('Não foi possível listar as salas');
      }
    },
    searchForMoreRooms() {
      if (this.listRoomHasNext) {
        this.page += 1;
        this.listRoom(true);
      }
    },
    async listDiscussions() {
      try {
        const { viewedAgent } = this;
        await this.$store.dispatch('chats/discussions/getAll', { viewedAgent });
      } catch {
        console.error('Não foi possível listar as discussões');
      }
    },
    handleScroll(target) {
      if (
        target.offsetHeight + Math.ceil(target.scrollTop) >=
        target.scrollHeight
      ) {
        this.searchForMoreRooms(true);
      }
    },

    openModalQueue() {
      this.showModalQueue = true;
      this.getListQueues();
      this.queueTagsOptions = [];
      this.queueTags = [];
    },

    closeModalQueue() {
      this.showModalQueue = false;
      this.queueTags = [];
      this.queueTagsOptions = [];
    },

    async getListQueues() {
      try {
        let me = this.me.email;
        const response = await Room.getListQueues(me);

        response.user_permissions.forEach((permission) => {
          if (permission.role === 1) {
            this.queueTags.push({
              value: permission.uuid,
              label: permission.queue_name,
              role: permission.role,
            });
          }

          this.queueTagsOptions.push({
            value: permission.uuid,
            label: permission.queue_name,
            role: permission.role,
          });
        });
      } catch (error) {
        console.error(error);
      }
    },

    async saveListQueues() {
      try {
        const options = this.queueTagsOptions.map((tag) => tag.value);
        const optionsTags = this.queueTags.map((tag) => tag.value);
        const filter = options.filter((tag) => !optionsTags.includes(tag));

        const selectedTags = optionsTags.map((tag) => ({
          uuid: tag,
          role: 1,
        }));

        const unselectedTags = filter.map((tag) => ({
          uuid: tag,
          role: 2,
        }));

        const response = await Room.editListQueues(
          selectedTags.concat(unselectedTags),
        );

        console.log(response, 'response save');

        return response;
      } catch (error) {
        console.error(error);
      }
    },

    handleQueuesOptions(selectedValues) {
      console.log('Filas selecionadas:', selectedValues);
      if (selectedValues.length === 0) {
        console.log('zeroo');
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;
  .chat-groups {
    flex: 1 1;
    display: flex;
    flex-direction: column;
    margin-top: $unnnic-spacing-sm;
    padding-right: $unnnic-spacing-xs;
    margin-right: -$unnnic-spacing-xs; // For the scrollbar to stick to the edge
    overflow-y: auto;
    overflow-x: hidden;
    :deep(.unnnic-collapse) {
      padding-bottom: $unnnic-spacing-sm;
    }
    .no-results {
      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-gt;
    }
  }
  .order-by {
    display: flex;
    justify-content: space-between;
    gap: $unnnic-spacing-xs;
    align-items: center;
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
  }
  .queue-modal {
    .queue-modal-form {
      display: grid;
      gap: $unnnic-spacing-sm;
      text-align: start;
      .queue-modal-select {
        display: flex;
        gap: $unnnic-spacing-xs;
        .queue-modal-input {
          flex: 1;
        }
      }
    }
    :deep(.unnnic-modal-container) {
      .unnnic-modal-container-background {
        width: 50%;
        &-body-description-container {
          padding-bottom: 0;
        }
      }
    }
    :deep(.unnnic-select-smart) {
      .dropdown-data {
        position: fixed !important;
        top: inherit !important;
      }
    }
  }
}
</style>
