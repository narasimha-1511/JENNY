import {
  Bot,
  Settings,
  Mail,
  Lock,
  LogOut,
  ChevronLeft,
  Plus,
  X,
  PhoneCall,
  PlayCircle,
  Volume2,
  VolumeX,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  Mic,
  Square,
  Upload,
  Play,
  Trash,
  type Icon as LucideIcon,
  type LucideProps,
} from 'lucide-react';
import { memo } from 'react';

const IconComponents: Record<string, typeof LucideIcon> = {
  bot: Bot,
  settings: Settings,
  mail: Mail,
  lock: Lock,
  logOut: LogOut,
  chevronLeft: ChevronLeft,
  plus: Plus,
  x: X,
  'tasks-checked': CheckCircle,
  'phone-call': PhoneCall,
  'play-circle': Play,
  'volume-up': Volume2,
  'volume-mute': VolumeX,
  'fileSpreadsheet': FileSpreadsheet,
  'mic': Mic,
  'upload': Upload,
  'square': Square,
  calendar: Calendar,
  'play': Play,
  'trash': Trash,
};

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof IconComponents;
}

export const Icon = memo(function Icon({ name, ...props }: IconProps) {
  const IconComponent = IconComponents[name];
  if (!IconComponent) {
    console.error(`Icon "${name}" not found`);
    return null;
  }
  return <IconComponent {...props} />;
});