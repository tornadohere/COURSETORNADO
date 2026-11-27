"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Hash,
  Lock,
  Send,
  Reply,
  Trash2,
  X,
  ShieldCheck,
  Loader2,
  MessageSquare,
  VolumeX,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ChatChannelRecord,
  ChatMessageRecord,
  MemberProfile,
} from "@/lib/supabase/types";

interface StudentCommunityViewProps {
  profile: MemberProfile;
  channels: ChatChannelRecord[];
  initialMessages: ChatMessageRecord[];
  initialChannelId: string;
}

function formatMessageTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * Renders message text with clean fenced code block support (```code```).
 */
function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="sd-msg-body">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part
            .slice(3, -3)
            .replace(/^[a-zA-Z0-9_-]+\n/, "");
          return (
            <pre key={idx} className="sd-msg-code" dir="ltr">
              <code>{inner}</code>
            </pre>
          );
        }
        return (
          <span key={idx} style={{ whiteSpace: "pre-wrap" }}>
            {part}
          </span>
        );
      })}
    </div>
  );
}

export function StudentCommunityView({
  profile,
  channels,
  initialMessages,
  initialChannelId,
}: StudentCommunityViewProps) {
  const [activeChannelId, setActiveChannelId] = useState(
    initialChannelId || channels[0]?.id || ""
  );
  const [messages, setMessages] =
    useState<ChatMessageRecord[]>(initialMessages);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const isInitialChannelLoad = useRef(true);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || channels[0] || null,
    [channels, activeChannelId]
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeChannelId]);

  // Fetch messages when switching channels
  useEffect(() => {
    if (!activeChannelId) return;
    if (isInitialChannelLoad.current && activeChannelId === initialChannelId) {
      isInitialChannelLoad.current = false;
      return;
    }

    let cancelled = false;
    setLoadingMsgs(true);
    setError(null);
    setReplyTo(null);

    fetch(`/api/dashboard/chat/messages?channelId=${activeChannelId}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ok && Array.isArray(data.messages)) {
          setMessages(data.messages as ChatMessageRecord[]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("تعذر تحميل رسائل القناة.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMsgs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeChannelId, initialChannelId]);

  // Subscribe to Supabase Realtime for live Discord-style updates
  useEffect(() => {
    if (!activeChannelId) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`room:${activeChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessageRecord;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        (payload) => {
          const removedId = (payload.old as { id?: string })?.id;
          if (removedId) {
            setMessages((prev) => prev.filter((m) => m.id !== removedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId]);

  const canPost =
    Boolean(activeChannel) &&
    (profile.role === "admin" ||
      (!activeChannel?.is_readonly && !profile.is_muted));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeChannel || !canPost || sending) return;

    setSending(true);
    setError(null);
    const content = draft.trim();
    const replyPayload = replyTo
      ? {
          reply_to_id: replyTo.id,
          reply_preview: `${replyTo.author_name}: ${replyTo.content.slice(0, 90)}`,
        }
      : { reply_to_id: null, reply_preview: "" };

    try {
      const res = await fetch("/api/dashboard/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: activeChannel.id,
          content,
          ...replyPayload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.message) {
        const created = data.message as ChatMessageRecord;
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        );
        setDraft("");
        setReplyTo(null);
      } else {
        setError(data?.error || "تعذر إرسال الرسالة.");
      }
    } catch {
      setError("تعذر إرسال الرسالة.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msg: ChatMessageRecord) => {
    try {
      const res = await fetch(`/api/dashboard/chat/messages/${msg.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="sd-discord-shell">
      {/* Channels List Sidebar (Discord Server Style) */}
      <aside className="sd-channels-rail">
        <div className="sd-channels-header">
          <span>سيرفر Tornado Academy</span>
          <span className="sd-dot-live" title="مباشر" />
        </div>

        <div className="sd-channels-group-label">القنوات النصية</div>
        <div className="sd-channels-list">
          {channels.map((ch) => {
            const active = ch.id === activeChannel?.id;
            return (
              <button
                key={ch.id}
                type="button"
                className={`sd-channel-btn${active ? " is-active" : ""}`}
                onClick={() => setActiveChannelId(ch.id)}
              >
                {ch.is_readonly ? (
                  <Lock size={14} className="sd-channel-icon" />
                ) : (
                  <Hash size={15} className="sd-channel-icon" />
                )}
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Active Channel Chat Area */}
      <section className="sd-chat-main">
        {activeChannel && (
          <header className="sd-chat-topbar">
            <div className="sd-chat-topbar-title">
              {activeChannel.is_readonly ? (
                <Lock size={16} />
              ) : (
                <Hash size={17} />
              )}
              <h2>{activeChannel.name}</h2>
            </div>
            {activeChannel.description && (
              <p className="sd-chat-topbar-desc">{activeChannel.description}</p>
            )}
          </header>
        )}

        <div className="sd-chat-feed">
          {loadingMsgs ? (
            <div className="sd-chat-empty">
              <Loader2 size={24} className="sd-spin" />
              <span>جاري تحميل الرسائل...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="sd-chat-empty">
              <MessageSquare size={28} />
              <p>
                مرحباً بك في قناة <strong>#{activeChannel?.name}</strong>! ابدأ
                أول رسالة هنا.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.user_id === profile.id;
              const isAdminMsg = msg.author_role === "admin";
              const canDelete = isMine || profile.role === "admin";
              const initial = (msg.author_name || "ع").slice(0, 1).toUpperCase();

              return (
                <div key={msg.id} className="sd-msg-row">
                  <div
                    className={`sd-msg-avatar${isAdminMsg ? " is-admin" : ""}`}
                  >
                    {initial}
                  </div>
                  <div className="sd-msg-content">
                    <div className="sd-msg-meta">
                      <span className="sd-msg-author">{msg.author_name}</span>
                      {isAdminMsg && (
                        <span className="sd-admin-tag">
                          <ShieldCheck size={11} />
                          <span>إدارة</span>
                        </span>
                      )}
                      <span className="sd-msg-time">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>

                    {msg.reply_preview && (
                      <div className="sd-msg-reply-quote">
                        <Reply size={12} />
                        <span>{msg.reply_preview}</span>
                      </div>
                    )}

                    <MessageContent text={msg.content} />
                  </div>

                  <div className="sd-msg-actions">
                    {canPost && (
                      <button
                        type="button"
                        className="sd-icon-btn"
                        title="رد على الرسالة"
                        onClick={() => setReplyTo(msg)}
                      >
                        <Reply size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="sd-icon-btn is-danger"
                        title="حذف الرسالة"
                        onClick={() => handleDeleteMessage(msg)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Composer */}
        <div className="sd-chat-composer-wrap">
          {error && <div className="sd-chat-err">{error}</div>}

          {replyTo && (
            <div className="sd-reply-bar">
              <span>
                الرد على <strong>{replyTo.author_name}</strong>:{" "}
                {replyTo.content.slice(0, 70)}
              </span>
              <button
                type="button"
                className="sd-icon-btn"
                onClick={() => setReplyTo(null)}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {!canPost ? (
            <div className="sd-chat-locked-bar">
              {profile.is_muted ? (
                <>
                  <VolumeX size={15} />
                  <span>تم كتم حسابك مؤقتاً من الكتابة في قنوات المجتمع.</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>هذه القناة مخصصة لإعلانات إدارة الأكاديمية فقط.</span>
                </>
              )}
            </div>
          ) : (
            <form className="sd-chat-composer" onSubmit={handleSend}>
              <textarea
                rows={1}
                className="sd-chat-input"
                placeholder={`اكتب رسالة في #${activeChannel?.name || ""} (استخدم \`\`\` للكود)...`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button
                type="submit"
                className="sd-chat-send-btn"
                disabled={sending || !draft.trim()}
                aria-label="إرسال الرسالة"
              >
                {sending ? (
                  <Loader2 size={16} className="sd-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
