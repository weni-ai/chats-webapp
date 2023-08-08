<template>
  <app-accordion :title="label" :isDefaultOpen="isDefaultOpen" @change="changeAccordionOption">
    <template v-slot:content>
      <div class="chat-group">
        <ul class="chats" :class="{ filled }">
          <li v-for="room in rooms" :key="room.id">
            <contact-room
              :room="room"
              @click="open(room)"
              :filled="filled"
              :disabled="disabled"
              :use-photo="usePhoto"
            />
          </li>
        </ul>
      </div>
    </template>
  </app-accordion>
</template>

<script>
import AppAccordion from '@/components/chats/AppAccordion';
import ContactRoom from './ContactRoom';

export default {
  name: 'RoomGroup',

  components: {
    ContactRoom,
    AppAccordion,
  },

  created() {
    this.isDefaultOpen = !!Number(localStorage.getItem(this.id));
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
    disabled: {
      type: Boolean,
      default: false,
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
    usePhoto: {
      type: Boolean,
      default: false,
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
