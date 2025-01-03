'use client'

import { usePathname } from 'next/navigation'
import { dashboardNav } from '@/config/dashboard'
import { useUser } from '@/hooks/use-user'
import { Icon } from '../ui/icons'

export function DashboardHeader() {
  const pathname = usePathname()
  const currentRoute = dashboardNav.find(item => item.href === pathname)
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold p-6">
            {currentRoute?.title || 'Dashboard'}
          </h1>
        </div>
        <div className="p-6 text-gray-500 flex gap-2 items-center">
          <Icon name='mail' className="h-5 w-5 text-gray-500" />
          {user?.email}
        </div>
      </div>
    </header>
  )
}
