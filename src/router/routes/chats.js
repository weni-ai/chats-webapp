import ChatsLayout from '@/layouts/ChatsLayout';
import ActiveChat from '@/views/ActiveChat.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: ChatsLayout,
  },
  {
    path: '/chats/:id',
    name: 'chat',
    component: ActiveChat,
    props: (route) => ({
      id: route.params.id,
    }),
  },
  {
    path: '/closed-chats',
    name: 'closed-chats',
    component: () => import(/* webpackChunkName: "closed-chats" */ '@/views/ClosedChats'),
  },
];

export default routes;
