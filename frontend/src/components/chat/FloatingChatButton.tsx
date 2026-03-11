import { MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function FloatingChatButton() {
  const { unreadTotal, setIsOpen } = useChat();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      aria-label="Open chat"
    >
      <MessageCircle size={24} />
      {unreadTotal > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadTotal > 99 ? '99+' : unreadTotal}
        </span>
      )}
    </button>
  );
}
