import ActiveChat from '@/views/ActiveChat.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: ActiveChat,
  },
  {
    path: '/closed-chats',
    name: 'closed-chats',
    component: () => import(/* webpackChunkName: "closed-chats" */ '@/views/ClosedChats'),
  },
];

export default routes;
