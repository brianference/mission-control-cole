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
    id: 'tasks',
    label: 'Tasks',
    icon: '✅',
    url: '/tasks',
    subItems: [
      {
        id: 'kanban',
        label: 'Kanban',
        icon: '📋',
        url: 'https://python-kanban.pages.dev',
        external: true,
      },
    ],
  },
  {
    id: 'secret-vault',
    label: 'Secret Vault',
    icon: '🔐',
    url: 'https://secret-vault-9r3.pages.dev',
    external: true,
  },
  {
    id: 'itinerary',
    label: 'Itinerary',
    icon: '🗾',
    url: 'https://tokyo-itinerary.pages.dev',
    external: true,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: '📅',
    url: '/calendar',
    badge: { count: 3, text: 'Today' },
  },
  {
    id: 'costs',
    label: 'Costs',
    icon: '💰',
    url: '/costs',
    badge: { text: '$981', status: 'warning' },
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
    id: 'skills',
    label: 'Skills',
    icon: '🎯',
    url: '/skills',
    badge: { count: 96 },
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: '🤖',
    url: '/agents',
    badge: { count: 8, status: 'success' },
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: '🚀',
    url: '/apps',
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: '📜',
    url: '/logs',
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
        id: 'content',
        label: 'Content',
        icon: '📝',
        url: '/content',
        badge: { count: 7, status: 'warning' },
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
