<template>
  <unnnic-button
    class="join-discussion"
    :text="$t('discussions.join')"
    type="primary"
    :loading="isLoading"
    @click="joinDiscussion"
  />
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'ButtonJoinDiscussion',
  data() {
    return {
      isLoading: false,
    };
  },
  computed: {
    ...mapState({
      me: (state) => state.profile.me,
    }),
  },
  methods: {
    async joinDiscussion() {
      this.isLoading = true;
      try {
        await this.$store.dispatch('chats/discussions/addAgent', {
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
