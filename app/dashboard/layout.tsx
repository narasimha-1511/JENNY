"use client"
import { Sidebar } from '@/components/dashboard/sidebar'
import React from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { useUser } from '@/hooks/use-user'

const layout = ({ children }: { children: React.ReactNode}) => {
  const pathname = usePathname();
  const { user , loading} = useUser()

  const getTitle = (pathname : string) => {
    switch (pathname) {
      case '/dashboard/aiassistant':
        return 'AI Assistants';
      case '/dashboard/calendar':
        return 'Calendar';
      case '/dashboard/dataimport':
        return 'Data Import';
      case '/dashboard/twilio':
        return 'Twilio Integration';
      default:
        return '';
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar  />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 flex items-center justify-between pr-8">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-semibold text-gray-900">{getTitle(pathname)}</h1>
                    </div>
                </div>
                  <div className="flex items-center gap-2">
                      <Icon name="mail" className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700"> { !loading && user?.email }</span>
                  </div>
            </header>
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
        </div>
      </div>
    </div>
  )
}

export default layout
