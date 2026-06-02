<!-- This component was migrated from unnnic. -->
<template>
  <section class="unnnic-chats-message__text__container">
    <p
      class="unnnic-chats-message__text"
      v-html="formattedText"
    />
    <p
      v-if="isAutomatic"
      class="unnnic-chats-message__text--automatic"
    >
      {{ automaticMessageLabel }}
    </p>
  </section>
</template>

<script>
export default {
  name: 'ChatsMessageText',

  props: {
    text: {
      type: String,
      required: true,
    },
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    automaticType: {
      type: String,
      default: 'automatic_open',
    },
  },
  computed: {
    automaticMessageLabel() {
      const labelsByType = {
        automatic_open: this.$t('automatic_message.automatic_opening_message'),
        inactive_warning: this.$t('automatic_message.inactive_warning_message'),
        inactive_close: this.$t('automatic_message.inactive_close_message'),
      };
      return labelsByType[this.automaticType];
    },
    formattedText() {
      function treatTextUrl(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
      }

      function removeHtmlDangerousContent(text) {
        return text.replace(
          /<(\/)?([^> ]+)( [^>]+)?>/gi,
          ($1, $2 = '', $3, $4 = '') => {
            if (['b', 'i', 'u', 'ul', 'li', 'br', 'div'].includes($3)) {
              const complements = [];

              for (const i of $4.matchAll(
                /((?<name1>[^ =]+)="(?<value1>[^"]*)"|(?<name2>[^ =]+)='(?<value2>[^"]*)')/g,
              )) {
                const name = i.groups.name1 || i.groups.name2;
                const value = i.groups.value1 || i.groups.value2;

                if (name === 'style') {
                  const styles = [];

                  for (const j of value.matchAll(
                    /(?<propertyName>[^:]+):(?<propertyValue>[^;]+);?/g,
                  )) {
                    if (
                      j.groups.propertyName.toLowerCase().trim() ===
                      'text-align'
                    ) {
                      styles.push(
                        `${j.groups.propertyName
                          .toLowerCase()
                          .trim()}: ${j.groups.propertyValue.trim()}`,
                      );
                    }
                  }

                  complements.push(`style="${styles.join('; ')};"`);
                }
              }

              return `<${$2}${$3}${
                complements.length ? ` ${complements.join(' ')}` : ''
              }>`;
            }

            return '';
          },
        );
      }

      const formattedText = treatTextUrl(
        removeHtmlDangerousContent(this.text).trim()?.replace(/\n/g, '<br/>'),
      );

      return typeof this.text === 'string' ? formattedText : '';
    },
  },
};
</script>

<style lang="scss" scoped>
.unnnic-chats-message__text {
  &__container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
    padding: $unnnic-spacing-nano 0;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-fg-emphasized;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-medium;
    word-break: break-word;
  }
  &--automatic {
    font-size: $unnnic-font-size-body-md;
    line-height: $unnnic-line-height-caption-1;
    color: $unnnic-color-fg-info;
  }
}
</style>
