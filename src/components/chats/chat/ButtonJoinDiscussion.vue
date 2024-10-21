<template>
  <UnnnicButton
    class="join-discussion"
    :text="$t('discussions.join')"
    type="primary"
    :loading="isLoading"
    @click="joinDiscussion()"
  />
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';
export default {
  name: 'ButtonJoinDiscussion',
  emits: ['join', 'click'],
  data() {
    return {
      isLoading: false,
    };
  },
  computed: {
    ...mapState(useProfile, ['me']),
  },
  methods: {
    ...mapActions(useDiscussions, ['addAgent']),
    async joinDiscussion() {
      this.isLoading = true;
      try {
        await this.addAgent({
          user_email: this.me.email,
        });
        this.$emit('join');
      } catch (error) {
        console.error('An error ocurred when try join at discussion:', error);
      }

      this.$emit('click');
      this.isLoading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.join-discussion {
  margin: auto $unnnic-spacing-inline-sm 0;
}
</style>
