
export interface NavItem {
  title: string
  href: string
}

export const dashboardNav: NavItem[] = [
  {
    title: 'AI Assistants',
    href: '/dashboard/aiassistant',
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
  },
  {
    title: 'Data Import',
    href: '/dashboard/dataimport',
  },
  {
    title: 'Twilio Integration',
    href: '/dashboard/twilio',
  },
  {
    title: 'Voice Clone',
    href: '/dashboard/voiceclone',
  },
  {
    title: 'Appointment Tools',
    href: '/dashboard/appointment-tools',
  }
]
