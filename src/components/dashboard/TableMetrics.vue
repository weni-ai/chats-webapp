<template>
  <section class="table-metrics" style="margin-top: -247px; overflow-y: scroll">
    <p class="table-metrics__title">
      <unnnic-avatar-icon :icon="icon" size="xs" scheme="feedback-green" />
      <span> {{ title }} </span>
    </p>

    <section class="table-metrics__table">
      <header class="headers table-row">
        <span class="header table-col"> Agente </span>
        <span class="header table-col" style="text-align: center"> {{ this.headers }} </span>
        <span class="header table-col"> Encerrados </span>
      </header>

      <section class="items">
        <section
          v-for="item in items"
          :key="item.user"
          @click="goToViewMode(item.user)"
          @keypress.enter="goToViewMode(item.user)"
          class="item table-row"
        >
          <span class="table-col agent">
            <unnnic-icon
              icon="indicator"
              size="sm"
              :scheme="`feedback-${
                item.user_status?.toLowerCase() === 'online' ? 'green' : 'grey'
              }`"
            />
            <p>{{ item.user__first_name }}</p>
          </span>
          <span class="table-col" style="text-align: center">
            {{ item.opened_rooms }}
          </span>
          <span class="table-col" style="text-align: center">
            {{ item.closed_rooms }}
          </span>
        </section>
      </section>
    </section>
  </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    headers: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    items: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: '',
    },
  },

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
    }),
  },

  methods: {
    goToViewMode(viewedAgent) {
      if (viewedAgent === this.me.email) {
        this.$router.push({
          name: 'home',
        });
      } else {
        this.$router.push({
          name: 'dashboard.view-mode',
          params: { viewedAgent },
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.table-metrics {
  background: $unnnic-color-background-snow;
  padding: $unnnic-spacing-inset-sm;
  border-radius: $unnnic-border-radius-sm;

  &__title {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-xs;
    font-size: $unnnic-font-size-title-sm;
    color: $unnnic-color-neutral-darkest;
    margin-bottom: $unnnic-spacing-inline-sm;
  }

  &__table {
    color: $unnnic-color-neutral-cloudy;
    font-size: $unnnic-font-size-body-gt;

    .table-row {
      display: flex;

      .table-col {
        flex: 1 1;

        &:last-of-type {
          flex: 0 1 40%;
          text-align: center;
        }
      }
    }

    .headers {
      background: $unnnic-color-background-carpet;
      padding: $unnnic-spacing-inset-xs $unnnic-spacing-inset-sm;
      border-radius: $unnnic-border-radius-sm;
    }

    .items {
      .item {
        padding: $unnnic-spacing-inset-md $unnnic-spacing-inset-sm;

        .table-col {
          &.agent {
            display: flex;
            align-items: center;
            gap: $unnnic-spacing-inline-nano;
            overflow: hidden;

            p {
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
          }
        }

        &:hover {
          background: $unnnic-color-background-carpet;
          text-decoration: underline;
          text-underline-position: under;

          cursor: pointer;
        }
      }
    }
  }
}
</style>
