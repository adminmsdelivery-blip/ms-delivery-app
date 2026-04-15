import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CompanyProfileData {
  company_name: string;
  contact_number: string;
  email: string;
  logo_url: string;
}

export const useCompanyProfile = () => {
  const [profile, setProfile] = useState<CompanyProfileData>({
    company_name: '',
    contact_number: '',
    email: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('company_profile')
            .select('*')
            .eq('id', 1)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Database error:', error);
          } else if (data) {
            setProfile({
              company_name: data.company_name || '',
              contact_number: data.contact_number || '',
              email: data.email || '',
              logo_url: data.logo_url || ''
            });
            setLoading(false);
            return;
          }
        }

        // Fallback to localStorage
        const savedProfile = localStorage.getItem('ms_delivery_company_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfile({
            company_name: parsed.company_name || '',
            contact_number: parsed.contact_number || '',
            email: parsed.email || '',
            logo_url: parsed.logo_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
        const savedProfile = localStorage.getItem('ms_delivery_company_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfile({
            company_name: parsed.company_name || '',
            contact_number: parsed.contact_number || '',
            email: parsed.email || '',
            logo_url: parsed.logo_url || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading };
};
