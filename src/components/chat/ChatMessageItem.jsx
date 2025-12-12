import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ThumbsUp, ThumbsDown, CheckCircle2, Reply, HelpCircle, CornerDownRight,
  Check, Trash2, Pin, PinOff, Shield, Smile, MoreHorizontal, Edit2, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import VoicePlayer from './VoicePlayer';

export default function ChatMessageItem({ message, currentUser, onReply, onEdit, allMessages, groupPosition = 'single', showAvatar = true, showName = true, onUserClick }) {
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isMyMessage = currentUser?.email === message.user_email;
  // ... (keep logic up to return)

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (onUserClick && message.user_email) {
      onUserClick(message.user_email);
    }
  };

  // ... (keep mutations and helper functions unchanged)

  return (
    <div className={`flex w-full ${isMyMessage ? 'justify-end' : 'justify-start'} group/message`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMyMessage ? 'flex-row' : 'flex-row'}`}>
        {/* Avatar (Only for others, and only at end of group) */}
        {!isMyMessage && (
          <div className={`w-8 flex-shrink-0 flex flex-col justify-end ${!showAvatar ? 'invisible' : ''}`}>
            {showAvatar ? (
              <div
                onClick={handleUserClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold leading-none select-none cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all
                bg-gradient-to-br from-slate-700 to-slate-600 text-white shadow-sm ring-1 ring-white/10`}
              >
                {message.user_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : <div className="w-8 h-8" />}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2 shadow-sm transition-all
            ${getBorderRadius()}
            ${isMyMessage
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border border-indigo-500/50'
              : 'bg-zinc-800/80 text-white border border-white/5 hover:bg-zinc-800'
            }
            ${message.is_pinned ? 'ring-2 ring-purple-500/30' : ''}
          `}
        >
          {/* Reply Context */}
          {parentMessage && (
            <div className={`mb-2 p-1.5 rounded-lg text-xs border-l-2 cursor-pointer
              ${isMyMessage ? 'bg-indigo-800/50 border-white/30' : 'bg-zinc-900/50 border-indigo-500'}
            `}
              onClick={() => {
                const el = document.getElementById(`message-${parentMessage.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}>
              <p className={`font-semibold opacity-75 ${isMyMessage ? 'text-indigo-200' : 'text-indigo-400'}`}>
                {parentMessage.user_name}
              </p>
              <p className="opacity-70 line-clamp-1">{parentMessage.content}</p>
            </div>
          )}

          {/* Name Header (Only for others, first in group) */}
          {!isMyMessage && showName && (
            <div className="flex items-center gap-2 mb-1">
              <span
                onClick={handleUserClick}
                className={`text-xs font-bold cursor-pointer hover:underline ${['from-pink-500 to-rose-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-500']
                [message.user_name?.length % 5]
                  } bg-gradient-to-r bg-clip-text text-transparent`}>
                {message.user_name}
              </span>
              {isAdmin && <Shield className="w-3 h-3 text-indigo-400" />}
            </div>
          )}

          {/* Content */}
          <div className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${message.is_deleted ? 'italic opacity-60' : ''}`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold opacity-90">{children}</strong>,
                em: ({ children }) => <em className="italic opacity-80">{children}</em>,
                code: ({ children }) => <code className={`px-1 rounded text-sm font-mono ${isMyMessage ? 'bg-indigo-900/50 text-indigo-100' : 'bg-zinc-900/50 text-pink-400'}`}>{children}</code>,
                a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 hover:decoration-white transition-colors">{children}</a>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Attachments / Link Previews / Polls */}
          <div className="space-y-2 mt-2">
            {/* Voice Message */}
            {message.is_voice && message.voice_url && (
              <VoicePlayer
                audioUrl={message.voice_url}
                duration={message.voice_duration || 0}
                waveformData={message.waveform_data}
                theme={isMyMessage ? 'light' : 'dark'}
              />
            )}

            {/* Images/Files */}
            {message.file_urls?.length > 0 && (
              <div className={`grid gap-1 ${message.file_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {message.file_urls.map((url, i) => (
                  <div key={i} className="relative group/image overflow-hidden rounded-lg">
                    {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={url} alt="att" className="w-full h-auto object-cover max-h-60" />
                    ) : (
                      <div className="p-3 bg-white/10 backdrop-blur-sm flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 opacity-70" />
                        <span className="text-xs truncate opacity-70">Attachment</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Polls */}
            {message.is_question && message.question_options?.length > 0 && (
              <div className={`mt-2 p-3 rounded-xl ${isMyMessage ? 'bg-indigo-800/40' : 'bg-black/20'}`}>
                <p className="text-xs font-semibold opacity-75 mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Poll
                </p>
                <div className="space-y-1.5">
                  {message.question_options.map((opt, idx) => {
                    const voteCount = opt.voters?.length || 0;
                    const percentage = totalOptionVotes > 0 ? Math.round((voteCount / totalOptionVotes) * 100) : 0;
                    const hasVoted = opt.voters?.includes(currentUser?.email);
                    return (
                      <div key={idx}
                        onClick={() => !isMyMessage && handleVoteOnOption(opt.id)}
                        className={`relative h-9 rounded-lg overflow-hidden border border-white/10 cursor-pointer transition-all ${isMyMessage ? 'cursor-default' : 'hover:border-white/30'}`}
                      >
                        <div className={`absolute inset-0 transition-all ${hasVoted ? 'bg-white/20' : 'bg-white/5'
                          }`} style={{ width: `${percentage}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                          <span className="font-medium truncate z-10">{opt.text}</span>
                          <span className="opacity-70 z-10">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Footer (Time, Status, Reactions) */}
          <div className="flex items-center justify-end gap-1 mt-1 select-none">
            {message.is_edited && <span className="text-[10px] opacity-60">edited</span>}
            <span className="text-[10px] opacity-60 lowercase">
              {moment(message.created_date).format('h:mm a')}
            </span>
            {isMyMessage && (
              <span className={`ml-0.5 ${hasBeenRead ? 'text-indigo-200' : 'opacity-60'}`} title={readCount > 0 ? `Read by ${readCount}` : 'Sent'}>
                {hasBeenRead ? <CheckCircle2 className="w-3 h-3" /> : <Check className="w-3 h-3" />}
              </span>
            )}
          </div>

          {/* Reactions Re-implemented */}
          <div className="absolute -bottom-2 right-0 translate-y-full flex flex-wrap justify-end gap-1 px-2 z-10 w-full">
            {message.reactions?.map((reaction, i) => (
              <button
                key={i}
                onClick={() => handleReaction(reaction.emoji)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm transform hover:scale-110 transition-all 
                    ${hasReacted(reaction.emoji)
                    ? 'bg-indigo-500 text-white ring-1 ring-indigo-400'
                    : 'bg-zinc-800 text-slate-300 ring-1 ring-zinc-700'
                  }`}
              >
                <span>{reaction.emoji}</span>
                <span className="font-semibold">{reaction.user_emails.length}</span>
              </button>
            ))}
          </div>

          {/* Hover Actions (Inline) */}
          <div className="absolute top-0 right-0 -translate-y-1/2 opacity-0 group-hover/message:opacity-100 transition-opacity flex items-center gap-1 bg-zinc-800 rounded-full border border-zinc-700 shadow-xl px-2 py-1 transform translate-x-1/4">
            <button onClick={() => onReply(message)} className="p-1 hover:text-indigo-400 text-slate-400 transition-colors" title="Reply">
              <Reply className="w-4 h-4" />
            </button>
            <Popover open={showReactions} onOpenChange={setShowReactions}>
              <PopoverTrigger asChild>
                <button className="p-1 hover:text-amber-400 text-slate-400 transition-colors" title="React">
                  <Smile className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-zinc-900 border-zinc-700" side="top">
                <div className="grid grid-cols-4 gap-2">
                  {commonEmojis.map((emoji, i) => (
                    <button key={i} onClick={() => handleReaction(emoji)} className="text-xl hover:bg-white/10 rounded p-1">
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {(isMyMessage || isAdmin) && (
              <>
                {isMyMessage && onEdit && (
                  <button onClick={() => onEdit(message)} className="p-1 hover:text-blue-400 text-slate-400 transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => deleteMessageMutation.mutate(message.id)} className="p-1 hover:text-red-400 text-slate-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}