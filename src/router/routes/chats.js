import Home from '@/views/chats/Home.vue';

const routes = [
  {
    path: '/',
    name: 'root',
    beforeEnter: (from, to, next) => {
      if (to.path === '/') next({ name: 'home', replace: true });
      else next(to.path);
    },
  },
  {
    path: '/rooms',
    name: 'home',
    component: Home,
  },
  {
    path: '/chats/:id',
    name: 'room',
    component: Home,
    props: (route) => ({
      id: route.params.id,
    }),
  },
  {
    path: '/closed-chats',
    name: 'closed-rooms',
    component: () => import('@/views/chats/ClosedChats/index'),
    props: (route) => ({
      tag: route.query.tag,
    }),
  },
  {
    path: '/closed-chats/:roomId',
    name: 'closed-rooms.selected',
    component: () => import('@/views/chats/ClosedChats/index'),
    props: (route) => ({
      roomId: route.params.roomId,
    }),
  },
];

export default routes;
