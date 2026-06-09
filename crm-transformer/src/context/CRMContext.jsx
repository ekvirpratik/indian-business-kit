/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser } from '@clerk/react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { 
  LeadSchema, 
  TaskSchema, 
  TeamMemberSchema, 
  SettingsSchema, 
  QuotationSchema 
} from '../lib/validators';
import { toast } from 'sonner';

const CRMContext = createContext();

/**
 * Format any error (Zod v4 or plain) into a human-readable string.
 * In Zod v4, `err.message` is the raw JSON of issues; `err.issues` is the array.
 */
const formatError = (err, fallback = 'Something went wrong') => {
  if (err?.issues?.length) {
    return err.issues.map(i => i.message).join(', ');
  }
  return err?.message || fallback;
};

const calculateLeadScore = (lead) => {
  let score = 0;
  if (lead.email && lead.email.trim() !== '') score += 10;
  if (lead.phone && lead.phone.trim() !== '') score += 10;
  if (lead.budget && lead.budget.trim() !== '') score += 15;
  if (lead.requirement && lead.requirement.trim() !== '') score += 10;
  if (lead.notes && lead.notes.trim() !== '') score += 5;
  if (['Google Business Profile', 'IndiaMART', 'JustDial', 'WhatsApp'].includes(lead.source)) score += 10;
  
  const createdDate = new Date(lead.created_at || new Date());
  const differenceInDays = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
  if (differenceInDays <= 7) score += 10;
  
  if (lead.status === 'Hot') score += 15;
  if (lead.deal_value > 0) score += 10;
  if (lead.next_followup) score += 5;
  
  return Math.min(100, score);
};

export const CRMProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);

  // States
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [activities, setActivities] = useState([]);

  // Stable primitive values derived from user — avoids re-triggering effects on
  // every Clerk JWT refresh (Clerk recreates the user object reference each time)
  const userId = user?.id || null;
  const userFullName = user?.fullName || null;
  const userEmail = user?.primaryEmailAddress?.emailAddress || null;

  // Track whether initial data load has already completed so we don't flash
  // the full-page spinner every time Clerk refreshes the token in the background
  const initialLoadDone = useRef(false);

  // Fetch client helper — keyed on userId string, not the user object reference
  const client = useMemo(() => {
    if (isLoaded && isSignedIn && userId) {
      return getSupabaseClient(userId);
    }
    return null;
  }, [userId, isLoaded, isSignedIn]);

  // Load all data from Supabase
  const loadCRMData = useCallback(async () => {
    if (!client || !userId) return;
    // Only show the full-page loading spinner on the very first load.
    // After that, data refreshes happen silently in the background so
    // Clerk token rotations never flash the spinner mid-operation.
    if (!initialLoadDone.current) {
      setLoading(true);
    }

    try {
      // 1. Settings
      let { data: settingsData, error: settingsError } = await client
        .from('crm_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (!settingsData) {
        // Seed default settings using stable primitive values (not the user object)
        const defaultSettings = {
          user_id: userId,
          company_name: 'My Business',
          owner_name: userFullName || 'Business Owner',
          owner_role: 'Owner',
          whatsapp: '',
          email: userEmail || '',
          logo_url: '',
          auto_assign: '',
          wa_template: 'Hi {{name}}, Thank you for your interest in {{company}}. We received your inquiry regarding {{requirement}}...',
          requirement_options: ['Web App', 'Mobile App', 'Consulting', 'Enterprise', 'Hardware', 'Services'],
          budget_options: ['₹50k - ₹1.5L', '₹1.5L - ₹5L', '₹5L - ₹15L', '₹15L+'],
          lead_sources: ['Google Business Profile', 'IndiaMART', 'JustDial', 'WhatsApp', 'Website Form', 'Referral', 'Walk-in', 'Phone Call', 'Instagram', 'Facebook']
        };

        const { data: newSettings, error: insertError } = await client
          .from('crm_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        settingsData = newSettings;
      }
      setSettings(settingsData);

      // 2. Stages
      let { data: stagesData, error: stagesError } = await client
        .from('crm_pipeline_stages')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (stagesError) throw stagesError;

      if (!stagesData || stagesData.length === 0) {
        // Seed default stages
        const defaultStages = [
          { user_id: userId, slug: 'new', title: 'New Leads', position: 0, color: '#6366f1' },
          { user_id: userId, slug: 'contacted', title: 'Contacted', position: 1, color: '#f59e0b' },
          { user_id: userId, slug: 'proposal', title: 'Proposal Sent', position: 2, color: '#3b82f6' },
          { user_id: userId, slug: 'won', title: 'Won / Closed', position: 3, color: '#10b981' },
          { user_id: userId, slug: 'rejected', title: 'Rejected', position: 4, color: '#ef4444' }
        ];

        const { data: newStages, error: insertError } = await client
          .from('crm_pipeline_stages')
          .insert(defaultStages)
          .select();

        if (insertError) throw insertError;
        stagesData = newStages;
      }
      setStages(stagesData);

      // 3. Leads, Tasks, Team, Notifications, WA Logs, Quotations, Activities
      const [
        resLeads,
        resTasks,
        resTeam,
        resNotifs,
        resWa,
        resQuots,
        resActs
      ] = await Promise.all([
        client.from('crm_leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        client.from('crm_tasks').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
        client.from('crm_team_members').select('*').eq('user_id', userId).order('name', { ascending: true }),
        client.from('crm_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        client.from('crm_whatsapp_log').select('*').eq('user_id', userId).order('sent_at', { ascending: false }),
        client.from('crm_quotations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        client.from('crm_activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (resLeads.error) throw resLeads.error;
      if (resTasks.error) throw resTasks.error;
      if (resTeam.error) throw resTeam.error;
      if (resNotifs.error) throw resNotifs.error;
      if (resWa.error) throw resWa.error;
      if (resQuots.error) throw resQuots.error;
      if (resActs.error) throw resActs.error;

      // Handle number conversions / mapping if needed
      setLeads(resLeads.data || []);
      setTasks(resTasks.data || []);
      setTeam(resTeam.data || []);
      setNotifications(resNotifs.data || []);
      setWhatsappLogs(resWa.data || []);
      setQuotations(resQuots.data || []);
      setActivities(resActs.data || []);

    } catch (err) {
      console.error('Error loading CRM data from Supabase:', err.message);
      toast.error('Failed to load CRM data: ' + err.message);
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [client, userId, userFullName, userEmail]);

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      loadCRMData();
    } else if (isLoaded && !isSignedIn) {
      // User signed out — clear all data and reset the initial load flag
      initialLoadDone.current = false;
      setLeads([]);
      setStages([]);
      setSettings(null);
      setTeam([]);
      setTasks([]);
      setNotifications([]);
      setWhatsappLogs([]);
      setQuotations([]);
      setActivities([]);
      setLoading(false);
    }
  }, [userId, isLoaded, isSignedIn, loadCRMData]);

  // Log Activity Helper
  const logActivity = async (action, description, leadId = null, teamMemberId = null, metadata = {}) => {
    if (!client || !user) return;
    try {
      const { data, error } = await client
        .from('crm_activity_log')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          team_member_id: teamMemberId,
          action,
          description,
          metadata
        })
        .select()
        .single();
      
      if (error) throw error;
      setActivities(prev => [data, ...prev]);
    } catch (err) {
      console.error('Failed to log activity:', err.message);
    }
  };

  // Add Notification Helper
  const addNotification = async (text, type = 'info', linkTo = '') => {
    if (!client || !user) return;
    try {
      const { data, error } = await client
        .from('crm_notifications')
        .insert({
          user_id: user.id,
          text,
          type,
          link_to: linkTo
        })
        .select()
        .single();
      
      if (error) throw error;
      setNotifications(prev => [data, ...prev]);
    } catch (err) {
      console.error('Failed to add notification:', err.message);
    }
  };

  // ==========================================
  // LEADS CRUD
  // ==========================================
  const addLead = async (leadData) => {
    if (!client || !user) return null;
    try {
      const validated = LeadSchema.parse(leadData);
      const score = calculateLeadScore(validated);
      
      const payload = {
        ...validated,
        user_id: user.id,
        lead_score: score
      };

      const { data, error } = await client
        .from('crm_leads')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => [data, ...prev]);
      toast.success(`Lead '${data.name}' added successfully!`);
      
      // Log activity
      await logActivity('Lead Created', `Added lead ${data.name}`, data.id);
      
      // Auto-schedule follow-up task for next business day (skip weekends)
      const today = new Date();
      let nextBusinessDay = new Date(today);
      nextBusinessDay.setDate(today.getDate() + 1);
      // Skip Saturday (6) and Sunday (0)
      if (nextBusinessDay.getDay() === 6) {
        nextBusinessDay.setDate(nextBusinessDay.getDate() + 2);
      } else if (nextBusinessDay.getDay() === 0) {
        nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
      }
      
      await addTask({
        description: `Follow up with ${data.name}`,
        lead_id: data.id,
        due_date: nextBusinessDay.toISOString().split('T')[0],
        type: 'followup',
        priority: validated.status === 'Hot' ? 'High' : 'Medium',
        status: 'Pending'
      });

      return data;
    } catch (err) {
      console.error('Add lead error:', err);
      // Zod v4: err.issues is the array; err.message is raw JSON — format it properly
      const msg = err.issues
        ? err.issues.map(i => i.message).join(', ')
        : (err.message || 'Failed to add lead');
      toast.error(`Validation: ${msg}`);
      throw err;
    }
  };

  const updateLead = async (id, updates) => {
    if (!client || !user) return null;
    try {
      // Find original lead
      const original = leads.find(l => l.id === id);
      if (!original) throw new Error('Lead not found');

      // Merge and validate
      const merged = { ...original, ...updates };
      delete merged.id;
      delete merged.user_id;
      delete merged.created_at;
      delete merged.updated_at;

      const validated = LeadSchema.parse(merged);
      const score = calculateLeadScore(validated);
      
      const payload = {
        ...validated,
        lead_score: score,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('crm_leads')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === id ? data : l));
      
      // Log activity if stage/status changed
      if (original.stage !== data.stage) {
        await logActivity('Stage Updated', `Moved stage from '${original.stage}' to '${data.stage}'`, id);
        if (data.stage === 'won') {
          await logActivity('Lead Won', `Won deal with value ${data.won_amount || data.deal_value || 0}`, id);
          await addNotification(`Lead Won: ${data.name} is now a client!`, 'success', `/leads/${id}`);
        } else if (data.stage === 'rejected') {
          await logActivity('Lead Rejected', `Lead rejected: ${data.lost_reason}`, id);
        }
      }
      if (original.status !== data.status) {
        await logActivity('Status Updated', `Changed status from '${original.status}' to '${data.status}'`, id);
      }

      return data;
    } catch (err) {
      console.error('Update lead error:', err);
      // Zod v4: err.issues is the array; err.message is raw JSON — format it properly
      const msg = err.issues
        ? err.issues.map(i => i.message).join(', ')
        : (err.message || 'Failed to update lead');
      toast.error(`Validation: ${msg}`);
      throw err;
    }
  };

  const deleteLead = async (id) => {
    if (!client || !user) return false;
    try {
      const original = leads.find(l => l.id === id);
      if (!original) throw new Error('Lead not found');

      const { error } = await client
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success(`Lead '${original.name}' deleted`);
      return true;
    } catch (err) {
      console.error('Delete lead error:', err);
      toast.error(err.message || 'Failed to delete lead');
      return false;
    }
  };

  // ==========================================
  // PIPELINE STAGES CRUD
  // ==========================================
  const addStage = async (stageData) => {
    if (!client || !user) return null;
    try {
      const payload = {
        ...stageData,
        user_id: user.id
      };
      const { data, error } = await client
        .from('crm_pipeline_stages')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      setStages(prev => [...prev, data].sort((a,b) => a.position - b.position));
      toast.success(`Pipeline stage '${data.title}' added`);
      return data;
    } catch (err) {
      console.error('Add stage error:', err);
      toast.error(err.message || 'Failed to add pipeline stage');
      return null;
    }
  };

  const deleteStage = async (id) => {
    if (!client || !user) return false;
    try {
      const original = stages.find(s => s.id === id);
      if (!original) throw new Error('Stage not found');

      // Check if there are leads in this stage
      const hasLeads = leads.some(l => l.stage === original.slug);
      if (hasLeads) {
        toast.error(`Cannot delete stage because it contains active leads. Move leads first.`);
        return false;
      }

      const { error } = await client
        .from('crm_pipeline_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStages(prev => prev.filter(s => s.id !== id));
      toast.success(`Pipeline stage '${original.title}' deleted`);
      return true;
    } catch (err) {
      console.error('Delete stage error:', err);
      toast.error(err.message || 'Failed to delete stage');
      return false;
    }
  };

  // ==========================================
  // TASKS CRUD
  // ==========================================
  const addTask = async (taskData) => {
    if (!client || !user) return null;
    try {
      const validated = TaskSchema.parse(taskData);
      const payload = {
        ...validated,
        user_id: user.id
      };

      const { data, error } = await client
        .from('crm_tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev].sort((a,b) => new Date(a.due_date) - new Date(b.due_date)));
      
      if (taskData.lead_id) {
        await logActivity('Task Created', `Scheduled a ${validated.type}: ${validated.description}`, taskData.lead_id);
      }
      return data;
    } catch (err) {
      console.error('Add task error:', err);
      toast.error(formatError(err, 'Failed to add task'));
      throw err;
    }
  };

  const updateTask = async (id, updates) => {
    if (!client || !user) return null;
    try {
      const original = tasks.find(t => t.id === id);
      if (!original) throw new Error('Task not found');

      const merged = { ...original, ...updates };
      delete merged.id;
      delete merged.user_id;
      delete merged.created_at;
      delete merged.updated_at;

      const validated = TaskSchema.parse(merged);
      const payload = {
        ...validated,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('crm_tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === id ? data : t).sort((a,b) => new Date(a.due_date) - new Date(b.due_date)));

      if (original.status !== data.status && data.status === 'Completed' && data.lead_id) {
        await logActivity('Task Completed', `Completed ${data.type}: ${data.description}`, data.lead_id);
      }

      return data;
    } catch (err) {
      console.error('Update task error:', err);
      toast.error(formatError(err, 'Failed to update task'));
      throw err;
    }
  };

  const deleteTask = async (id) => {
    if (!client || !user) return false;
    try {
      const original = tasks.find(t => t.id === id);
      if (!original) throw new Error('Task not found');

      const { error } = await client
        .from('crm_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      if (original.lead_id) {
        await logActivity('Task Deleted', `Cancelled ${original.type}: ${original.description}`, original.lead_id);
      }
      return true;
    } catch (err) {
      console.error('Delete task error:', err);
      toast.error(err.message || 'Failed to delete task');
      return false;
    }
  };

  // ==========================================
  // TEAM MEMBERS CRUD
  // ==========================================
  const addTeamMember = async (memberData) => {
    if (!client || !user) return null;
    try {
      const validated = TeamMemberSchema.parse(memberData);
      const payload = {
        ...validated,
        user_id: user.id
      };

      const { data, error } = await client
        .from('crm_team_members')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setTeam(prev => [...prev, data]);
      toast.success(`Team member '${data.name}' added!`);
      return data;
    } catch (err) {
      console.error('Add team member error:', err);
      toast.error(formatError(err, 'Failed to add team member'));
      throw err;
    }
  };

  const updateTeamMember = async (id, updates) => {
    if (!client || !userId) return null;
    try {
      // Try local state first. If not found (e.g. called immediately after addTeamMember
      // before React has re-rendered and synced the new member into state), fetch from DB.
      let original = team.find(t => t.id === id);

      if (!original) {
        const { data: fetched, error: fetchErr } = await client
          .from('crm_team_members')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr || !fetched) throw new Error('Team member not found');
        original = fetched;
      }

      const merged = { ...original, ...updates };
      delete merged.id;
      delete merged.user_id;
      delete merged.created_at;

      const validated = TeamMemberSchema.parse(merged);

      const { data, error } = await client
        .from('crm_team_members')
        .update(validated)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state — works whether or not the member was already in state
      setTeam(prev => {
        const exists = prev.some(t => t.id === id);
        if (exists) {
          return prev.map(t => t.id === id ? data : t);
        }
        // Member wasn't in local state yet (stale render) — append it
        return [...prev, data];
      });

      return data;
    } catch (err) {
      console.error('Update team member error:', err);
      toast.error(formatError(err, 'Failed to update team member'));
      throw err;
    }
  };

  const deleteTeamMember = async (id) => {
    if (!client || !user) return false;
    try {
      const original = team.find(t => t.id === id);
      if (!original) throw new Error('Team member not found');

      // Unassign leads
      await client
        .from('crm_leads')
        .update({ assigned_to: null })
        .eq('assigned_to', id);

      const { error } = await client
        .from('crm_team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeam(prev => prev.filter(t => t.id !== id));
      setLeads(prev => prev.map(l => l.assigned_to === id ? { ...l, assigned_to: null } : l));
      
      toast.success(`Team member '${original.name}' removed`);
      return true;
    } catch (err) {
      console.error('Delete team member error:', err);
      toast.error(err.message || 'Failed to delete team member');
      return false;
    }
  };

  // ==========================================
  // SETTINGS CRUD
  // ==========================================
  const updateSettings = async (updates) => {
    if (!client || !user || !settings) return null;
    try {
      const merged = { ...settings, ...updates };
      delete merged.id;
      delete merged.user_id;
      delete merged.created_at;
      delete merged.updated_at;

      const validated = SettingsSchema.parse(merged);
      const payload = {
        ...validated,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('crm_settings')
        .update(payload)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast.success('Settings updated successfully!');
      return data;
    } catch (err) {
      console.error('Update settings error:', err);
      toast.error(formatError(err, 'Failed to update settings'));
      throw err;
    }
  };

  // ==========================================
  // QUOTATIONS CRUD
  // ==========================================
  const addQuotation = async (quotationData) => {
    if (!client || !user) return null;
    try {
      const validated = QuotationSchema.parse(quotationData);
      
      // Calculate subtotals
      const subtotal = validated.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const gstAmount = subtotal * (validated.gst_percent / 100);
      const total = subtotal + gstAmount;

      const payload = {
        ...validated,
        user_id: user.id,
        subtotal,
        gst_amount: gstAmount,
        total
      };

      const { data, error } = await client
        .from('crm_quotations')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setQuotations(prev => [data, ...prev]);
      toast.success(`Quotation ${data.quotation_no} created!`);

      if (validated.lead_id) {
        await logActivity('Quotation Created', `Created quotation ${data.quotation_no} for value ₹${total.toLocaleString('en-IN')}`, validated.lead_id);
      }
      return data;
    } catch (err) {
      console.error('Add quotation error:', err);
      toast.error(formatError(err, 'Failed to create quotation'));
      throw err;
    }
  };

  const updateQuotation = async (id, updates) => {
    if (!client || !user) return null;
    try {
      const original = quotations.find(q => q.id === id);
      if (!original) throw new Error('Quotation not found');

      const merged = { ...original, ...updates };
      delete merged.id;
      delete merged.user_id;
      delete merged.created_at;
      delete merged.updated_at;

      const validated = QuotationSchema.parse(merged);
      
      const subtotal = validated.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const gstAmount = subtotal * (validated.gst_percent / 100);
      const total = subtotal + gstAmount;

      const payload = {
        ...validated,
        subtotal,
        gst_amount: gstAmount,
        total,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('crm_quotations')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setQuotations(prev => prev.map(q => q.id === id ? data : q));

      // Handle conversion when Accepted
      if (original.status !== data.status && data.status === 'Accepted' && data.lead_id) {
        await logActivity('Quotation Accepted', `Quotation ${data.quotation_no} accepted by client`, data.lead_id);
        // Automatically move lead to won/Converted
        const lead = leads.find(l => l.id === data.lead_id);
        if (lead && lead.stage !== 'won') {
          await updateLead(data.lead_id, {
            stage: 'won',
            status: 'Converted',
            won_amount: total,
            deal_value: total
          });
        }
      } else if (original.status !== data.status && data.status === 'Rejected' && data.lead_id) {
        await logActivity('Quotation Rejected', `Quotation ${data.quotation_no} rejected`, data.lead_id);
      }

      return data;
    } catch (err) {
      console.error('Update quotation error:', err);
      toast.error(formatError(err, 'Failed to update quotation'));
      throw err;
    }
  };

  const deleteQuotation = async (id) => {
    if (!client || !user) return false;
    try {
      const original = quotations.find(q => q.id === id);
      if (!original) throw new Error('Quotation not found');

      const { error } = await client
        .from('crm_quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuotations(prev => prev.filter(q => q.id !== id));
      toast.success(`Quotation ${original.quotation_no} deleted`);
      return true;
    } catch (err) {
      console.error('Delete quotation error:', err);
      toast.error(err.message || 'Failed to delete quotation');
      return false;
    }
  };

  // ==========================================
  // NOTIFICATIONS HELPERS
  // ==========================================
  const markNotificationRead = async (id) => {
    if (!client || !user) return;
    try {
      const { data, error } = await client
        .from('crm_notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? data : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!client || !user) return;
    try {
      const { error } = await client
        .from('crm_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  };

  // ==========================================
  // WHATSAPP LOG CRUD
  // ==========================================
  const addWhatsAppLog = async (logData) => {
    if (!client || !user) return null;
    try {
      const payload = {
        ...logData,
        user_id: user.id
      };
      const { data, error } = await client
        .from('crm_whatsapp_log')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      setWhatsappLogs(prev => [data, ...prev]);

      if (logData.lead_id) {
        await logActivity('WhatsApp Message Sent', `Sent message to ${logData.phone}: "${logData.message.substring(0, 60)}..."`, logData.lead_id);
      }
      return data;
    } catch (err) {
      console.error('Add WhatsApp log error:', err);
      return null;
    }
  };

  // ==========================================
  // ANALYTICS & DERIVED DATA (METRICS)
  // ==========================================
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => !['Converted', 'Rejected'].includes(l.status));
    
    // Converted rate
    const converted = leads.filter(l => l.status === 'Converted').length;
    const conversionRate = totalLeads === 0 ? 0 : Math.round((converted / totalLeads) * 100);

    // Deal value
    const pipelineValue = activeLeads.reduce((sum, l) => sum + (parseFloat(l.deal_value) || 0), 0);
    const revenueWon = leads
      .filter(l => l.status === 'Converted')
      .reduce((sum, l) => sum + (parseFloat(l.won_amount) || parseFloat(l.deal_value) || 0), 0);

    // Follow-ups
    const todayStr = new Date().toISOString().split('T')[0];
    const followupsDue = tasks.filter(t => t.status !== 'Completed' && t.due_date <= todayStr).length;

    // Average Deal Size
    const avgDealSize = converted === 0 ? 0 : Math.round(revenueWon / converted);

    // Lead response time (simulated average from activity log/lead created)
    let avgResponseTime = 1.2; // default fallback in days
    
    return {
      totalLeads,
      activeLeads: activeLeads.length,
      conversionRate,
      pipelineValue,
      revenueWon,
      followupsDue,
      avgDealSize,
      avgResponseTime
    };
  }, [leads, tasks]);

  const contextValue = {
    loading,
    leads,
    stages,
    settings,
    team,
    tasks,
    notifications,
    whatsappLogs,
    quotations,
    activities,
    metrics,
    
    // Auth info
    isSignedIn,
    userId: user?.id || null,
    
    // Leads
    addLead,
    updateLead,
    deleteLead,
    
    // Stages
    addStage,
    deleteStage,
    
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    
    // Team Members
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    
    // Settings
    updateSettings,
    
    // Quotations
    addQuotation,
    updateQuotation,
    deleteQuotation,
    
    // Notifications
    markNotificationRead,
    markAllNotificationsRead,
    addNotification,
    
    // WhatsApp Logs
    addWhatsAppLog,
    
    // Manual Refresh
    refreshData: loadCRMData,
    logActivity
  };

  return (
    <CRMContext.Provider value={contextValue}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
