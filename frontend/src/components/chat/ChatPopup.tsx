import { useRef, useEffect, useState } from 'react';
import { X, Send, ArrowLeft, Image, Video, Smile } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { apiUrl } from '../../utils/api';
import ProductContextBanner from './ProductContextBanner';
import ProductCardMessage from './ProductCardMessage';
import type { MessageItem } from '../../context/ChatContext';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

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
        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="max-w-[200px] block">
          <img
            src={msg.imageUrl}
            alt=""
            className="rounded-xl border border-gray-200 max-h-48 object-cover shadow-sm"
          />
        </a>
      </div>
    );
  }
  if (msg.type === 'video' && msg.videoUrl) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[240px] rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <video
            src={msg.videoUrl}
            controls
            className="w-full max-h-48 object-cover"
            preload="metadata"
          />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`max-w-[75%] px-4 py-1 rounded-2xl shadow-sm ${
        isOwn ? 'bg-orange-500 text-white ml-auto' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <p className="text-sm whitespace-pre-wrap break-words text-left ml-2">{msg.content}</p>
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
    isAdmin,
    conversations,
    activeConversationId,
    messages,
    hasMore,
    loadMoreMessages,
    productContext,
    setProductContext,
    selectConversation,
    sendMessage,
    sendImage,
    sendVideo,
  } = useChat();

  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const displayName = isAdmin
    ? activeConv?.customerId?.name || activeConv?.customerId?.email || 'Customer'
    : 'PHT-Admin';

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
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
      if (isAdmin) return;
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

  const handleSendImage = async (file: File) => {
    if (!activeConversationId || !token || uploading) return;
    setUploading(true);
    try {
      await sendImage(activeConversationId, file);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleSendVideo = async (file: File) => {
    if (!activeConversationId || !token || uploading) return;
    setUploading(true);
    try {
      await sendVideo(activeConversationId, file);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const closeEmoji = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      setTimeout(() => document.addEventListener('click', closeEmoji), 0);
      return () => document.removeEventListener('click', closeEmoji);
    }
  }, [showEmojiPicker]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div className="fixed bottom-20 right-6 w-[96%] max-w-md h-[540px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
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
          <h3 className="font-semibold text-gray-900 text-sm">
            {isAdmin ? (activeConversationId ? `Chat with ${displayName}` : 'Customer messages') : 'Chat with Admin'}
          </h3>
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
                  {isAdmin
                    ? 'No customer messages yet.'
                    : 'No conversation yet. Send a message below to start.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => {
                    const convDisplayName = isAdmin
                      ? (c.customerId?.name || c.customerId?.email || 'Customer')
                      : 'PHT-Admin';
                    const avatarLetter = isAdmin ? (c.customerId?.name?.[0] || c.customerId?.email?.[0] || 'C') : 'P';
                    return (
                    <button
                      key={c._id}
                      onClick={() => selectConversation(c._id)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                        {avatarLetter.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{convDisplayName}</p>
                        <p className="text-sm text-gray-600 truncate">{c.lastMessage?.content}</p>
                      </div>
                      {c.customerUnread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {c.customerUnread}
                        </span>
                      )}
                    </button>
                  );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Message list */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-gray-50/50">
              {hasMore && (
                <div ref={messagesTopRef} className="flex justify-center py-2">
                  <button
                    onClick={handleScrollTop}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    View older messages
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
                Login to send messages
              </a>
            </div>
          ) : isAdmin && !activeConversationId ? (
            <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm">
              Select a conversation to reply
            </div>
          ) : (
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    id="chat-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSendImage(file);
                      e.target.value = '';
                    }}
                  />
                  <input
                    id="chat-video-input"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSendVideo(file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('chat-image-input')?.click()}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Upload image"
                  >
                    <Image size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('chat-video-input')?.click()}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Upload video"
                  >
                    <Video size={20} />
                  </button>
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker((p) => !p);
                      }}
                      className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Stickers"
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div
                        className="absolute bottom-full left-0 mb-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiPicker
                          onEmojiClick={(emojiObject: EmojiClickData) => {
                            setInput((prev) => prev + emojiObject.emoji);
                          }}
                          width={320}
                          height={360}
                          theme="light"
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Enter message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 text-sm"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !uploading) || sending}
                  className="p-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

