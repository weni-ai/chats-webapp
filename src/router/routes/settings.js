const routes = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/layouts/SettingsLayout'),
    children: [
      {
        path: 'chats',
        name: 'sectors',
        component: () => import('@/views/Settings'),
      },

      {
        path: 'chats/sectors',
        component: { render: (h) => h('router-view') },
        children: [
          {
            path: 'new',
            name: 'sectors.new',
            component: () => import('@/views/Settings/Sectors/New'),
          },
          {
            path: ':uuid',
            name: 'sectors.edit',
            component: () => import('@/views/Settings/Sectors/Edit'),
            props: (route) => ({
              uuid: route.params.uuid,
            }),
          },
        ],
      },

      {
        path: '*',
        component: { render: (h) => h('router-view') },
      },
    ],
  },
];

export default routes;
