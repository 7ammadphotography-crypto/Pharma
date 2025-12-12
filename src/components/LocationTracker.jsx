import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2, RefreshCw, Globe } from 'lucide-react';

export default function LocationTracker({ user, onLocationUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocationFromIP = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use free IP geolocation API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const locationData = {
        country: data.country_name,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        last_updated: new Date().toISOString()
      };

      await base44.auth.updateMe({ location: locationData });
      if (onLocationUpdate) onLocationUpdate(locationData);
      
    } catch (err) {
      setError('فشل في تحديد الموقع');
    } finally {
      setLoading(false);
    }
  };

  const getLocationFromBrowser = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocoding using free API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const data = await response.json();
          
          const locationData = {
            country: data.address?.country,
            city: data.address?.city || data.address?.town || data.address?.village,
            region: data.address?.state,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            last_updated: new Date().toISOString()
          };

          await base44.auth.updateMe({ location: locationData });
          if (onLocationUpdate) onLocationUpdate(locationData);
          
        } catch (err) {
          setError('فشل في تحديد الموقع');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        // If browser location fails, fall back to IP
        getLocationFromIP();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Auto-detect location on first load if not set
  useEffect(() => {
    if (user && !user.location?.country) {
      getLocationFromIP();
    }
  }, [user]);

  const location = user?.location;

  return (
    <Card className="glass-card border-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">الموقع</h3>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={getLocationFromBrowser}
          disabled={loading}
          className="text-slate-400 hover:text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}

      {location?.country ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{location.city}, {location.country}</span>
          </div>
          {location.region && (
            <p className="text-slate-400 text-sm">{location.region}</p>
          )}
          <p className="text-slate-500 text-xs">
            آخر تحديث: {new Date(location.last_updated).toLocaleDateString('ar')}
          </p>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">جاري تحديد الموقع...</p>
      )}
    </Card>
  );
}