'use client';

import { useUser } from '@/hooks/use-user';
import { Icon } from '@/components/ui/icons';

export default function UserSection() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Icon name="mail" className="h-5 w-5 text-gray-500" />
      <span className="text-sm text-gray-700">{user?.email}</span>
    </div>
  );
}
