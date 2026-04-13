import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface RideChatProps {
  rideId: string;
  userId: string;
  otherName: string;
  inline?: boolean;
}

export default function RideChat({ rideId, userId, otherName, inline = false }: RideChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rideId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages(data as unknown as Message[]);
        setUnread((data as any[]).filter(m => m.sender_id !== userId && !m.is_read).length);
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${rideId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ride_id=eq.${rideId}`,
      }, (payload) => {
        const msg = payload.new as unknown as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_id !== userId && !open) {
          setUnread(prev => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rideId, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    await supabase.from('messages').insert({
      ride_id: rideId,
      sender_id: userId,
      content,
    } as any);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Inline toggle button for use inside a card
  const toggleButton = (
    <button
      onClick={() => setOpen(!open)}
      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
    >
      {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
      {open ? 'Close Chat' : 'Chat'}
      {unread > 0 && !open && (
        <span className="w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );

  const chatPanel = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden rounded-xl border bg-card mt-2"
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b bg-primary/5">
            <p className="font-semibold text-foreground text-sm">{otherName}</p>
            <p className="text-xs text-muted-foreground">In-ride chat</p>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="overflow-y-auto p-3 space-y-2" style={{ minHeight: 150, maxHeight: 250 }}>
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No messages yet. Say hi! 👋</p>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-foreground rounded-bl-md'
                  }`}>
                    {msg.content}
                    <p className={`text-[10px] mt-0.5 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              className="text-sm"
            />
            <Button size="icon" onClick={sendMessage} disabled={!text.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div>
      {toggleButton}
      {chatPanel}
    </div>
  );
}
