<template>
  <div class="contact-infos-loading">
    <header>
      <UnnnicSkeletonLoading tag="div" />
    </header>
    <main>
      <section class="contact-infos-loading__infos">
        <UnnnicSkeletonLoading />
        <UnnnicSkeletonLoading />
        <div class="contact-infos-loading__infos__custom-fields">
          <UnnnicSkeletonLoading
            v-for="custom_field in 4"
            :key="`custom_field-${custom_field}`"
          />
        </div>
        <UnnnicSkeletonLoading />
      </section>
      <section class="contact-infos-loading__transfers">
        <UnnnicSkeletonLoading />
        <div class="contact-infos-loading__transfers__radios">
          <UnnnicSkeletonLoading />
          <UnnnicSkeletonLoading />
        </div>
        <UnnnicSkeletonLoading />
        <UnnnicSkeletonLoading />
      </section>
      <section class="contact-infos-loading__attachments">
        <header>
          <UnnnicSkeletonLoading />
          <UnnnicSkeletonLoading />
        </header>
        <div class="contact-infos-loading__attachments__medias">
          <UnnnicSkeletonLoading
            v-for="media in 8"
            :key="`media-${media}`"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  name: 'ContactInfosLoading',
};
</script>

<style lang="scss" scoped>
.contact-infos-loading {
  display: flex;
  flex-direction: column;

  background-color: $unnnic-color-neutral-white;

  width: 100%;
  height: 100%;

  > header {
    padding: $unnnic-spacing-sm;

    box-shadow: $unnnic-shadow-level-far;

    & > * {
      width: 100%;
      height: 40px;
    }
  }
  main {
    height: 100%;

    & > * {
      &:not(:first-child) {
        border-top: solid 1px $unnnic-color-neutral-soft;
      }

      padding: $unnnic-spacing-xs;
    }

    .contact-infos-loading {
      &__infos {
        display: grid;
        grid-template-rows: 38px 17px auto 38px;
        gap: $unnnic-spacing-sm;

        & > * {
          width: 100%;
          height: 100%;
        }

        &__custom-fields {
          display: grid;
          gap: $unnnic-spacing-nano;
        }
      }

      &__transfers {
        display: grid;
        grid-template-rows: 17px auto 46px 38px;
        gap: $unnnic-spacing-sm;

        & > * {
          width: 100%;
          height: 100%;
        }

        &__radios {
          display: grid;
          grid-template-columns: 80px 80px;
          gap: $unnnic-spacing-sm;

          & > * {
            width: 100%;
            height: 28px;
          }
        }
      }

      &__attachments {
        header {
          display: grid;
          grid-template-columns: 80px 80px;
          gap: $unnnic-spacing-sm;
          padding-bottom: $unnnic-spacing-sm;
          margin-bottom: $unnnic-spacing-sm;
          border-bottom: solid 1px $unnnic-color-neutral-soft;

          & > * {
            width: 100%;
            height: 22px;
          }
        }

        &__medias {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
          gap: $unnnic-spacing-xs;
          & > * {
            aspect-ratio: 1/1;
            width: 100%;
            height: 100%;
          }
        }
      }
    }
  }
}
</style>
