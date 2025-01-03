import { Icon } from '@/components/ui/icons';
import { useUser } from '@/hooks/use-user';
import { useAppointmentTools } from '@/hooks/use-appointments';

interface AppointmentToolListProps {
  onSelectTool: (toolId: string) => void;
  selectedToolId: string | null;
}

export function AppointmentToolList({ onSelectTool, selectedToolId }: AppointmentToolListProps) {
  
  const { user } = useUser();
  const {  tools } = useAppointmentTools();



  return (
    <div className="space-y-2">
      {tools.map((tool) => (
        <div
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          className={`group relative p-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer ${
            selectedToolId === tool.id ? 'bg-gray-50 border-gray-300 shadow-sm' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedToolId === tool.id ? 'bg-primary/10' : 'bg-gray-100'
              }`}>
                <Icon name="calendar" className={`h-5 w-5 ${
                  selectedToolId === tool.id ? 'text-primary' : 'text-gray-600'
                }`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{tool.name}</h3>
              {tool.description && (
                <p className="text-sm text-gray-500 truncate">{tool.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {tools.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Icon name="calendar" className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No appointment tools found. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}
