<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="modal">
    <div class="modal-container">
      <div class="modal-container-background">
        <div class="modal-background-color">
          <div>
            <unnnic-progress-bar v-model="percentage"> </unnnic-progress-bar>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalProgressTemplateSubmission',
  data: () => ({
    percentage: 30,
  }),
  mounted() {
    setTimeout(() => {
      // eslint-disable-next-line no-undef
      this.$emit('close');
    }, 2000);
  },
};
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}
.modal-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.modal-container-background {
  width: 498px;
  box-shadow: 0 8px 16px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: $unnnic-color-background-carpet;
}
.modal-background-color {
  min-height: 55px;

  .content-title {
    color: $unnnic-color-neutral-darkest;
    font-weight: $unnnic-font-weight-black;
    font-size: $unnnic-font-size-title-sm;
    line-height: $unnnic-line-height-md;
    margin-top: 18px;
    margin-bottom: 32px;
    text-align: center;
  }
}
</style>
