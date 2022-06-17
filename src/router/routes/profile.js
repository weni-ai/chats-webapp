const routes = [
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/layouts/ProfileLayout'),
    children: [
      {
        path: 'preferences',
        component: () => import('@/views/profile/Preferences'),
      },

      {
        path: '*',
      },
    ],
  },
];

export default routes;
