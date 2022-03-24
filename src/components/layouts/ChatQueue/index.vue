<template>
  <div class="container">
    <chat-group
      v-for="chat in chats"
      :key="chat.name"
      :chat-group="chat"
      :background-darkest="chat.name === 'Fila'"
    />
  </div>
</template>

<script>
import ChatGroup from './ChatGroup';

export default {
  name: 'ChatQueue',

  components: {
    ChatGroup,
  },

  data: () => ({
    chats: [
      {
        name: 'Fila',
        chats: [
          {
            id: '1',
            username: 'João Cláudio',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 8,
          },
          {
            id: '2',
            username: 'Marcela Barros',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 5,
          },
          {
            id: '3',
            username: 'Roberto Barcelos',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 10,
          },
        ],
      },
      {
        name: 'Chats Abertos',
        chats: [
          {
            id: '4',
            username: 'Pedro Pontes',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 8,
          },
          {
            id: '5',
            username: 'Ilanna Lins',
            lastMessage: 'Acho que podemos conversar ama...',
            active: true,
            unreadedMessages: 5,
          },
          {
            id: '6',
            username: 'Rafael Felipe',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 10,
          },
          {
            id: '7',
            username: 'Milton Neves',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 8,
          },
          {
            id: '8',
            username: 'Thiago Paiva',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 5,
          },
          {
            id: '9',
            username: 'Agnaldo França',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 10,
          },
          {
            id: '10',
            username: 'Tânia Almeida',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 8,
          },
          {
            id: '11',
            username: 'Thiago Paiva',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 5,
          },
          {
            id: '12',
            username: 'Cíntia Silva',
            lastMessage: 'Acho que podemos conversar ama...',
            unreadedMessages: 10,
          },
        ],
      },
    ],
  }),
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 1rem;
}
</style>
