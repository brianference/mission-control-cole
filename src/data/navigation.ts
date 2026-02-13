// Mission Control Dashboard - Navigation Configuration
import type { NavItem } from '../types';

export const navigationItems: NavItem[] = [
  {
    id: 'ideas',
    label: 'Ideas',
    icon: '💡',
    url: '/ideas',
    badge: { count: 12 },
  },
  {
    id: 'content',
    label: 'Content',
    icon: '📝',
    url: '/content',
    badge: { count: 7, status: 'warning' },
    subItems: [
      {
        id: 'swordtruth',
        label: '@swordtruth',
        icon: '🗣️',
        url: '/content/swordtruth',
      },
      {
        id: 'scheduled',
        label: 'Scheduled',
        icon: '⏰',
        url: '/content/scheduled',
      },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: '✅',
    url: 'https://python-kanban.pages.dev',
    external: true,
    badge: { count: 17, status: 'info' },
    subItems: [
      {
        id: 'kanban',
        label: 'Kanban',
        icon: '📋',
        url: 'https://python-kanban.pages.dev',
        external: true,
      },
      {
        id: 'my-tasks',
        label: 'My Tasks',
        icon: '👤',
        url: '/tasks/mine',
      },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: '📅',
    url: '/calendar',
    badge: { count: 3, text: 'Today' },
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: '🧠',
    url: 'https://second-brain-cole.pages.dev',
    external: true,
    badge: { count: 1247 },
    subItems: [
      {
        id: 'second-brain',
        label: 'Second Brain',
        icon: '🧠',
        url: 'https://second-brain-cole.pages.dev',
        external: true,
      },
      {
        id: 'search',
        label: 'Search',
        icon: '🔍',
        url: '/memory/search',
      },
    ],
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: '📄',
    url: '/docs',
    badge: { status: 'success', text: 'Updated' },
    subItems: [
      {
        id: 'projects',
        label: 'Projects',
        icon: '🚀',
        url: '/docs/projects',
      },
      {
        id: 'skills',
        label: 'Skills',
        icon: '🎯',
        url: '/docs/skills',
      },
      {
        id: 'agents',
        label: 'Agents',
        icon: '🤖',
        url: '/docs/agents',
      },
    ],
  },
];

export const secondaryNavItems: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    url: '/settings',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    url: '/profile',
  },
];
