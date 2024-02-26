import isMobile from 'is-mobile';

import DesktopHome from '@/views/chats/Home';
import MobileHome from '@/views/chats/Mobile/MobileHome';

const Home = isMobile() ? MobileHome : DesktopHome;

const routes = [
  {
    path: '/',
    name: 'root',
    beforeEnter: (from, to, next) => {
      if (to.path === '/') {
        if (isMobile()) {
          next({ name: 'orgs', replace: true });
        } else {
          next({ name: 'home', replace: true });
        }
      } else next(to.path);
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
