import Home from '@/views/chats/Home';
import ActiveChat from '@/views/chats/ActiveChat.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
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
    component: () => import(/* webpackChunkName: "closed-chats" */ '@/views/chats/ClosedChats'),
    props: (route) => ({
      tag: route.query.tag,
    }),
  },
];

export default routes;
