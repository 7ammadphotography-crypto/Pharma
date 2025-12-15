import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Crown, Building2, Briefcase, Calendar, FileText, AlertTriangle, CheckCircle, Ban, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import UserPerformanceTab from './UserPerformanceTab';

const ROLES = [
  { value: 'user', label: 'Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'content_manager', label: 'Content Manager' },
];

const ACCOUNT_STATUS = [
  { value: 'active', label: 'Active', icon: CheckCircle, color: 'text-green-400' },
  { value: 'suspended', label: 'Suspended', icon: AlertTriangle, color: 'text-amber-400' },
  { value: 'banned', label: 'Banned', icon: Ban, color: 'text-red-400' },
];

const PERMISSIONS = [
  { value: 'manage_questions', label: 'Manage Questions' },
  { value: 'manage_chapters', label: 'Manage Chapters' },
  { value: 'manage_topics', label: 'Manage Topics' },
  { value: 'manage_users', label: 'Manage Users' },
  { value: 'view_analytics', label: 'View Analytics' },
  { value: 'manage_subscriptions', label: 'Manage Subscriptions' },
];

export default function UserEditDialog({ user, open, onOpenChange, onSave, loading }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        university: user.university || '',
        workplace: user.workplace || '',
        birth_date: user.birth_date || '',
        role: user.role || 'user',
        account_status: user.account_status || 'active',
        subscription_status: user.subscription_status || 'none',
        permissions: user.permissions || [],
        admin_notes: user.admin_notes || '',
      });
    }
  }, [user]);

  const handlePermissionToggle = (permission) => {
    const current = formData.permissions || [];
    if (current.includes(permission)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== permission) });
    } else {
      setFormData({ ...formData, permissions: [...current, permission] });
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="font-bold text-white">
                {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <span className="block">{user.full_name || 'No Name'}</span>
              <span className="text-sm text-slate-400 font-normal">{user.email}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="bg-zinc-800 border-zinc-700 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance" className="gap-1">
              <BarChart3 className="w-3 h-3" /> Performance
            </TabsTrigger>
            <TabsTrigger value="access">Access & Role</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-4">
            <UserPerformanceTab user={user} />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Birth Date</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">University</Label>
                <Input
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter university"
                />
              </div>
              <div>
                <Label className="text-slate-400">Workplace</Label>
                <Input
                  value={formData.workplace}
                  onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter workplace"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-800/50 rounded-xl space-y-2">
              <p className="text-slate-400 text-sm">Account Info</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Joined</span>
                <span className="text-white">{format(new Date(user.created_date), 'MMM d, yyyy')}</span>
              </div>
              {user.last_login_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Last Login</span>
                  <span className="text-white">{format(new Date(user.last_login_date), 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Access & Role Tab */}
          <TabsContent value="access" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Account Status</Label>
                <Select value={formData.account_status} onValueChange={(v) => setFormData({ ...formData, account_status: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_STATUS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <status.icon className={`w-4 h-4 ${status.color}`} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-400 mb-3 block">Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map(perm => (
                  <button
                    key={perm.value}
                    onClick={() => handlePermissionToggle(perm.value)}
                    className={`p-3 rounded-lg text-left text-sm transition-all ${
                      formData.permissions?.includes(perm.value)
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300'
                        : 'bg-zinc-800 border border-zinc-700 text-slate-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.permissions?.includes(perm.value) && (
                        <CheckCircle className="w-4 h-4 text-indigo-400" />
                      )}
                      {perm.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Subscription Status</Label>
              <Select 
                value={formData.subscription_status} 
                onValueChange={(v) => setFormData({ ...formData, subscription_status: v })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free</SelectItem>
                  <SelectItem value="active">Premium (Active)</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.subscription_end_date && (
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Subscription End Date</p>
                <p className="text-white font-medium">{format(new Date(user.subscription_end_date), 'MMM d, yyyy')}</p>
              </div>
            )}

            {user.stripe_customer_id && (
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <p className="text-slate-400 text-sm">Stripe Customer ID</p>
                <p className="text-white font-mono text-sm">{user.stripe_customer_id}</p>
              </div>
            )}
          </TabsContent>

          {/* Admin Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Admin Notes</Label>
              <Textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[150px]"
                placeholder="Add private notes about this user (only visible to admins)..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}