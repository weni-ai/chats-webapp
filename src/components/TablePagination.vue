<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="table-pagination">
    <TablePaginationLoading v-show="isLoading" />
    <section
      v-show="!isLoading"
      class="table-pagination__pages"
      :class="{
        'table-pagination__pages--itens-center': !showCount,
        'table-pagination__pages--with-divider': !isMobile,
      }"
    >
      <p
        class="table-pagination__count"
        v-if="showCount"
      >
        {{ tablePagination }}
      </p>

      <UnnnicPagination
        :modelValue="modelValue"
        @update:model-value="$emit('update:model-value', $event)"
        :max="countPages"
        :show="limit"
      />
    </section>
  </div>
</template>

<script>
import isMobile from 'is-mobile';

import TablePaginationLoading from '@/views/loadings/TablePaginationLoading.vue';

export default {
  name: 'TablePagination',

  emits: ['update:model-value'],

  components: {
    TablePaginationLoading,
  },

  props: {
    modelValue: {
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
      const { modelValue, limit, count } = this;
      return this.$t('pagination', {
        from: count === 0 ? 0 : (modelValue - 1) * limit + 1,
        to: Math.min(modelValue * limit, count),
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
