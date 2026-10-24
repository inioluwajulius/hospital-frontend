import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        // In a production environment, we use window.location.hostname
        // For local development, we might fallback or use a hardcoded domain if needed
        const hostname = window.location.hostname;
        
        // Pass the hostname in headers or let the backend middleware figure it out
        // By calling a public endpoint to get branding info based on the host
        const response = await api.get('/public/tenant/branding', {
          headers: {
            'x-tenant-domain': hostname
          }
        });

        if (response.data?.success && response.data?.data) {
          const tenantData = response.data.data;
          setTenant(tenantData);
          
          // Apply dynamic CSS variables for white-labeling
          // The CSS uses rgb(var(--color-primary)), so the variable must be an "r g b"
          // triplet. Hospitals store hex colours: convert them, and ignore anything
          // else (an invalid value made every primary button transparent).
          if (tenantData.branding) {
            const root = document.documentElement;
            const toRgbTriplet = (value) => {
              const hex = String(value || '').trim().replace(/^#/, '');
              const full = /^[0-9a-f]{3}$/i.test(hex) ? hex.split('').map((c) => c + c).join('') : hex;
              if (/^[0-9a-f]{6}$/i.test(full)) return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ');
              return /^\d{1,3} \d{1,3} \d{1,3}$/.test(String(value).trim()) ? String(value).trim() : null;
            };
            const primary = toRgbTriplet(tenantData.branding.primaryColor);
            const secondary = toRgbTriplet(tenantData.branding.secondaryColor);
            if (primary) root.style.setProperty('--color-primary', primary);
            if (secondary) root.style.setProperty('--color-secondary', secondary);
          }
        } else {
          // Fallback to default if no tenant found
          setTenant({ isDefault: true });
        }
      } catch (error) {
        console.error('Error fetching tenant branding:', error);
        // Fallback to default styling
        setTenant({ isDefault: true });
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  if (loading) {
    // Show a blank screen or a generic loader while fetching brand colors
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
