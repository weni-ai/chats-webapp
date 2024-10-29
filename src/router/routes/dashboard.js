const routes = [
  {
    path: '/dashboard/manager',
    name: 'dashboard.manager',
    component: () => import('@/views/Dashboard/Manager/index.vue'),
  },
  {
    path: '/dashboard/view-mode/:viewedAgent/:oldModule?',
    name: 'dashboard.view-mode',
    component: () => import('@/views/Dashboard/Manager/index.vue'),
  },
];

export default routes;
