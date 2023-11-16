<template>
  <unnnic-collapse :title="label" :active="true" size="md">
    <template v-if="rooms">
      <room-card
        v-for="room in rooms"
        :key="room.id"
        :room="room"
        @click="open(room)"
        :unselected="!!activeDiscussionId"
      />
    </template>
    <template v-if="discussions">
      <unnnic-chats-contact
        v-for="discussion in discussions"
        :key="discussion.uuid"
        :title="discussion.subject"
        :discussionGoal="discussion.contact"
        :tabindex="0"
        :selected="discussion.uuid === activeDiscussionId"
        :unreadMessages="unreadMessages(discussion.uuid)"
        @click="open(discussion)"
        @keypress.enter="open(discussion)"
      />
    </template>
  </unnnic-collapse>
</template>

<script>
import { mapState } from 'vuex';
import RoomCard from './RoomCard';

export default {
  name: 'CardGroup',

  components: {
    RoomCard,
  },

  data() {
    return {
      isDefaultOpen: true,
    };
  },

  props: {
    rooms: {
      type: Array,
    },
    discussions: {
      type: Array,
    },
    label: {
      type: String,
      default: '',
    },
  },

  created() {
    if (!this.rooms && !this.discussions) {
      throw new Error('Pass rooms and discussions as a prop!');
    }
  },

  computed: {
    ...mapState({
      newMessagesByDiscussion(state) {
        return state.chats.discussions.newMessagesByDiscussion;
      },
      activeDiscussionId: (state) => state.chats.discussions.activeDiscussion?.uuid,
    }),
  },

  methods: {
    open(room) {
      this.$emit('open', room);
    },
    unreadMessages(discussionId) {
      const { newMessagesByDiscussion } = this;
      return newMessagesByDiscussion?.[discussionId]?.messages?.length || 0;
    },
  },
};
</script>
