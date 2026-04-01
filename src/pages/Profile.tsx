import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Mail, 
  Building, 
  Save, 
  Camera,
  CheckCircle2,
  Upload,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface ProfileData {
  company_name: string;
  owner_name: string;
  email: string;
  logo_url: string;
}

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    owner_name: '',
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
      // Since profiles table doesn't exist, use localStorage for now
      const savedProfile = localStorage.getItem('ms_delivery_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          company_name: parsed.company_name || '',
          owner_name: parsed.owner_name || '',
          email: parsed.email || '',
          logo_url: parsed.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Ensure we have default values even if localStorage fails
      setProfile({
        company_name: '',
        owner_name: '',
        email: '',
        logo_url: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      // For now, use local preview. In production, upload to Supabase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfile({ ...profile, logo_url: dataUrl });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save to localStorage since profiles table doesn't exist
      localStorage.setItem('ms_delivery_profile', JSON.stringify(profile));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-gray-500">Manage your company information and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 bg-gray-50 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="w-12 h-12 text-gray-300" />
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
              className="absolute bottom-0 right-0 bg-indigo-600 p-2.5 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </label>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Company Logo</h3>
            <p className="text-xs text-gray-400 mt-1">Recommended: Square PNG or JPG, max 2MB</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                Company Name
              </label>
              <input
                type="text"
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. MS Delivery Services"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                Owner Name
              </label>
              <input
                type="text"
                value={profile.owner_name}
                onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Contact Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="contact@company.com"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Success Toast */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: showSuccess ? 1 : 0, y: showSuccess ? 0 : 50 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100] pointer-events-none"
      >
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        Profile updated successfully!
      </motion.div>
    </div>
  );
};

export default Profile;
