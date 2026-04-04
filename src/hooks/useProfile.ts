import { useState, useEffect } from 'react';

interface ProfileData {
  company_name: string;
  owner_name: string;
  email: string;
  logo_url: string;
  login_heading: string;
  login_subheading: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    owner_name: '',
    email: '',
    logo_url: '',
    login_heading: 'MS Delivery',
    login_subheading: 'Logistics Management Portal'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // For now, use localStorage. In production, this would fetch from Supabase
      const savedProfile = localStorage.getItem('ms_delivery_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          company_name: parsed.company_name || '',
          owner_name: parsed.owner_name || '',
          email: parsed.email || '',
          logo_url: parsed.logo_url || '',
          login_heading: parsed.login_heading || 'MS Delivery',
          login_subheading: parsed.login_subheading || 'Logistics Management Portal'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Ensure we have default values even if localStorage fails
      setProfile({
        company_name: '',
        owner_name: '',
        email: '',
        logo_url: '',
        login_heading: 'MS Delivery',
        login_subheading: 'Logistics Management Portal'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (newProfile: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
};
