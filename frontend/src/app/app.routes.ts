import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Dashboard · TESLA Management',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
  },
  {
    path: 'packages',
    title: 'Packages · TESLA Management',
    loadComponent: () => import('./pages/packages/packages').then((m) => m.PackagesPage),
  },
  {
    path: 'campaigns',
    title: 'Campaigns · TESLA Management',
    loadComponent: () => import('./pages/campaigns/campaigns').then((m) => m.CampaignsPage),
  },
  {
    path: 'agents',
    title: 'Agents · TESLA Management',
    loadComponent: () => import('./pages/agents/agents').then((m) => m.AgentsPage),
  },
  {
    path: 'agent-groups',
    title: 'Agent Groups · TESLA Management',
    loadComponent: () => import('./pages/agent-groups/agent-groups').then((m) => m.AgentGroupsPage),
  },
  {
    path: 'combinations',
    title: 'Combine · TESLA Management',
    loadComponent: () => import('./pages/combinations/combinations').then((m) => m.CombinationsPage),
  },
  { path: '**', redirectTo: 'dashboard' },
];
