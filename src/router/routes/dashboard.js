const routes = [
  {
    path: '/dashboard/manager',
    name: 'dashboard.manager',
    component: () => import('@/views/Dashboard/Manager/index.vue'),
  },
  {
    path: '/dashboard/agent',
    name: 'dashboard.agent',
    component: () => import('@/views/Dashboard/Agent/index.vue'),
  },
  {
    path: '/dashboard/view-mode/:viewedAgent',
    name: 'dashboard.view-mode',
    component: () => import('@/views/Dashboard/Manager/index.vue'),
  },
];

export default routes;
