import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Building, 
  Mail, 
  Phone, 
  Save, 
  Camera,
  CheckCircle2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface CompanyProfileData {
  company_name: string;
  contact_number: string;
  email: string;
  logo_url: string;
}

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfileData>({
    company_name: '',
    contact_number: '',
    email: '',
    logo_url: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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
      console.error('Error fetching profile:', error);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      if (isSupabaseConfigured()) {
        const fileExt = file.name.split('.').pop();
        const fileName = `company-logo-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(fileName);

        setProfile({ ...profile, logo_url: publicUrl });
        setUploading(false);
        return;
      }

      // Fallback to local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfile({ ...profile, logo_url: dataUrl });
        setUploading(false);
        if (!isSupabaseConfigured()) {
          alert('Logo uploaded locally. Configure Supabase to enable cloud storage.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfile({ ...profile, logo_url: dataUrl });
        setUploading(false);
        alert('Logo uploaded locally. Storage upload failed, but your logo is saved locally.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isSupabaseConfigured()) {
        console.log('Attempting database save...');
        const { data, error } = await supabase
          .from('company_profile')
          .upsert({
            id: 1,
            company_name: profile.company_name,
            contact_number: profile.contact_number,
            email: profile.email,
            logo_url: profile.logo_url,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        console.log('Database operation result:', { data, error });

        if (error) {
          console.error('Database save error:', error);
          throw error;
        }

        // Success - save to localStorage and show success
        localStorage.setItem('ms_delivery_company_profile', JSON.stringify(profile));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        console.log('Profile saved successfully to database');
        return;
      }

      // Supabase not configured - fallback to localStorage
      console.log('Supabase not configured, saving locally only');
      localStorage.setItem('ms_delivery_company_profile', JSON.stringify(profile));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      alert('Profile saved locally. Configure Supabase to enable cloud storage.');
      
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('DB ERROR:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Fallback to localStorage
      localStorage.setItem('ms_delivery_company_profile', JSON.stringify(profile));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      alert(`Database error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Profile</h1>
          <p className="text-gray-600">Manage your company's brand information and contact details</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Logo Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                Brand Assets
              </h2>
              
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all hover:border-indigo-400">
                    {profile.logo_url ? (
                      <img 
                        src={profile.logo_url} 
                        alt="Company Logo" 
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-center">
                        <Building className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  
                  <label 
                    htmlFor="logo-upload"
                    className="absolute bottom-4 right-4 bg-indigo-600 p-3 rounded-xl text-white shadow-lg hover:bg-indigo-700 transition-all cursor-pointer hover:scale-105"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </label>
                </div>
                
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">Company Logo</h3>
                  <p className="text-sm text-gray-500">Upload your company logo</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: Square PNG or JPG, max 5MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Company Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. MS Delivery Services"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={profile.contact_number}
                    onChange={(e) => setProfile({ ...profile, contact_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Success Toast */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: showSuccess ? 1 : 0, y: showSuccess ? 0 : 50 }}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl z-[100] pointer-events-none"
      >
        <CheckCircle2 className="w-6 h-6" />
        <div>
          <p className="font-semibold">Profile Updated!</p>
          <p className="text-sm opacity-90">Your company profile has been saved successfully.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
