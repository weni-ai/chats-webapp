const routes = [
  {
    path: '/dashboard/manager',
    name: 'dashboard.manager',
    component: () => import('@/views/Dashboard/Manager'),
  },
  {
    path: '/dashboard/agent',
    name: 'dashboard.agent',
    component: () => import('@/views/Dashboard/Agent'),
  },
];

export default routes;
