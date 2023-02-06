import Home from '@/views/chats/Home';
import ActiveChat from '@/views/chats/ActiveChat.vue';
// import dashboard from 'C:/WORKSPACE/chats-webapp/src/views/Dashboard/Manager/index.vue'
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
    path: '/dashboard/manager',
    name: 'dashboard.manager',
    component: dashboard,
  },
  {
    path: '/chats/:id',
    name: 'room',
    component: ActiveChat,
    props: (route) => ({
      id: route.params.id,
    }),
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
