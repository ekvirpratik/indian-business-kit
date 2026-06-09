import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { SettingsSchema } from '../lib/validators';
import { uploadImage } from '../lib/storage';
import { 
  Save, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  Send, 
  Tags, 
  IndianRupee, 
  Plus, 
  X,
  Camera,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, updateSettings, userId } = useCRM();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    company_name: '',
    owner_name: '',
    owner_role: '',
    industry: '',
    whatsapp: '',
    email: '',
    logo_url: '',
    auto_assign: '',
    wa_template: '',
    requirement_options: [],
    budget_options: [],
    lead_sources: []
  });

  const [newReq, setNewReq] = useState('');
  const [newSource, setNewSource] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync settings state
  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        owner_name: settings.owner_name || '',
        owner_role: settings.owner_role || '',
        industry: settings.industry || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        logo_url: settings.logo_url || '',
        auto_assign: settings.auto_assign || '',
        wa_template: settings.wa_template || '',
        requirement_options: settings.requirement_options || [],
        budget_options: settings.budget_options || [],
        lead_sources: settings.lead_sources || []
      });
      setLogoPreview(settings.logo_url || null);
    }
  }, [settings]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.info('Saving changes to database...');

    try {
      let finalLogoUrl = formData.logo_url;

      // 1. Upload logo if file selected
      if (logoFile) {
        toast.info('Uploading company logo...');
        const fileExt = logoFile.name.split('.').pop() || 'png';
        finalLogoUrl = await uploadImage(userId, logoFile, `logo_${Date.now()}.${fileExt}`);
      }

      const payload = {
        ...formData,
        logo_url: finalLogoUrl
      };

      // Validate
      SettingsSchema.parse(payload);

      // Save
      await updateSettings(payload);
      setLogoFile(null); // Clear so next save doesn't re-upload the same file
      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save settings details.');
    } finally {
      setSaving(false);
    }
  };

  const addTagOption = (key, value, setter) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    
    const current = formData[key] || [];
    if (current.includes(trimmed)) {
      setter('');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [key]: [...current, trimmed]
    }));
    setter('');
  };

  const removeTagOption = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(opt => opt !== value)
    }));
  };

  const INDUSTRY_OPTIONS = ['Manufacturing', 'Service Provider', 'D2C Brand', 'Retail Shop', 'Agency / Tech Partner', 'Consulting'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">System Configuration</h2>
          <p className="text-xs text-slate-500">Configure company metadata, customize sales pipelines, and design follow-up templates.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Company Branding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2 flex-shrink-0 text-slate-800">
            <Building className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Company Branding</h4>
          </div>

          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4 py-1.5">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-extrabold text-lg flex-shrink-0 overflow-hidden relative group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  '💼'
                )}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9px] font-bold"
                >
                  Upload
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700">Company Logo</p>
                <p className="text-[10px] text-slate-400">Square dimensions, PNG/JPEG format preferred.</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" 
                onChange={handleLogoChange} 
                className="hidden" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. Sharma Logistics"
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Owner Name</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Role Title</label>
                <input
                  type="text"
                  value={formData.owner_role}
                  onChange={e => setFormData({ ...formData, owner_role: e.target.value })}
                  placeholder="e.g. Managing Partner"
                  className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Industry Sector</label>
              <select
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">-- Select Industry --</option>
                {INDUSTRY_OPTIONS.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contacts & Communication */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2 flex-shrink-0 text-slate-800">
            <Phone className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Communication Details</h4>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">WhatsApp Business Number</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Company Notification Email</label>
              <input
                type="text"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. business@company.com"
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Custom Lead Sources Options */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2 flex-shrink-0 text-slate-800">
            <Share2 className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Custom Lead Sources</h4>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              {formData.lead_sources.map(src => (
                <span key={src} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                  {src}
                  <button 
                    type="button"
                    onClick={() => removeTagOption('lead_sources', src)}
                    className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSource}
                onChange={e => setNewSource(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagOption('lead_sources', newSource, setNewSource))}
                placeholder="e.g. TradeIndia, Reference"
                className="flex-1 p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => addTagOption('lead_sources', newSource, setNewSource)}
                className="px-3 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-xl flex items-center justify-center cursor-pointer shadow-3xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lead Requirement Options */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2 flex-shrink-0 text-slate-800">
            <Tags className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Lead Product Requirements</h4>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              {formData.requirement_options.map(req => (
                <span key={req} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                  {req}
                  <button 
                    type="button"
                    onClick={() => removeTagOption('requirement_options', req)}
                    className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newReq}
                onChange={e => setNewReq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagOption('requirement_options', newReq, setNewReq))}
                placeholder="e.g. SEO Services, Custom CRM"
                className="flex-1 p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => addTagOption('requirement_options', newReq, setNewReq)}
                className="px-3 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-xl flex items-center justify-center cursor-pointer shadow-3xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Message Template (Full Width in grid) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2 flex-shrink-0 text-slate-800">
            <Send className="w-4.5 h-4.5 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">WhatsApp Follow-up Template</h4>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Standard message text</label>
              <textarea
                rows="4"
                value={formData.wa_template}
                onChange={e => setFormData({ ...formData, wa_template: e.target.value })}
                placeholder="Hi {{name}}, ..."
                className="p-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans leading-relaxed"
              />
            </div>
            
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1 text-slate-400 font-medium text-[11px]">
              <p className="font-bold text-slate-700 uppercase tracking-wider">Dynamic Fields Guide:</p>
              <p>Type double curly braces to inject lead specific values:</p>
              <div className="flex gap-4 pt-1 font-mono text-slate-500">
                <span>{"{{name}}"} - Lead Name</span>
                <span>{"{{company}}"} - Company Name</span>
                <span>{"{{requirement}}"} - Specific Requirement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
