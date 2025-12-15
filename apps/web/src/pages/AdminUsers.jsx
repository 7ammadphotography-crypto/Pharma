import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Shield, User, Trophy, Crown, CheckCircle, XCircle, Settings, UserCog, Users, TrendingUp, Edit, AlertTriangle, Ban } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import AdminLayout from '@/components/admin/AdminLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import UserEditDialog from '@/components/admin/UserEditDialog';

const ROLES = [
  { value: 'user', label: 'Student', icon: User, color: 'text-slate-400 border-slate-700' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'text-purple-300 bg-purple-500/20 border-purple-500/20' },
  { value: 'content_manager', label: 'Content Manager', icon: UserCog, color: 'text-blue-300 bg-blue-500/20 border-blue-500/20' },
];

const SUBSCRIPTION_OPTIONS = [
  { value: 'none', label: 'Free', color: 'text-slate-400' },
  { value: 'active', label: 'Premium', color: 'text-green-400' },
  { value: 'canceled', label: 'Canceled', color: 'text-red-400' },
];

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['all-attempts-users'],
    queryFn: () => base44.entities.QuizAttempt.list()
  });

  const { data: points = [] } = useQuery({
    queryKey: ['all-points'],
    queryFn: () => base44.entities.UserPoints.list()
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowUserDialog(false);
      setSelectedUser(null);
    }
  });

  const getUserStats = (userId) => {
    const userAttempts = attempts.filter(a => a.user_id === userId);
    const userPoints = points.find(p => p.user_id === userId);
    const completed = userAttempts.filter(a => a.is_completed);

    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, a) => sum + (a.percentage || 0), 0) / completed.length)
      : 0;

    return {
      attempts: completed.length,
      avgScore,
      points: userPoints?.total_points || 0,
      level: userPoints?.level || 1
    };
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSubscription = filterSubscription === 'all' ||
      (filterSubscription === 'active' && u.subscription_status === 'active') ||
      (filterSubscription === 'free' && (!u.subscription_status || u.subscription_status === 'none'));
    return matchesSearch && matchesRole && matchesSubscription;
  });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleUpdateUser = (field, value) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: { [field]: value }
    });
  };

  // Stats
  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.subscription_status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const activeToday = users.filter(u => {
    const lastActivity = attempts.find(a => a.user_id === u.id);
    if (!lastActivity) return false;
    const today = new Date().toDateString();
    return new Date(lastActivity.created_at).toDateString() === today;
  }).length;

  return (
    <AdminLayout currentPage="AdminUsers">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm">Manage users, roles, and subscriptions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                  <p className="text-slate-400 text-xs">Total Users</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{premiumUsers}</p>
                  <p className="text-slate-400 text-xs">Premium Users</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{adminUsers}</p>
                  <p className="text-slate-400 text-xs">Admins</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeToday}</p>
                  <p className="text-slate-400 text-xs">Active Today</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 pl-10"
            />
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Students</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="content_manager">Content Managers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSubscription} onValueChange={setFilterSubscription}>
            <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="Subscription" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="active">Premium</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card className="glass-card border-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Subscription</TableHead>
                <TableHead className="text-slate-300">Performance</TableHead>
                <TableHead className="text-slate-300">Points</TableHead>
                <TableHead className="text-slate-300">Joined</TableHead>
                <TableHead className="text-slate-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-red-400">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="w-8 h-8 opacity-50" />
                      <p className="font-medium">Access Denied</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Database policies (RLS) are blocking your access. Run the provided SQL script in Supabase to fix this.
                      </p>
                      <p className="text-xs font-mono text-zinc-600 mt-2">{error?.message}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(u => {
                  const stats = getUserStats(u.id);
                  const roleConfig = ROLES.find(r => r.value === u.role) || ROLES[0];
                  const RoleIcon = roleConfig.icon;

                  return (
                    <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="font-bold text-white text-sm">
                              {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{u.full_name || 'No Name'}</p>
                              {u.account_status === 'suspended' && (
                                <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0">Suspended</Badge>
                              )}
                              {u.account_status === 'banned' && (
                                <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0">Banned</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleConfig.color}>
                          <RoleIcon className="w-3 h-3 mr-1" /> {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.subscription_status === 'active' ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
                            <Crown className="w-3 h-3 mr-1" /> Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-700">
                            Free
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-300">{stats.attempts} quizzes</span>
                          {stats.attempts > 0 && (
                            <span className={`text-xs ${stats.avgScore >= 80 ? 'text-emerald-400' : stats.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              Avg: {stats.avgScore}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-amber-400 font-medium">
                          <Trophy className="w-3 h-3" /> {stats.points}
                          <span className="text-slate-500 text-xs ml-1">(Lv.{stats.level})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {format(new Date(u.created_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleEditUser(u)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuLabel className="text-xs text-slate-500">Change Role</DropdownMenuLabel>
                              {ROLES.map(role => (
                                <DropdownMenuItem
                                  key={role.value}
                                  onClick={() => updateUserMutation.mutate({ id: u.id, data: { role: role.value } })}
                                  className={u.role === role.value ? 'bg-white/10' : ''}
                                >
                                  <role.icon className="w-4 h-4 mr-2" />
                                  {role.label}
                                  {u.role === role.value && <CheckCircle className="w-4 h-4 ml-auto text-green-400" />}
                                </DropdownMenuItem>
                              ))}

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-slate-500">Subscription</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => updateUserMutation.mutate({ id: u.id, data: { subscription_status: 'active' } })}
                                className={u.subscription_status === 'active' ? 'bg-white/10' : ''}
                              >
                                <Crown className="w-4 h-4 mr-2 text-amber-400" />
                                Grant Premium
                                {u.subscription_status === 'active' && <CheckCircle className="w-4 h-4 ml-auto text-green-400" />}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => updateUserMutation.mutate({ id: u.id, data: { subscription_status: 'none' } })}
                                className={(!u.subscription_status || u.subscription_status === 'none') ? 'bg-white/10' : ''}
                              >
                                <XCircle className="w-4 h-4 mr-2 text-red-400" />
                                Remove Premium
                                {(!u.subscription_status || u.subscription_status === 'none') && <CheckCircle className="w-4 h-4 ml-auto text-green-400" />}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-slate-500">Account Status</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => updateUserMutation.mutate({ id: u.id, data: { account_status: 'active' } })}
                                className={(!u.account_status || u.account_status === 'active') ? 'bg-white/10' : ''}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                Active
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => updateUserMutation.mutate({ id: u.id, data: { account_status: 'suspended' } })}
                                className={u.account_status === 'suspended' ? 'bg-white/10' : ''}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
                                Suspend
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => updateUserMutation.mutate({ id: u.id, data: { account_status: 'banned' } })}
                                className={u.account_status === 'banned' ? 'bg-white/10' : ''}
                              >
                                <Ban className="w-4 h-4 mr-2 text-red-400" />
                                Ban
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
        {/* User Edit Dialog */}
        <UserEditDialog
          user={selectedUser}
          open={showUserDialog}
          onOpenChange={setShowUserDialog}
          onSave={(data) => {
            updateUserMutation.mutate({ id: selectedUser.id, data });
          }}
          loading={updateUserMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
}