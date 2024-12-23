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
        path: 'sectors/:uuid',
        name: 'sectors.edit',
        component: () => import('@/views/Settings/Sectors/Edit/index.vue'),
      },
    ],
  },
];

export default routes;
