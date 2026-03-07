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

      function handleUserName(data) {
        if (data.type === 'user') {
          return data.name || data.email;
        }
        return data.name;
      }

      function getPickLabel(action, from, to) {
        if (action === 'pick') {
          if (from?.type === 'user') {
            return t('chats.feedback.pick_of_agent', {
              manager: handleUserName(to),
              agent: handleUserName(from),
            });
          }
          if (from?.type === 'queue') {
            return t('chats.feedback.pick_of_queue', {
              agent: handleUserName(to),
              queue: handleUserName(from),
            });
          }
        }
        return '';
      }

      const getTransferLabel = (action, from, to) => {
        if (action === 'transfer') {
          if (from?.type === 'user' && to?.type === 'queue') {
            return t('chats.feedback.transfer_to_queue', {
              agent: handleUserName(from),
              queue: handleUserName(to),
            });
          }
          if (from?.type === 'queue' && to?.type === 'queue') {
            return t('chats.feedback.transfer_from_queue_to_queue', {
              queue1: handleUserName(from),
              queue2: handleUserName(to),
            });
          }
          if (from?.type === 'queue' && to?.type === 'user') {
            return t('chats.feedback.transfer_from_queue_to_agent', {
              queue: handleUserName(from),
              agent: handleUserName(to),
            });
          }
          if (from?.type === 'user' && to?.type === 'user') {
            return t('chats.feedback.transfer_to_agent', {
              agent1: handleUserName(from),
              agent2: handleUserName(to),
            });
          }
        }
        return '';
      };

      function getForwardLabel(action, to) {
        if (action === 'forward') {
          if (to?.type === 'user') {
            return t('chats.feedback.forwarded_to_agent', {
              agent: handleUserName(to),
            });
          }
          if (to?.type === 'queue') {
            return t('chats.feedback.forwarded_to_queue', {
              queue: handleUserName(to),
            });
          }
        }
        return '';
      }

      const getAutoAssignFromQueueLabel = (action, from, to) => {
        if (action === 'auto_assign_from_queue') {
          return t('chats.feedback.automatic_transfer_from_queue', {
            agent: handleUserName(to),
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
