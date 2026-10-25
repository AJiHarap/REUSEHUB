'use client';

import React, { useEffect, useState, useRef, use, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Package, Check, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Message, Conversation, UserProfile } from '@/types/database';

function ActiveConversationContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadChat() {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch conversation details
        const { data: convData } = await supabase
          .from('conversations')
          .select(`
            *,
            listings:listing_id (
              id,
              title,
              images,
              price,
              unit,
              is_available
            ),
            buyer:buyer_id (
              id,
              username,
              full_name,
              avatar_url
            ),
            seller:seller_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', conversationId)
          .single();

        setConversation(convData);

        // Fetch messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgData) {
          setMessages(msgData as Message[]);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    }

    loadChat();

    // Supabase Realtime Subscription for new messages in this conversation
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

      if (error) {
        console.error('Error sending message:', error);
        setInputText(content); // restore on error
      }
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  if (loading) {
    return (
      <div className="card-riso p-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
        <p className="font-mono text-sm font-bold text-[#1A1A1A]">Connecting to conversation...</p>
      </div>
    );
  }

  const otherUser = conversation?.buyer_id === user?.id ? conversation?.seller : conversation?.buyer;
  const listing = conversation?.listings;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-8">
      {/* Top Header Card */}
      <div className="card-riso p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/messages"
            className="p-1.5 rounded-full border border-[#1A1A1A] hover:bg-[#F4ED36] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" />
          </Link>

          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt="user"
              className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#F4ED36] border-2 border-[#1A1A1A] flex items-center justify-center font-['Archivo_Black',sans-serif] text-sm text-[#1A1A1A]">
              {(otherUser?.username || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="font-['Archivo_Black',sans-serif] text-base text-[#1A1A1A] truncate">
              {otherUser?.full_name || otherUser?.username || 'User'}
            </h2>
            <p className="font-mono text-[11px] text-[#61609A] truncate">
              @{otherUser?.username || 'user'}
            </p>
          </div>
        </div>

        {/* Linked listing widget */}
        {listing && (
          <Link
            href={`/listings/${listing.id}`}
            className="hidden sm:flex items-center gap-2 bg-[#61609A]/15 border border-[#1A1A1A] p-2 rounded-[6px] max-w-[220px] hover:bg-[#F9CC73]/40 transition-colors"
          >
            {listing.images?.[0] && (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-8 h-8 rounded-[4px] border border-[#1A1A1A] object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold text-[#1A1A1A] truncate">{listing.title}</p>
              <p className="font-['Archivo_Black',sans-serif] text-xs text-[#C94245]">${listing.price}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="card-riso p-4 h-[55vh] min-h-[380px] overflow-y-auto space-y-3 flex flex-col">
        {messages.length === 0 ? (
          <div className="m-auto text-center font-mono text-xs text-[#61609A]">
            No messages yet. Say hello and introduce your project requirements!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[78%] sm:max-w-[70%] ${
                  isMe ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-[8px] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-sans text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#F4ED36] text-[#1A1A1A]'
                      : 'bg-[#F9F5F2] text-[#1A1A1A]'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <span className="font-mono text-[10px] text-[#61609A] mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send message form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="input-riso flex-1 text-sm font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="btn-pill btn-pill-yellow text-xs font-bold px-5 flex items-center justify-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

export default function ActiveConversationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="card-riso p-16 text-center font-mono text-sm text-[#1A1A1A]">
          Connecting to conversation...
        </div>
      }
    >
      <ActiveConversationContent params={params} />
    </Suspense>
  );
}
