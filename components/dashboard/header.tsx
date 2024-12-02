'use client';

import { Icon } from '@/components/ui/icons';

interface HeaderProps {
  user: any;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <h1 className="text-2xl font-bold text-gray-900">JENNYAI</h1>
          <div className="flex items-center gap-2">
            <Icon name="mail" className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}