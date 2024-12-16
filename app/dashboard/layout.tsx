"use client"
import { Sidebar } from '@/components/dashboard/sidebar'
import React from 'react'
import { usePathname } from 'next/navigation'

const layout = ({ children }: { children: React.ReactNode}) => {
  const pathname = usePathname();

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
            <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-semibold text-gray-900">{getTitle(pathname)}</h1>
                    </div>
                </div>
            </header>
            
                {children}
        </div>
      </div>
    </div>
  )
}

export default layout
