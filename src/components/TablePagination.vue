<template>
  <div class="table-pagination">
    <table-pagination-loading v-show="isLoading" />
    <section
      v-show="!isLoading"
      class="table-pagination__pages"
      :class="{
        'table-pagination__pages--itens-center': !showCount,
        'table-pagination__pages--with-divider': !isMobile,
      }"
    >
      <p class="table-pagination__count" v-if="showCount">
        {{ tablePagination }}
      </p>

      <unnnic-pagination
        :value="value"
        @input="$emit('input', $event)"
        :max="countPages"
        :show="limit"
      />
    </section>
  </div>
</template>

<script>
import isMobile from 'is-mobile';

import TablePaginationLoading from '@/views/loadings/TablePaginationLoading';

export default {
  name: 'TablePagination',

  components: {
    TablePaginationLoading,
  },

  props: {
    value: {
      type: Number,
      required: true,
    },
    count: {
      type: Number,
      required: false,
    },
    countPages: {
      type: Number,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: false,
    },
  },

  data() {
    return {
      isMobile: isMobile(),
    };
  },

  computed: {
    tablePagination() {
      const { value, limit, count } = this;

      return this.$t('pagination', {
        from: count === 0 ? 0 : (value - 1) * limit + 1,
        to: Math.min(value * limit, count),
        total: count,
      });
    },

    showCount() {
      return typeof this.count === 'number';
    },
  },
};
</script>

<style lang="scss" scoped>
.table-pagination {
  &__pages {
    display: flex;
    align-items: center;
    justify-content: space-between;

    height: min-content;

    &--itens-center {
      justify-content: center;
    }

    &--with-divider {
      margin-top: $unnnic-spacing-md;
      border-top: $unnnic-border-width-thinner solid $unnnic-color-neutral-soft;
      padding-top: $unnnic-spacing-md;
    }
  }

  &__count {
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
  }
}
</style>
