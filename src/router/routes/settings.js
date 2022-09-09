const routes = [
  {
    path: '/settings',
    component: () => import('@/layouts/SettingsLayout'),
    children: [
      {
        path: '/settings',
        name: 'settings',
        component: () => import('@/views/Settings'),
      },

      {
        path: 'sectors/new',
        name: 'sectors.new',
        component: () => import('@/views/Settings/Sectors/New'),
      },
      {
        path: 'sectors/:uuid',
        name: 'sectors.edit',
        component: () => import('@/views/Settings/Sectors/Edit'),
        props: (route) => ({
          uuid: route.params.uuid,
          tag: route.query.tag,
        }),
      },
    ],
  },
];

export default routes;
