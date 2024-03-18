const routes = [
  {
    path: '/orgs',
    name: 'orgs',
    component: () => import('@/views/chats/Mobile/MobileSelectOrgProject'),
  },
  {
    path: '/orgs/:orgUuid/projects',
    name: 'projects',
    component: () => import('@/views/chats/Mobile/MobileSelectOrgProject'),
    props: (route) => ({
      orgUuid: route.params.orgUuid,
    }),
  },
];

export default routes;
