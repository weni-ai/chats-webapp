<template>
  <section class="table-metrics">
    <p class="table-metrics__title">
      <unnnic-avatar-icon :icon="icon" size="xs" scheme="feedback-green" />
      <span> {{ title }} </span>
    </p>

    <section class="table-metrics__table">
      <header class="headers table-row">
        <span v-for="header in headers" :key="header.value" class="header table-col">{{
          header.text
        }}</span>
      </header>

      <section class="items">
        <section v-for="item in items" :key="item.id" class="item table-row">
          <span v-for="header in headers" :key="header.value" class="table-col">
            {{ item[header.value] }}
          </span>
        </section>
      </section>
    </section>
  </section>
</template>

<script>
export default {
  props: {
    headers: {
      type: Array,
      default: () => [],
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
      }
    }
  }
}
</style>
