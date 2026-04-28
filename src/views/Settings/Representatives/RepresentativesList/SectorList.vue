<template>
  <section
    ref="containerElementRef"
    class="sector-list"
  >
    <UnnnicToolTip
      v-for="(sector, index) in sectorsToShow"
      :key="index"
      enabled
      side="top"
      :text="formatSectorTooltip(sector)"
    >
      <UnnnicTag :text="sector.name" />
    </UnnnicToolTip>
    <UnnnicToolTip
      v-if="hiddenSectorsCount > 0"
      enabled
      side="top"
      :text="overflowTooltip"
    >
      <UnnnicTag :text="`+${hiddenSectorsCount}`" />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import type { RepresentativeSector } from '../types';

defineOptions({
  name: 'RepresentativeSectorList',
});

interface Props {
  sectors: RepresentativeSector[];
}

const props = defineProps<Props>();

const containerElementRef = ref<HTMLElement | null>(null);

/**
 * How many of the first sectors in the list are rendered with their full name tag.
 * The rest (if any) is summarized by a single "+N" tag that shares the row with
 * the last group of visible name tags. Example: 10 sectors, room for 7 "slots" →
 * 6 name tags and one "+4" (6 + 1 = 7).
 * Starts with all sectors; `recalculateVisibleNameTags` tightens the count to fit the width.
 */
const visibleNameTagsCount = ref(props.sectors.length);

let resizeObserver: ResizeObserver | null = null;

const totalSectorsCount = computed(() => props.sectors.length);

const sectorsToShow = computed(() =>
  props.sectors.slice(0, visibleNameTagsCount.value),
);

const hiddenSectorsCount = computed(() =>
  Math.max(0, totalSectorsCount.value - visibleNameTagsCount.value),
);

const hiddenSectors = computed(() =>
  props.sectors.slice(visibleNameTagsCount.value),
);

const overflowTooltip = computed(() =>
  hiddenSectors.value
    .map((sector) => {
      const queues = sector.queues.join('; ').trim();
      return queues ? `${sector.name}: ${queues}` : sector.name;
    })
    .join(' · '),
);

function formatSectorTooltip(sector: RepresentativeSector): string {
  return sector.queues.join('; ').trim();
}

const OVERFLOW_SIZE_TOLERANCE_PX = 1;

/**
 * Bumped on every new scheduled layout run. If it changes while an async
 * `recalculateVisibleNameTags` is in flight, that run is abandoned so only the
 * latest layout pass applies (avoids races and stale counts after quick resize).
 */
let layoutRecalculateGeneration = 0;

function isHorizontalOverflowing(element: HTMLElement): boolean {
  return element.scrollWidth - element.clientWidth > OVERFLOW_SIZE_TOLERANCE_PX;
}

/**
 * Defers a frame twice so the browser can finish reflow (flex, parent size)
 * before we read `scrollWidth` / `clientWidth` — required when the container
 * grows, otherwise the old narrow width is still read and the count never goes up.
 */
function waitForStableLayoutRead(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

function requestSingleAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/**
 * Defer out of the ResizeObserver microtask: mutating the DOM in the same turn
 * triggers "ResizeObserver loop completed with undelivered notifications."
 */
function scheduleRecalculateLayout(): void {
  layoutRecalculateGeneration += 1;
  const runGeneration = layoutRecalculateGeneration;

  requestAnimationFrame(() => {
    void recalculateVisibleNameTags(runGeneration);
  });
}

async function recalculateVisibleNameTags(
  expectedGeneration: number,
): Promise<void> {
  const isStale = () => expectedGeneration !== layoutRecalculateGeneration;
  const container = containerElementRef.value;
  const total = totalSectorsCount.value;

  if (total === 0) {
    if (!isStale()) {
      visibleNameTagsCount.value = 0;
    }
    return;
  }
  if (!container) {
    return;
  }

  // 1) Try to fit every name tag, no "+N" chip. Always re-start from "all" so
  //    the count can go back up when the user widens the view.
  visibleNameTagsCount.value = total;
  await nextTick();
  if (isStale()) {
    return;
  }
  await waitForStableLayoutRead();
  if (isStale()) {
    return;
  }
  if (!isHorizontalOverflowing(container)) {
    return;
  }

  // 2) If not, reserve the last "slot" for the "+N" tag and see how many name
  //    tags can stay before it (6 name tags + "+4" in the example of 7 slots).
  for (let nameTagsToTry = total - 1; nameTagsToTry >= 0; nameTagsToTry--) {
    if (isStale()) {
      return;
    }
    visibleNameTagsCount.value = nameTagsToTry;
    await nextTick();
    if (isStale()) {
      return;
    }
    await requestSingleAnimationFrame();
    if (isStale()) {
      return;
    }
    if (!isHorizontalOverflowing(container)) {
      return;
    }
  }
}

/**
 * Observe the *parent* width, not this section. The section's own width/scroll
 * size changes when we swap name tags for the +N chip (or back), which would
 * re-fire the observer, reset to "show all", overflow again, and flicker forever.
 * The parent column (`flex: 1` on the card) only resizes on viewport/row changes.
 */
onMounted(() => {
  const sectorListRoot = containerElementRef.value;
  if (!sectorListRoot) {
    return;
  }
  const resizeWidthSource = sectorListRoot.parentElement;
  if (!resizeWidthSource) {
    return;
  }
  resizeObserver = new ResizeObserver(() => {
    scheduleRecalculateLayout();
  });
  resizeObserver.observe(resizeWidthSource);
  scheduleRecalculateLayout();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  layoutRecalculateGeneration += 1;
});

watch(
  () => props.sectors,
  () => {
    scheduleRecalculateLayout();
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.sector-list {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  align-content: center;
  gap: $unnnic-space-2;
  min-width: 0;
}
</style>
