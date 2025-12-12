import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Trash2, Pin, PinOff, Search, RefreshCw, 
  HelpCircle, ThumbsUp, CheckCircle2, User, Calendar, AlertTriangle,
  Ban, UserX, ShieldAlert 
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminChatManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, questions, deleted, pinned
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banIsPermanent, setBanIsPermanent] = useState(true);
  const [banDuration, setBanDuration] = useState(24); // hours
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-chat-messages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 500),
  });

  const { data: chatBans = [] } = useQuery({
    queryKey: ['chat-bans'],
    queryFn: () => base44.entities.ChatBan.filter({ is_active: true }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId) => {
      const message = messages.find(m => m.id === messageId);
      return base44.entities.ChatMessage.update(messageId, {
        is_deleted: true,
        deleted_by: (await base44.auth.me()).email,
        deleted_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chat-messages']);
      queryClient.invalidateQueries(['chat-messages']);
      toast.success('Message deleted successfully');
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete message');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (messageId) => {
      return base44.entities.ChatMessage.update(messageId, {
        is_deleted: false,
        deleted_by: null,
        deleted_date: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chat-messages']);
      queryClient.invalidateQueries(['chat-messages']);
      toast.success('Message restored successfully');
    }
  });

  const pinMutation = useMutation({
    mutationFn: async ({ messageId, isPinned }) => {
      return base44.entities.ChatMessage.update(messageId, {
        is_pinned: isPinned,
        pinned_by: isPinned ? (await base44.auth.me()).email : null
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['admin-chat-messages']);
      queryClient.invalidateQueries(['chat-messages']);
      toast.success(variables.isPinned ? 'Message pinned' : 'Message unpinned');
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userEmail, userName, reason, isPermanent, durationHours }) => {
      const expiresAt = isPermanent ? null : new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
      return base44.entities.ChatBan.create({
        banned_user_email: userEmail,
        banned_user_name: userName,
        banned_by: (await base44.auth.me()).email,
        reason: reason || 'No reason provided',
        is_active: true,
        expires_at: expiresAt
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-bans']);
      queryClient.invalidateQueries(['user-chat-bans']);
      toast.success('User banned from chat');
      setBanDialogOpen(false);
      setUserToBan(null);
      setBanReason('');
      setBanIsPermanent(true);
      setBanDuration(24);
    },
    onError: () => {
      toast.error('Failed to ban user');
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: (banId) => {
      return base44.entities.ChatBan.update(banId, {
        is_active: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-bans']);
      queryClient.invalidateQueries(['user-chat-bans']);
      toast.success('User unbanned');
    }
  });

  const handleDelete = (message) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate(messageToDelete.id);
    }
  };

  const handleBanUser = (message) => {
    setUserToBan({
      email: message.user_email,
      name: message.user_name
    });
    setBanDialogOpen(true);
  };

  const confirmBan = () => {
    if (userToBan) {
      banUserMutation.mutate({
        userEmail: userToBan.email,
        userName: userToBan.name,
        reason: banReason,
        isPermanent: banIsPermanent,
        durationHours: banDuration
      });
    }
  };

  const isUserBanned = (userEmail) => {
    return chatBans.some(ban => ban.banned_user_email === userEmail);
  };

  const filteredMessages = messages
    .filter(msg => {
      if (filterType === 'questions') return msg.is_question;
      if (filterType === 'deleted') return msg.is_deleted;
      if (filterType === 'pinned') return msg.is_pinned;
      return true;
    })
    .filter(msg => 
      searchTerm ? 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
    );

  const stats = {
    total: messages.length,
    questions: messages.filter(m => m.is_question).length,
    deleted: messages.filter(m => m.is_deleted).length,
    pinned: messages.filter(m => m.is_pinned).length,
    activeUsers: [...new Set(messages.map(m => m.user_email))].length,
    bannedUsers: chatBans.length
  };

  return (
    <AdminLayout currentPage="AdminChatManagement">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Chat Management</h1>
            <p className="text-slate-400">Moderate and manage group chat messages</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="text-white border-white/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Banned Users List */}
        {chatBans.length > 0 && (
          <Card className="glass-card border-0 p-4 bg-red-900/10 border-red-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">Banned Users ({chatBans.length})</h3>
              </div>
            </div>
            <div className="space-y-2">
              {chatBans.map((ban) => (
                <div key={ban.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{ban.banned_user_name}</p>
                    <p className="text-xs text-slate-400">{ban.banned_user_email}</p>
                    {ban.reason && (
                      <p className="text-xs text-red-400 mt-1">Reason: {ban.reason}</p>
                    )}
                    {ban.expires_at ? (
                      <p className="text-xs text-slate-500 mt-1">
                        Expires: {moment(ban.expires_at).format('MMM D, YYYY h:mm A')}
                      </p>
                    ) : (
                      <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-xs mt-1">
                        Permanent
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => unbanUserMutation.mutate(ban.id)}
                    disabled={unbanUserMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Unban
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="glass-card border-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Messages</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.questions}</p>
                <p className="text-xs text-slate-400">Questions</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.deleted}</p>
                <p className="text-xs text-slate-400">Deleted</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Pin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pinned}</p>
                <p className="text-xs text-slate-400">Pinned</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                <User className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                <p className="text-xs text-slate-400">Active Users</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border-0 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                <Ban className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.bannedUsers}</p>
                <p className="text-xs text-slate-400">Banned Users</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card border-0 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages, users..."
                className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-indigo-600' : 'text-white border-white/20'}
              >
                All
              </Button>
              <Button
                variant={filterType === 'questions' ? 'default' : 'outline'}
                onClick={() => setFilterType('questions')}
                className={filterType === 'questions' ? 'bg-amber-600' : 'text-white border-white/20'}
              >
                Questions
              </Button>
              <Button
                variant={filterType === 'deleted' ? 'default' : 'outline'}
                onClick={() => setFilterType('deleted')}
                className={filterType === 'deleted' ? 'bg-red-600' : 'text-white border-white/20'}
              >
                Deleted
              </Button>
              <Button
                variant={filterType === 'pinned' ? 'default' : 'outline'}
                onClick={() => setFilterType('pinned')}
                className={filterType === 'pinned' ? 'bg-purple-600' : 'text-white border-white/20'}
              >
                Pinned
              </Button>
            </div>
          </div>
        </Card>

        {/* Messages List */}
        <Card className="glass-card border-0 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <MessageSquare className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400">No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-xl border transition-all ${
                    message.is_deleted 
                      ? 'border-red-500/30 bg-red-900/10 opacity-60' 
                      : message.is_pinned
                      ? 'border-purple-500/30 bg-purple-900/10'
                      : message.is_question
                      ? 'border-amber-500/30 bg-amber-900/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-white">{message.user_name}</span>
                          <span className="text-xs text-slate-500">{message.user_email}</span>
                        </div>

                        {message.is_question && (
                          <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30">
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Poll
                          </Badge>
                        )}

                        {message.is_pinned && (
                          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}

                        {message.is_deleted && (
                          <Badge className="bg-red-600/20 text-red-400 border-red-500/30">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Deleted
                          </Badge>
                        )}
                      </div>

                      <p className="text-white mb-2 leading-relaxed">{message.content}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {moment(message.created_date).format('MMM D, YYYY h:mm A')}
                        </div>
                        {!message.is_question && (
                          <>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {message.upvotes?.length || 0} upvotes
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {message.marked_as_correct_by?.length || 0} correct marks
                            </div>
                          </>
                        )}
                        {message.is_question && (
                          <div className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            {message.question_options?.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0) || 0} votes
                          </div>
                        )}
                      </div>

                      {message.is_deleted && message.deleted_by && (
                        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Deleted by {message.deleted_by} on {moment(message.deleted_date).format('MMM D, YYYY h:mm A')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {message.is_deleted ? (
                        <Button
                          size="sm"
                          onClick={() => restoreMutation.mutate(message.id)}
                          disabled={restoreMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pinMutation.mutate({ messageId: message.id, isPinned: !message.is_pinned })}
                            disabled={pinMutation.isPending}
                            className={message.is_pinned ? 'text-purple-400 border-purple-500/30' : 'text-white border-white/20'}
                          >
                            {message.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(message)}
                            className="text-red-400 border-red-500/30 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {!isUserBanned(message.user_email) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBanUser(message)}
                              className="text-orange-400 border-orange-500/30 hover:bg-orange-400/10"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Question Options Preview */}
                  {message.is_question && message.question_options?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.question_options.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-amber-400">{String.fromCharCode(65 + index)}</span>
                          </div>
                          <span className="text-sm text-white flex-1">{option.text}</span>
                          <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-xs">
                            {option.voters?.length || 0} votes
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will hide the message from users. You can restore it later from the deleted messages view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white border-white/20">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-400" />
              Ban User from Chat
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {userToBan && (
                <>
                  Ban <span className="font-semibold text-white">{userToBan.name}</span> ({userToBan.email}) from sending messages in the group chat.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ban-reason" className="text-white">Reason for Ban</Label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter the reason for banning this user..."
                className="mt-2 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div>
                <Label htmlFor="permanent-ban" className="text-white font-medium">Permanent Ban</Label>
                <p className="text-xs text-slate-400">Ban will never expire</p>
              </div>
              <Switch
                id="permanent-ban"
                checked={banIsPermanent}
                onCheckedChange={setBanIsPermanent}
              />
            </div>

            {!banIsPermanent && (
              <div>
                <Label htmlFor="ban-duration" className="text-white">Ban Duration (hours)</Label>
                <Input
                  id="ban-duration"
                  type="number"
                  min="1"
                  value={banDuration}
                  onChange={(e) => setBanDuration(parseInt(e.target.value) || 1)}
                  className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Ban will expire on {moment().add(banDuration, 'hours').format('MMM D, YYYY h:mm A')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              className="text-white border-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBan}
              disabled={banUserMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {banUserMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}