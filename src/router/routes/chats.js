import Home from '@/views/chats/Home.vue';
import dashboard from '@/views/Dashboard/Manager/index.vue';

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
    path: '/dashboard/manager',
    name: 'dashboard.manager',
    component: dashboard,
  },
  {
    path: '/closed-chats',
    name: 'rooms.closed',
    component: () => import(/* webpackChunkName: "closed-rooms" */ '@/views/chats/ClosedChats'),
    props: (route) => ({
      tag: route.query.tag,
    }),
  },
];

export default routes;
