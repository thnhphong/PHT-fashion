import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { apiUrl, socketUrl } from '../utils/api';

export interface ConversationSummary {
  _id: string;
  lastMessage: { content: string; sentAt: string; senderId: string };
  customerUnread: number;
  updatedAt: string;
  customerId?: { _id: string; name?: string; email?: string };
}

export interface ProductCardData {
  productId: string;
  name: string;
  price: number;
  img_url: string;
  slug: string;
}

export interface MessageItem {
  _id: string;
  senderId: string;
  senderRole: 'customer' | 'admin';
  type: 'text' | 'image' | 'product_card' | 'video';
  content?: string;
  imageUrl?: string;
  imagePublicId?: string;
  videoUrl?: string;
  videoPublicId?: string;
  product?: ProductCardData;
  status: 'sent' | 'delivered';
  createdAt: string;
}

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isAdmin: boolean;
  unreadTotal: number;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: MessageItem[];
  hasMore: boolean;
  loadMoreMessages: () => Promise<void>;
  productContext: ProductCardData | null;
  setProductContext: (p: ProductCardData | null) => void;
  openChat: (productContext?: ProductCardData) => void;
  openChatFromProduct: (product: ProductCardData) => void;
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string | null) => void; 
  loadMessages: (conversationId: string, append?: boolean) => Promise<void>;
  sendMessage: (content: string, productCard?: ProductCardData) => Promise<void>;
  sendImage: (conversationId: string, file: File) => Promise<void>;
  sendVideo: (conversationId: string, file: File) => Promise<void>;
  markDelivered: (conversationId: string) => Promise<void>;
  socket: Socket | null;
  reconnectSocket: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const getToken = () => localStorage.getItem('accessToken');

const getIsAdmin = () => localStorage.getItem('userRole') === 'admin';

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [productContext, setProductContext] = useState<ProductCardData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const unreadTotal = conversations.reduce((s, c) => s + (c.customerUnread ?? 0), 0);

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const isAdmin = getIsAdmin();
    const path = isAdmin ? '/admin/chats' : '/chats';
    try {
      const res = await fetch(apiUrl(path), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = data.conversations ?? [];
      setConversations(
        isAdmin
          ? list.map((c: any) => ({
              _id: c._id,
              lastMessage: c.lastMessage,
              customerUnread: c.adminUnread ?? 0,
              updatedAt: c.updatedAt,
              customerId: c.customerId,
            }))
          : list
      );
    } catch (e) {
      console.error('Fetch conversations error:', e);
    }
  }, []);

  const openChat = useCallback((product?: ProductCardData) => {
    setProductContext(product ?? null);
    setIsOpen(true);
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, append = false) => {
      const token = getToken();
      if (!token) return;
      const isAdmin = getIsAdmin();
      const before = append ? nextCursor : undefined;
      const params = new URLSearchParams({ limit: '30' });
      if (before) params.set('before', before);
      const path = isAdmin
        ? `/admin/chats/${conversationId}/messages?${params}`
        : `/chats/${conversationId}/messages?${params}`;
      try {
        const res = await fetch(apiUrl(path), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.messages ?? []).map((m: any) => ({
          ...m,
          _id: m._id?.toString?.() ?? m._id,
          senderId: m.senderId?.toString?.() ?? m.senderId,
        }));
        setMessages((prev) => (append ? [...list, ...prev] : list));
        setHasMore(data.hasMore ?? false);
        setNextCursor(data.nextCursor ?? null);
      } catch (e) {
        console.error('Load messages error:', e);
      }
    },
    [nextCursor]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || !hasMore) return;
    await loadMessages(activeConversationId, true);
  }, [activeConversationId, hasMore, loadMessages]);

  const selectConversation = useCallback(
    async (id: string | null) => {
      setActiveConversationId((prev) => {
        if (socket && prev) {
          socket.emit('leave_conversation', { conversationId: prev });
        }
        return id;
      });
      if (!id) {
        setMessages([]);
        return;
      }
      setNextCursor(null);
      await loadMessages(id);
      const token = getToken();
      if (token) {
        try {
          await fetch(apiUrl(`/chats/${id}/delivered`), {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {}
        await fetchConversations();
      }
    },
    [loadMessages, fetchConversations, socket]
  );

  const openChatFromProduct = useCallback(
    async (product: ProductCardData) => {
      const token = getToken();
      setProductContext(product);
      setIsOpen(true);
      if (!token) return;
      try {
        const res = await fetch(apiUrl('/chats'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.productId }),
        });
        const data = await res.json();
        if (data.conversationId) {
          await selectConversation(data.conversationId);
        }
        await fetchConversations();
      } catch (e) {
        console.error('Open chat from product error:', e);
      }
    },
    [fetchConversations, selectConversation]
  );

  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit('join_conversation', { conversationId: activeConversationId });
      return () => {
        socket.emit('leave_conversation', { conversationId: activeConversationId });
      };
    }
  }, [socket, activeConversationId]);

  const sendMessage = useCallback(
    async (content: string, productCard?: ProductCardData) => {
      const token = getToken();
      const convId = activeConversationId;
      if (!token || !convId) return;
      const body: { content: string; productCard?: ProductCardData } = { content };
      if (productCard) body.productCard = productCard;
      try {
        const res = await fetch(apiUrl(`/chats/${convId}/messages`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? 'Failed to send');
        }
        const data = await res.json();
        const newMsgs = Array.isArray(data.messages) ? data.messages : [data];
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m._id));
          const added = newMsgs.filter((m) => !ids.has(m._id?.toString?.() ?? m._id));
          return [...prev, ...added];
        });
        setProductContext(null);
        await fetchConversations();
      } catch (e) {
        console.error('Send message error:', e);
        throw e;
      }
    },
    [activeConversationId, fetchConversations]
  );

  const sendImage = useCallback(
    async (conversationId: string, file: File) => {
      const token = getToken();
      if (!token) return;
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(apiUrl(`/chats/${conversationId}/messages/image`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to send image');
      }
      const data = await res.json();
      setMessages((prev) => {
        const id = data._id?.toString?.() ?? data._id;
        if (prev.some((m) => m._id === id)) return prev;
        return [...prev, { ...data, _id: id }];
      });
      await fetchConversations();
    },
    [fetchConversations]
  );

  const sendVideo = useCallback(
    async (conversationId: string, file: File) => {
      const token = getToken();
      if (!token) return;
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch(apiUrl(`/chats/${conversationId}/messages/video`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to send video');
      }
      const data = await res.json();
      setMessages((prev) => {
        const id = data._id?.toString?.() ?? data._id;
        if (prev.some((m) => m._id === id)) return prev;
        return [...prev, { ...data, _id: id }];
      });
      await fetchConversations();
    },
    [fetchConversations]
  );

  const markDelivered = useCallback(async (conversationId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(apiUrl(`/chats/${conversationId}/delivered`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchConversations();
    } catch {}
  }, [fetchConversations]);

  const markDeliveredRef = useRef(markDelivered);
  markDeliveredRef.current = markDelivered;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setSocket(null);
      return;
    }
    const s = io(socketUrl(), {
      auth: { token },
      transports: ['polling', 'websocket'],
    });
    setSocket(s);

    s.on('new_message', (payload: { message: MessageItem & { conversationId?: string } }) => {
      const { message } = payload ?? {};
      if (!message) return;
      const convId = activeConversationIdRef.current;
      setMessages((prev) => {
        if (prev.some((m) => m._id === (message._id?.toString?.() ?? message._id))) return prev;
        const m = { ...message, _id: message._id?.toString?.() ?? message._id };
        return [...prev, m];
      });
      const cid = message.conversationId?.toString?.() ?? message.conversationId;
      if (cid && convId === cid) markDeliveredRef.current(cid);
    });

    s.on('new_messages', (payload: { messages: (MessageItem & { conversationId?: string })[] }) => {
      const list = payload?.messages ?? [];
      const convId = activeConversationIdRef.current;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m._id));
        const added = list.filter((m) => !ids.has(m._id?.toString?.() ?? m._id));
        return [...prev, ...added];
      });
      const cid = list[0]?.conversationId?.toString?.() ?? list[0]?.conversationId;
      if (cid && convId === cid) markDeliveredRef.current(cid);
    });

    s.on('messages_delivered', (payload: { messageIds: string[] }) => {
      const ids = new Set(payload?.messageIds ?? []);
      setMessages((prev) =>
        prev.map((m) =>
          ids.has(m._id) ? { ...m, status: 'delivered' as const } : m
        )
      );
    });

    s.on('message_deleted', (payload: { messageId: string }) => {
      const { messageId } = payload ?? {};
      if (messageId) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    });

    return () => {
      s.disconnect();
    };
  }, [reconnectTrigger]);

  const reconnectSocket = useCallback(() => setReconnectTrigger((n) => n + 1), []);

  useEffect(() => {
    const onAuthChange = () => {
      if (getToken()) setReconnectTrigger((n) => n + 1);
    };
    window.addEventListener('storage', onAuthChange);
    window.addEventListener('auth-token-set', onAuthChange);
    return () => {
      window.removeEventListener('storage', onAuthChange);
      window.removeEventListener('auth-token-set', onAuthChange);
    };
  }, []);

  useEffect(() => {
    if (isOpen && getToken()) fetchConversations();
  }, [isOpen, fetchConversations]);

  const value: ChatContextType = {
    isOpen,
    setIsOpen,
    isAdmin: getIsAdmin(),
    unreadTotal,
    conversations,
    activeConversationId,
    messages,
    hasMore,
    loadMoreMessages,
    productContext,
    setProductContext,
    openChat,
    openChatFromProduct,
    fetchConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    sendImage,
    sendVideo,
    markDelivered,
    socket,
    reconnectSocket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
