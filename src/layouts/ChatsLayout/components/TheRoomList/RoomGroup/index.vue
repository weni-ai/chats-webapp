<template>
  <unnnic-collapse :title="label" :active="true" @change="changeAccordionOption" size="md">
    <contact-room
      v-for="room in rooms"
      :key="room.id"
      :room="room"
      @click="open(room)"
      :filled="filled"
    />
  </unnnic-collapse>
</template>

<script>
import ContactRoom from './ContactRoom';

export default {
  name: 'RoomGroup',

  components: {
    ContactRoom,
  },

  data() {
    return {
      isDefaultOpen: true,
    };
  },

  props: {
    rooms: {
      type: Array,
      required: true,
    },
    filled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: '',
    },
    id: {
      type: String,
      default: '',
    },
  },

  methods: {
    open(room) {
      this.$emit('open', room);
    },

    changeAccordionOption(parameter) {
      localStorage.setItem(this.id, Number(parameter));
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-group {
  ul.chats {
    list-style-type: none;
    margin: 0;
    padding: 0;

    &.filled {
      background: $unnnic-color-background-carpet;
    }

    li + li {
      padding-top: $unnnic-inline-xs;
    }
  }
}
</style>
