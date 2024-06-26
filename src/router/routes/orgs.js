const routes = [
  {
    path: '/orgs',
    name: 'orgs',
    component: () => import('@/views/chats/Mobile/MobileSelectOrgProject.vue'),
    beforeEnter: async (to, from, next) => {
      if (from.name === 'home') {
        // eslint-disable-next-line no-param-reassign
        to.params.from = 'home';
      }
      next();
    },
  },
  {
    path: '/orgs/:orgUuid/projects',
    name: 'projects',
    component: () => import('@/views/chats/Mobile/MobileSelectOrgProject.vue'),
    props: (route) => ({
      orgUuid: route.params.orgUuid,
    }),
  },
];

export default routes;
