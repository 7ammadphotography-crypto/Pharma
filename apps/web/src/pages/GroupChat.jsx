import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, HelpCircle, Search, Plus, X, AlertTriangle,
  Image as ImageIcon, Paperclip, Smile, AtSign, Bold, Italic, Code, Link2,
  Loader2, Mic, Images, UploadCloud, FileText
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ChatMessageItem from '../components/chat/ChatMessageItem';
import VoiceRecorder from '../components/chat/VoiceRecorder';
import MediaGallery from '../components/chat/MediaGallery';
import ChatSidebar from '../components/chat/ChatSidebar';
import UserProfileModal from '../components/chat/UserProfileModal';
import { toast } from 'sonner';
import moment from 'moment';

export default function GroupChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [questionOptions, setQuestionOptions] = useState(['', '', '', '']);
  const [replyingTo, setReplyingTo] = useState(null);
  const [filterQuestions, setFilterQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef(null);

  const emojis = [
    '👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💯', '🎉', '👏', '✅', '❌',
    '🥰', '😊', '😭', '🥺', '🤣', '🤔', '🫣', '🫡', '🤝', '🥳', '😎', '🤩',
    '🤖', '👾', '✨', '🌟', '💫', '💥', '💢', '💤', '👋', '🙌', '🫶', '💀',
    '💩', '🤡', '👻', '👽', '🦄', '🌹', '🌸', '💐', '🎀', '🎁', '🎈', '🎊'
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          setUser(currentUser);
        } else if (window.location.hostname === 'localhost') {
          // Dev Fallback
          setUser({
            id: '00000000-0000-0000-0000-000000000000', // Must be valid UUID
            email: 'dev@example.com',
            full_name: 'Developer',
            role: 'admin'
          });
        }
      } catch (error) {
        console.error("Auth error", error);
        if (window.location.hostname === 'localhost') {
          // Dev Fallback
          setUser({
            id: '00000000-0000-0000-0000-000000000000', // Must be valid UUID
            email: 'dev@example.com',
            full_name: 'Developer',
            role: 'admin'
          });
        }
      }
    };
    init();
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chatStats'],
    queryFn: async () => {
      // Use the working entity API instead of non-existent Core.ListRows
      const data = await base44.entities.ChatMessage.list();
      return data || [];
    },
    refetchInterval: 3000
  });

  // Typing indicators temporarily disabled to prevent Core dependency crash
  const typingIndicators = [];

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // Use the entity API
        const data = await base44.entities.User.list();
        return data || [];
      } catch (err) {
        console.warn("Failed to load users for mention:", err);
        return [];
      }
    }
  });

  const updateTypingMutation = useMutation({
    mutationFn: async () => {
      // Disabled typing indicators
      return Promise.resolve();
    }
  });

  const createMessageMutation = useMutation({
    mutationFn: async (newMessage) => {
      try {
        return await base44.entities.ChatMessage.create({
          ...newMessage,
          likes: 0,
          is_pinned: false
        });
      } catch (error) {
        console.error('Create message error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setMessage('');
      setUploadedFiles([]);
      setQuestionOptions(['', '', '', '']);
      setIsQuestion(false);
      setReplyingTo(null);
      queryClient.invalidateQueries(['chatStats']);
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => {
      toast.error('Failed to send message: ' + error.message);
    }
  });

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.ChatMessage.update(id, data);
    },
    onSuccess: () => {
      setEditingMessage(null);
      setMessage('');
      queryClient.invalidateQueries(['chatStats']);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingMutation.mutate();
    }, 1000);

    // Initial check for mention trigger
    const lastChar = newValue.slice(-1);
    if (lastChar === '@') {
      setShowMentionPicker(true);
      setMentionCursorPosition(e.target.selectionEnd);
      setMentionSearch('');
    } else if (showMentionPicker) {
      const search = newValue.slice(mentionCursorPosition);
      if (search.includes(' ')) {
        setShowMentionPicker(false);
      } else {
        setMentionSearch(search);
      }
    }
  };

  const insertMention = (userToMention) => {
    const beforeMention = message.slice(0, mentionCursorPosition - 1); // -1 for @
    // const afterMention = message.slice(textareaRef.current.selectionEnd);
    const mentionText = `@[${userToMention.full_name || userToMention.email}] `;

    setMessage(beforeMention + mentionText);
    setShowMentionPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const { file_url } = await base44.storage.upload({ file });
        if (file_url) {
          uploadedUrls.push(file_url);
        }
      }
      setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    const files = [];

    for (const item of items) {
      if (item.kind === 'file') {
        files.push(item.getAsFile());
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      setUploading(true);
      const uploadedUrls = [];
      try {
        for (const file of files) {
          const { file_url } = await base44.storage.upload({ file });
          if (file_url) uploadedUrls.push(file_url);
        }
        setUploadedFiles(prev => [...prev, ...uploadedUrls]);
        toast.success('Image pasted successfully');
      } catch (err) {
        console.error('Paste upload failed', err);
        toast.error('Failed to upload pasted image');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const { file_url } = await base44.storage.upload({ file });
        if (file_url) uploadedUrls.push(file_url);
      }
      setUploadedFiles(prev => [...prev, ...uploadedUrls]);
      toast.success('Files dropped successfully');
    } catch (err) {
      console.error('Drop upload failed', err);
      toast.error('Failed to upload dropped files');
    } finally {
      setUploading(false);
    }
  };

  const addOption = () => {
    if (questionOptions.length < 6) {
      setQuestionOptions([...questionOptions, '']);
    }
  };

  const removeOption = (index) => {
    const newOptions = questionOptions.filter((_, i) => i !== index);
    setQuestionOptions(newOptions);
  };

  const updateOption = (index, value) => {
    const newOptions = [...questionOptions];
    newOptions[index] = value;
    setQuestionOptions(newOptions);
  };

  const handleSendVoice = async (audioBlob, duration) => {
    if (!user) return;

    if (isBanned) {
      toast.error('You are banned from sending messages in this chat');
      return;
    }

    setUploading(true);
    try {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const { file_url } = await base44.storage.upload({ file });

      if (file_url) {
        const messageData = {
          content: `🎤 Voice message (${Math.floor(duration)}s)`,
          user_name: user.full_name || user.email,
          user_email: user.email,
          voice_url: file_url,
          voice_duration: duration,
          is_voice: true,
        };

        createMessageMutation.mutate(messageData);
        setShowVoiceRecorder(false);
        toast.success('Voice message sent');
      }
    } catch (error) {
      console.error('Error uploading voice:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    console.log('Attempting to send message...', {
      content: message,
      files: uploadedFiles.length,
      user: user?.email,
      isBanned
    });

    // Verify auth immediately before sending
    let currentUser;
    try {
      const { user: authUser } = await base44.auth.me().then(u => ({ user: u })).catch(() => ({ user: null }));
      if (!authUser) {
        // Fallback for dev/localhost if needed, or re-check local state but base44.auth.me is source of truth
        // If base44.auth.me() fails, try to use the one from state IF it's valid
        if (!user?.id) throw new Error("Not authenticated");
        currentUser = user;
      } else {
        currentUser = authUser;
      }
    } catch (e) {
      console.error("Auth check failed:", e);
      toast.error('You must be logged in to send messages');
      return;
    }

    if ((!message.trim() && uploadedFiles.length === 0)) {
      console.log('Send aborted: Empty message');
      return;
    }

    if (currentUser.is_banned) {
      toast.error('You are banned from sending messages in this chat');
      return;
    }

    if (editingMessage) {
      console.log('Updating existing message', editingMessage.id);
      updateMessageMutation.mutate({
        id: editingMessage.id,
        data: {
          content: message,
          is_edited: true
        }
      });
      return;
    }

    const newMessage = {
      content: message,
      user_id: currentUser.id, // Legacy compatibility
      user_name: currentUser.full_name || currentUser.email,
      user_email: currentUser.email,
      is_question: isQuestion,
      is_deleted: false,
      reply_to: replyingTo,
      attachments: uploadedFiles,
      ...(isQuestion && {
        options: questionOptions.filter(opt => opt.trim()),
        votes: {}
      })
    };

    console.log('Mutating createMessage with:', newMessage);
    createMessageMutation.mutate(newMessage);
  };

  const handleUserClick = (targetUserOrEmail) => {
    // If it's a full user object
    if (typeof targetUserOrEmail === 'object' && targetUserOrEmail.email) {
      setSelectedUser(targetUserOrEmail);
      return;
    }
    // If it's an email, find in allUsers
    const found = allUsers.find(u => u.email === targetUserOrEmail);
    if (found) {
      setSelectedUser(found);
    } else {
      // Fallback if user not in list (e.g. mock)
      setSelectedUser({ email: targetUserOrEmail, full_name: 'Unknown User' });
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    textareaRef.current?.focus();
  };

  const handleEdit = (msg) => {
    if (msg.user_email !== user?.email) return;
    setEditingMessage(msg);
    setMessage(msg.content);
    textareaRef.current?.focus();
    setIsQuestion(false);
  };

  const insertFormatting = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    let formattedText = '';

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        break;
      default:
        return;
    }

    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const isBanned = user?.is_banned;

  const visibleMessages = user?.role === 'admin'
    ? messages
    : messages.filter(msg => !msg.is_deleted);

  const pinnedMessages = visibleMessages.filter(msg => msg.is_pinned && !msg.is_deleted);
  const regularMessages = visibleMessages.filter(msg => !msg.is_pinned);

  const filteredMessages = regularMessages
    .filter(msg => filterQuestions ? msg.is_question : true)
    .filter(msg =>
      searchTerm ?
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )
    .reverse(); // Reverse for display (newest at bottom) but depends on implementation. Actually usually we map them in render 

  // Re-correcting: usually chat lists are oldest to newest. But here we might want reverse if we were using flex-col-reverse.
  // Standard implementation: oldest at top, newest at bottom.
  // If `messages` comes from API, assume unknown order. But let's assume standard array.
  // The .reverse() was in previous code? Let's check logic. 
  // API usually returns latest. If so, .reverse() puts oldest first. Let's keep it consistent with previous file.

  const questionsCount = messages.filter(m => m.is_question).length;
  const messagesCount = messages.length;

  const typingUsers = typingIndicators
    .filter(ind => ind.user_email !== user?.email)
    .map(ind => ind.user_name)
    .filter((value, index, self) => self.indexOf(value) === index) // Unique
    .slice(0, 3);

  const filteredMentionUsers = allUsers.filter(u =>
    u.email !== user?.email &&
    ((u.full_name && u.full_name.toLowerCase().includes(mentionSearch.toLowerCase())) ||
      u.email.toLowerCase().includes(mentionSearch.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1e] to-[#0a0a0f] text-white pb-24 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Modern Header with Glassmorphism */}
        <div className="sticky top-0 z-30 backdrop-blur-2xl bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 border-b border-white/5 shadow-2xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                {/* Animated Icon */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/40 transform group-hover:scale-105 transition-transform duration-300">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Group Chat
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                      {messagesCount} messages
                    </Badge>
                    <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300">
                      {questionsCount} polls
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Media Gallery Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMediaGallery(true)}
                  className="relative group h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 transition-all duration-300"
                  title="Media Gallery"
                >
                  <Images className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </Button>
                {/* Online Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 backdrop-blur-sm cursor-pointer hover:bg-emerald-500/20 transition-colors"
                  onClick={() => setShowSidebar(!showSidebar)}>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                    <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 tracking-wide">
                    {user ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modern Filters */}
            <div className="flex items-center gap-4 flex-wrap mt-4">
              {/* Polls Only Toggle */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl px-4 py-2.5 border border-amber-500/20 hover:border-amber-500/40 transition-all">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-100 font-medium">Polls Only</span>
                <Switch
                  checked={filterQuestions}
                  onCheckedChange={setFilterQuestions}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500"
                />
              </div>

              {/* Modern Search */}
              <div className="flex-1 relative group z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search messages, users..."
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900/60 border border-zinc-700/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-1 h-2 items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
                <span className="font-medium text-indigo-300">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : typingUsers.length === 2
                      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                      : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 h-[calc(100vh-180px)] mt-4">
          <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showSidebar ? 'mr-0' : ''} bg-zinc-900/20 rounded-3xl border border-white/5 overflow-hidden`}>
            {/* Messages Container */}
            <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto min-h-0 scroller-hide pb-32">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                    <div className="relative h-20 w-20">
                      <Loader2 className="h-20 w-20 text-indigo-400 animate-spin" />
                    </div>
                  </div>
                  <p className="text-slate-400 animate-pulse">Loading conversation...</p>
                </div>
              ) : (
                <>
                  {pinnedMessages.length > 0 && (
                    <div className="mb-8 bg-purple-900/10 border border-purple-500/20 rounded-2xl p-4 relative overflow-hidden group shrink-0">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-purple-300 transform rotate-12" />
                        </div>
                        <h3 className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Pinned Messages</h3>
                      </div>
                      <div className="space-y-3 pl-2">
                        {pinnedMessages.map((msg) => (
                          <ChatMessageItem
                            key={msg.id}
                            message={msg}
                            currentUser={user}
                            onReply={handleReply}
                            onEdit={handleEdit}
                            allMessages={messages}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32">
                      <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-6 border border-zinc-700 shadow-xl group-hover:scale-110 transition-transform duration-300">
                          <MessageSquare className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                      <h3 className="text-white text-xl font-bold mb-2">No messages found</h3>
                      <p className="text-slate-400 text-center max-w-sm">
                        {searchTerm || filterQuestions ? 'Try adjusting your search or filters' : 'Be the first to start the conversation!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 pb-20">
                      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date} className="space-y-4">
                          <div className="sticky top-0 z-10 flex justify-center py-2 pointer-events-none">
                            <span className="bg-zinc-800/80 backdrop-blur-md text-zinc-400 text-xs font-medium px-3 py-1 rounded-full border border-white/5 shadow-sm">
                              {moment(date).calendar(null, {
                                sameDay: '[Today]',
                                nextDay: '[Tomorrow]',
                                nextWeek: 'dddd',
                                lastDay: '[Yesterday]',
                                lastWeek: '[Last] dddd',
                                sameElse: 'MMMM Do, YYYY'
                              })}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            {dateMessages.map((msg, index) => {
                              const prevMsg = dateMessages[index - 1];
                              const nextMsg = dateMessages[index + 1];

                              const isSameUserAsPrev = prevMsg && prevMsg.user_email === msg.user_email && !prevMsg.is_question && !msg.is_question;
                              const isSameUserAsNext = nextMsg && nextMsg.user_email === msg.user_email && !nextMsg.is_question && !msg.is_question;

                              // Determine position in group: 'single', 'start', 'middle', 'end'
                              let position = 'single';
                              if (isSameUserAsPrev && isSameUserAsNext) position = 'middle';
                              else if (isSameUserAsPrev) position = 'end';
                              else if (isSameUserAsNext) position = 'start';

                              return (
                                <ChatMessageItem
                                  key={msg.id}
                                  message={msg}
                                  currentUser={user}
                                  onReply={handleReply}
                                  onEdit={handleEdit}
                                  allMessages={messages}
                                  groupPosition={position}
                                  showAvatar={!isSameUserAsNext || msg.is_question}
                                  showName={!isSameUserAsPrev || msg.is_question}
                                  onUserClick={handleUserClick}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <ChatSidebar
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            user={user}
            onUserClick={handleUserClick}
            onlineUsers={allUsers.map(u => u.full_name || u.email)}
            media={
              messages.flatMap(m => m.file_urls || []).reverse()
            }
          />
        </div>

        {/* Input Area */}
        <div className="fixed bottom-[85px] left-0 right-0 px-4 pb-2 pt-4 z-40 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent backdrop-blur-sm pointer-events-none">
          <div className="max-w-6xl mx-auto pointer-events-auto">
            {replyingTo && (
              <div className="mb-2 p-3 bg-zinc-900/90 border border-zinc-700 rounded-xl flex items-center justify-between backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-1 h-10 rounded-full bg-indigo-500"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-400 font-semibold mb-0.5">Replying to {replyingTo.user_name}</p>
                    <p className="text-sm text-slate-300 truncate">{replyingTo.content}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            )}
            {/* Simplified Input Container */}
            <div className="bg-[#0a0a0f] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative">
              {/* Gradient Border Glow */}
              <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none"></div>

              {/* Enhanced Attachment Preview */}
              {uploadedFiles.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-2 px-2 scrollbar-hide border-b border-white/5 bg-zinc-900/30">
                  {uploadedFiles.map((url, index) => (
                    <div key={index} className="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full hover:bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Input Area */}
            <div
              className={`flex items-end gap-2 p-3 bg-[#0a0a0f] transition-colors ${uploading ? 'bg-indigo-500/5' : ''}`}
              onPaste={handlePaste}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
            >
              {/* Drag Overlay */}
              {uploading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-b-3xl">
                  <div className="flex flex-col items-center animate-bounce">
                    <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
                    <p className="text-white font-semibold">Drop files to upload</p>
                  </div>
                </div>
              )}

              {/* Plus Actions */}
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1 bg-zinc-900 border-zinc-800" side="top" align="start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      <span>Photo or Video</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-orange-400" />
                      <span>File</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsQuestion(true);
                        setQuestionOptions(['', '', '', '']);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-green-400" />
                      <span>Poll</span>
                    </button>

                  </PopoverContent>
                </Popover>

                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 border-zinc-700 bg-zinc-900 rounded-xl overflow-hidden shadow-2xl" side="top" align="start">
                    <div className="p-2 grid grid-cols-8 gap-1 bg-zinc-900 max-h-60 overflow-y-auto">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="h-8 w-8 flex items-center justify-center text-lg hover:bg-white/10 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Text Input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isQuestion ? "Ask a question..." : "Message (Shift+Enter for new line)"}
                  className="min-h-[44px] max-h-[120px] bg-transparent border-0 text-white placeholder:text-slate-600 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2.5"
                  rows={1}
                />

                {/* Poll UI Overlay */}
                {isQuestion && (
                  <div className="absolute bottom-full left-0 w-full mb-4 p-4 bg-zinc-800/90 border border-zinc-700 rounded-xl backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        New Poll
                      </h3>
                      <Button size="sm" variant="ghost" onClick={() => setIsQuestion(false)} className="h-6 w-6 p-0 rounded-full hover:bg-white/10">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {questionOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          value={opt}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                      ))}
                      {questionOptions.length < 6 && (
                        <button onClick={addOption} className="text-xs text-amber-400 hover:underline flex items-center gap-1 mt-2">
                          <Plus className="w-3 h-3" /> Add Option
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mention List */}
                {showMentionPicker && filteredMentionUsers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    {filteredMentionUsers.map((u, i) => (
                      <button
                        key={i}
                        onClick={() => insertMention(u)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-black">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{u.full_name || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-1">
                {!message.trim() && !isQuestion && !uploadedFiles.length ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-10 w-10 rounded-full transition-all ${showVoiceRecorder ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={createMessageMutation.isPending}
                    className="h-10 w-10 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {createMessageMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Voice Recorder Overlay when Active */}
            {showVoiceRecorder && (
              <div className="p-4 bg-zinc-900 border-t border-white/5">
                <VoiceRecorder
                  onSend={handleSendVoice}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Gallery */}
      <MediaGallery
        messages={messages}
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
      />
      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        currentUser={user}
      />
    </div>
  );
}