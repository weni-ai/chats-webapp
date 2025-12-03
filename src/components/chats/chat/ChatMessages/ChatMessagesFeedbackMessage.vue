<template>
  <ChatFeedback
    :feedback="createFeedbackLabel(message)"
    :scheme="scheme"
    :clickable="clickable"
    data-testid="chat-feedback"
  />
</template>

<script>
import ChatFeedback from '../ChatFeedback.vue';

export default {
  name: 'ChatMessagesFeedbackMessage',

  components: {
    ChatFeedback,
  },

  props: {
    message: {
      type: Object,
      required: true,
    },
    scheme: {
      type: String,
      default: 'blue',
    },
    clickable: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    createFeedbackLabel(message) {
      const textJson = JSON.parse(message.text);

      const t = (key, params) => this.$t(key, params);

      const isOldFeedback = textJson.type;

      if (isOldFeedback) {
        const { type, name } = textJson;

        const oldFeedbackLabels = {
          queue: t('contact_transferred_to_queue', { queue: name }),
          user: t('contact_transferred_to_agent', { agent: name }),
        };
        return oldFeedbackLabels[type];
      }

      const { method, content, see_all_internal_notes_chip } = textJson;

      if (see_all_internal_notes_chip) {
        return t('chats.feedback.see_all_internal_notes');
      }

      function getPickLabel(action, from, to) {
        if (action === 'pick') {
          if (from?.type === 'user') {
            return t('chats.feedback.pick_of_agent', {
              manager: to.name,
              agent: from.name,
            });
          }
          if (from?.type === 'queue') {
            return t('chats.feedback.pick_of_queue', {
              agent: to.name,
              queue: from.name,
            });
          }
        }
        return '';
      }

      const getTransferLabel = (action, from, to) => {
        if (action === 'transfer') {
          if (from?.type === 'user' && to?.type === 'queue') {
            return t('chats.feedback.transfer_to_queue', {
              agent: from.name,
              queue: to.name,
            });
          }
          if (from?.type === 'queue' && to?.type === 'queue') {
            return t('chats.feedback.transfer_from_queue_to_queue', {
              queue1: from.name,
              queue2: to.name,
            });
          }
          if (from?.type === 'queue' && to?.type === 'user') {
            return t('chats.feedback.transfer_from_queue_to_agent', {
              queue: from.name,
              agent: to.name,
            });
          }
          if (from?.type === 'user' && to?.type === 'user') {
            return t('chats.feedback.transfer_to_agent', {
              agent1: from.name,
              agent2: to.name,
            });
          }
        }
        return '';
      };

      function getForwardLabel(action, to) {
        if (action === 'forward') {
          if (to?.type === 'user') {
            return t('chats.feedback.forwarded_to_agent', {
              agent: to.name,
            });
          }
          if (to?.type === 'queue') {
            return t('chats.feedback.forwarded_to_queue', {
              queue: to.name,
            });
          }
        }
        return '';
      }

      const getAutoAssignFromQueueLabel = (action, from, to) => {
        if (action === 'auto_assign_from_queue') {
          return t('chats.feedback.automatic_transfer_from_queue', {
            agent: to.name,
          });
        }

        return '';
      };

      const feedbackLabels = {
        rt:
          getPickLabel(content.action, content.from, content.to) ||
          getTransferLabel(content.action, content.from, content.to) ||
          getForwardLabel(content.action, content.to) ||
          getAutoAssignFromQueueLabel(content.action, content.from, content.to),
        fs: `${t('flow')} <i>${content.name}</i> ${t('sent')}`,
        ecf: `${content.user} ${t('chats.feedback.edit_custom_field')} <i>${
          content.custom_field_name
        }</i> ${t('from')} <i>${content.old}</i> ${t('to')} <i>${
          content.new
        }</i>`,
        dc: `${t('chats.feedback.discussion_created', {
          agent: content.user,
          queue: content.queue,
        })}`,
        da: `${t('chats.feedback.discussion_joined', { agent: content.user })}`,
      };

      return feedbackLabels[method] || '';
    },
  },
};
</script>
