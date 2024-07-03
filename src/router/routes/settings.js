const routes = [
  {
    path: '/settings',
    component: () => import('@/layouts/SettingsLayout/index.vue'),
    children: [
      {
        path: '/settings',
        name: 'sectors',
        component: () => import('@/views/Settings/index.vue'),
      },

      {
        path: 'sectors/new',
        name: 'sectors.new',
        component: () => import('@/views/Settings/Sectors/New.vue'),
      },
      {
        path: 'sectors/:uuid',
        name: 'sectors.edit',
        component: () => import('@/views/Settings/Sectors/Edit.vue'),
        props: (route) => ({
          uuid: route.params.uuid,
          tab: route.query.tab,
        }),
      },
    ],
  },
];

export default routes;
