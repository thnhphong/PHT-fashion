import { useRef, useEffect, useState } from 'react';
import { X, Send, ArrowLeft } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { apiUrl } from '../../utils/api';
import ProductContextBanner from './ProductContextBanner';
import ProductCardMessage from './ProductCardMessage';
import type { MessageItem } from '../../context/ChatContext';

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

function MessageBubble({ msg, isOwn }: { msg: MessageItem; isOwn: boolean }) {
  if (msg.type === 'product_card' && msg.product) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <ProductCardMessage product={msg.product} />
      </div>
    );
  }
  if (msg.type === 'image' && msg.imageUrl) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="max-w-[200px]">
          <img
            src={msg.imageUrl}
            alt=""
            className="rounded-lg border border-gray-200 max-h-48 object-cover"
          />
        </a>
      </div>
    );
  }
  return (
    <div
      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
        isOwn ? 'bg-orange-500 text-white ml-auto' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <span className="text-xs opacity-80">{formatTime(msg.createdAt)}</span>
        {isOwn && <span className="text-xs">{msg.status === 'delivered' ? '✓✓' : '✓'}</span>}
      </div>
    </div>
  );
}

export default function ChatPopup() {
  const {
    isOpen,
    setIsOpen,
    conversations,
    activeConversationId,
    messages,
    hasMore,
    loadMoreMessages,
    productContext,
    setProductContext,
    selectConversation,
    sendMessage,
  } = useChat();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('accessToken');
  const userId = token
    ? (() => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.sub;
        } catch {
          return null;
        }
      })()
    : null;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (activeConversationId && messages.length) scrollToBottom();
  }, [messages, activeConversationId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!token) return;

    if (!activeConversationId) {
      try {
        const res = await fetch(apiUrl('/chats'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: productContext?.productId }),
        });
        const data = await res.json();
        if (data.conversationId) {
          await selectConversation(data.conversationId);
          setSending(true);
          try {
            await sendMessage(text, productContext ?? undefined);
          } finally {
            setSending(false);
          }
          setInput('');
          setProductContext(null);
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }

    setSending(true);
    try {
      await sendMessage(text, productContext ?? undefined);
      setInput('');
      setProductContext(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleScrollTop = () => {
    if (hasMore) loadMoreMessages();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div className="fixed bottom-20 right-6 w-[96%] max-w-md h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-50">
          {activeConversationId ? (
            <button
              onClick={() => selectConversation(null)}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div />
          )}
          <h3 className="font-semibold text-gray-900">Chat với Admin</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product context banner */}
        {productContext && (
          <ProductContextBanner product={productContext} onDismiss={() => setProductContext(null)} />
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {!activeConversationId ? (
            /* Conversation list */
            <div className="flex-1 overflow-y-auto p-4">
              {conversations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Chưa có cuộc hội thoại. Gửi tin nhắn bên dưới để bắt đầu.
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => selectConversation(c._id)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">Admin</p>
                        <p className="text-sm text-gray-600 truncate">{c.lastMessage?.content}</p>
                      </div>
                      {c.customerUnread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {c.customerUnread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Message list */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
              {hasMore && (
                <div ref={messagesTopRef} className="flex justify-center py-2">
                  <button
                    onClick={handleScrollTop}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Xem thêm tin nhắn cũ
                  </button>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.senderId === userId;
                return <MessageBubble key={msg._id} msg={msg} isOwn={isOwn} />;
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {!token ? (
            <div className="p-4 border-t bg-gray-50 text-center">
              <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Đăng nhập để gửi tin nhắn
              </a>
            </div>
          ) : (
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

