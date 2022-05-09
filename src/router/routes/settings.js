const routes = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/layouts/SettingsLayout'),
    children: [
      {
        path: 'chats',
        name: 'chats',
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
            meta: {
              breadcrumb: [{ name: 'Chats', path: '/settings/chats' }, { name: 'Novo setor' }],
            },
          },
          {
            path: ':id',
            name: 'sectors.view',
            component: () => import('@/views/Settings/Sectors/View'),
            props: (route) => ({
              id: route.params.id,
            }),
            meta: {
              breadcrumb: [
                { name: 'Chats', path: '/settings/chats' },
                { getter: 'settings/getActiveSector', name: (sector) => sector?.name },
              ],
            },
          },
          {
            path: ':id/edit',
            name: 'sectors.edit',
            component: () => import('@/views/Settings/Sectors/Edit'),
            props: (route) => ({
              id: route.params.id,
            }),
            meta: {
              breadcrumb: [
                { name: 'Chats', path: '/settings/chats' },
                {
                  getter: 'settings/getSectorById',
                  name: (getter, routeParams) => getter(Number(routeParams.id))?.name,
                  path: (getter, routeParams) => {
                    const sector = getter(Number(routeParams.id));

                    return sector ? `/settings/chats/sectors/${sector.id}` : null;
                  },
                },
                { name: 'Editar setor' },
              ],
            },
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
