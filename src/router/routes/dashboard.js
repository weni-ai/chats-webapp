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
  {
    path: '/dashboard/view-mode/:viewedAgent',
    name: 'dashboard.view-mode',
    component: () => import('@/views/Dashboard/ViewMode'),
  },
];

export default routes;
