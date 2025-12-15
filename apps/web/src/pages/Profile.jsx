import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Camera, Building2, Briefcase, Calendar, Settings, ChevronRight, Crown, MapPin, Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LocationTracker from '@/components/LocationTracker';
import { format } from 'date-fns';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setEditData({
        university: u.university || '',
        workplace: u.workplace || '',
        birth_date: u.birth_date || ''
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe(editData);
      setUser({ ...user, ...editData });
      setShowEditDialog(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await base44.functions.invoke('manageSubscription');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (e) {
      console.error(e);
    }
    setManagingSubscription(false);
  };

  const isSubscribed = user?.subscription_status === 'active';

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <Button 
          variant="ghost" 
          className="text-zinc-400"
          onClick={() => setShowEditDialog(true)}
        >
          Edit
        </Button>
      </div>

      {/* Avatar */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center">
            <User className="w-14 h-14 text-zinc-500" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <p className="text-center text-xl font-semibold text-white">{user.full_name || 'User'}</p>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Subscription */}
        <Card className={`bg-gradient-to-br ${isSubscribed ? 'from-green-950/60 to-zinc-950 border-green-900/50' : 'from-purple-950/60 to-zinc-950 border-purple-900/50'} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`w-5 h-5 ${isSubscribed ? 'text-green-400' : 'text-purple-400'}`} />
            <span className={`text-sm ${isSubscribed ? 'text-green-400' : 'text-purple-400'}`}>Subscription</span>
          </div>
          {isSubscribed ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-xl font-bold text-green-400">Premium</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="mt-3 border-green-700 text-green-400 text-xs"
                onClick={handleManageSubscription}
                disabled={managingSubscription}
              >
                {managingSubscription ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}
                Manage
              </Button>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-white">Free</p>
              <Link to={createPageUrl('Pricing')}>
                <Button size="sm" className="mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-xs">
                  Upgrade
                </Button>
              </Link>
            </>
          )}
        </Card>

        {/* University */}
        <Card className="bg-gradient-to-br from-blue-950/60 to-zinc-950 border-blue-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 text-sm">University</span>
          </div>
          <p className="text-xl font-bold text-blue-400">
            {user.university || 'Not set'}
          </p>
        </Card>

        {/* Workplace */}
        <Card className="bg-gradient-to-br from-orange-950/60 to-zinc-950 border-orange-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 text-sm">Workplace</span>
          </div>
          <p className="text-xl font-bold text-orange-400">
            {user.workplace || 'Not set'}
          </p>
        </Card>

        {/* Birth Date */}
        <Card className="bg-gradient-to-br from-amber-950/60 to-zinc-950 border-amber-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm">Birth Date</span>
          </div>
          <p className="text-lg font-bold text-white">
            {user.birth_date ? format(new Date(user.birth_date), 'MMMM d, yyyy') : 'Not set'}
          </p>
        </Card>
      </div>

      {/* Location */}
      <LocationTracker user={user} onLocationUpdate={(loc) => setUser({...user, location: loc})} />

      {/* Preferences */}
      <Card className="bg-zinc-900 border-zinc-800 p-4">
        <button className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400">Preferences</span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        </button>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">University</Label>
              <Input
                value={editData.university}
                onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Enter your university"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Workplace</Label>
              <Input
                value={editData.workplace}
                onChange={(e) => setEditData({ ...editData, workplace: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Enter your workplace"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Birth Date</Label>
              <Input
                type="date"
                value={editData.birth_date}
                onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}