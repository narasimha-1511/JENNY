interface AiAssistantProps {
  selectedBotId: string | null;
  onSelectBot: (botId: string) => void;
  showCreateForm: boolean;
  onShowCreateForm: (show: boolean) => void;
}

export function AiAssistant({
  selectedBotId,
  onSelectBot,
  showCreateForm,
  onShowCreateForm,
}: AiAssistantProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">AI Assistant</h2>
      {/* Add your AI Assistant implementation here */}
      <div className="text-gray-500">
        AI Assistant functionality coming soon...
      </div>
    </div>
  );
}
