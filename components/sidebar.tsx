'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      // Force a hard redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className={cn(
        'h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('ml-auto', collapsed && 'rotate-180')}
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2',
            !collapsed && 'text-left'
          )}
          onClick={() => {}}
        >
          <Icon name="bot" className="h-4 w-4" />
          {!collapsed && <span>AI Assistant</span>}
        </Button>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="destructive"
          className={cn(
            'w-full justify-start gap-2',
            !collapsed && 'text-left'
          )}
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <Icon name="logOut" className="h-4 w-4" />
          {!collapsed && <span>{isSigningOut ? 'Signing out...' : 'Logout'}</span>}
        </Button>
      </div>
    </div>
  );
}