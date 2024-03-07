import Home from '@/views/chats/Home';

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
    path: '/chats/:roomId',
    name: 'room',
    component: Home,
    props: (route) => ({
      roomId: route.params.roomId,
    }),
  },
  {
    path: '/discussions/:discussionId',
    name: 'discussion',
    component: Home,
    props: (route) => ({
      discussionId: route.params.discussionId,
    }),
  },
  {
    path: '/closed-chats',
    name: 'closed-rooms',
    component: () => import('@/views/chats/ClosedChats/index'),
    props: (route) => ({
      contactUrn: route.query.contactUrn,
      sector: route.query.sector,
      tags: route.query.tags,
      startDate: route.query.startDate,
      endDate: route.query.endDate,
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
