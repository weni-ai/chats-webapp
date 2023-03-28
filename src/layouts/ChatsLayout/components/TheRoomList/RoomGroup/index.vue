<template>
  <app-accordion>
    <template v-slot:title>
      <div class="chat-group" :class="{ disabled }">
        <header>
          <h2>{{ label }}</h2>
        </header>
      </div>
    </template>
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
  <!-- <div class="chat-group" :class="{ disabled }">
    <header>
      <h2>{{ label }}</h2>
    </header>

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
  </div> -->
</template>

<script>
import ContactRoom from './ContactRoom';
import AppAccordion from './AppAccordion';

export default {
  name: 'RoomGroup',

  components: {
    ContactRoom,
    AppAccordion,
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
    usePhoto: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    open(room) {
      this.$emit('open', room);
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-group {
  &.disabled {
    header {
      h2 {
        color: $unnnic-color-neutral-lightest;
      }
    }
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 0 0.5rem 0.5rem;
    h2 {
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-regular;
      line-height: 1.25rem;
      color: $unnnic-color-neutral-cloudy;
    }
  }

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
