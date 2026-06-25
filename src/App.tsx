import React, { useState, useEffect } from 'react';
import { getSupabase, getConnectionMode, setConnectionMode, mockSupabaseInstance } from './supabase';
import { JobApplication, ApplicationStatus } from './types';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './components/ApplicationForm';
import SupabaseSettings from './components/SupabaseSettings';
import SupabaseSetupGuide from './components/SupabaseSetupGuide';
import AuthModal from './components/AuthModal';
import { Plus, SlidersHorizontal, Settings, Key, Terminal, RefreshCw, LogIn, ExternalLink } from 'lucide-react';

export default function App() {
  // Session & Auth state
  const [session, setSession] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>('guest-user');
  const [activePage, setActivePage] = useState<'login' | 'signup' | 'dashboard'>('dashboard');

  // Applications CRUD state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals Visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Connection Indicator
  const [connectionMode, setConnectionModeState] = useState<'live' | 'sandbox'>(getConnectionMode());

  // Listen for Supabase Authentication state changes
  useEffect(() => {
    const supabaseClient = getSupabase();
    
    // Check current session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      } else {
        setUserId('guest-user');
        setUserEmail(null);
      }
      setActivePage('dashboard');
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      } else {
        setUserId('guest-user');
        setUserEmail(null);
        setApplications([]);
      }
      setActivePage('dashboard');
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connectionMode, refreshTrigger]);

  // Load user-specific applications from database (strictly respecting RLS)
  const fetchApplications = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const supabaseClient = session ? getSupabase() : mockSupabaseInstance;
      const { data, error } = await supabaseClient
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
      } else {
        setApplications(data || []);
      }
    } catch (err) {
      console.error('Failed to resolve database fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchApplications();
    }
  }, [userId, connectionMode]);

  // Handle Sign In trigger
  const handleSignIn = async (email: string, pass: string) => {
    const supabaseClient = getSupabase();
    const result = await supabaseClient.auth.signInWithPassword({
      email,
      password: pass,
    });
    return result;
  };

  // Handle Sign Up trigger
  const handleSignUp = async (email: string, pass: string) => {
    const supabaseClient = getSupabase();
    const result = await supabaseClient.auth.signUp({
      email,
      password: pass,
    });
    return result;
  };

  // Handle Sign Out trigger
  const handleSignOut = async () => {
    const supabaseClient = getSupabase();
    await supabaseClient.auth.signOut();
    setSession(null);
    setUserId('guest-user');
    setUserEmail(null);
    setApplications([]);
    setActivePage('dashboard');
  };

  // Create or Update Application
  const handleFormSubmit = async (formData: any) => {
    if (!userId) return;

    const supabaseClient = session ? getSupabase() : mockSupabaseInstance;
    const isEditing = !!formData.id;

    if (isEditing) {
      // UPDATE
      const { id, ...updateFields } = formData;
      const { data, error } = await supabaseClient
        .from('applications')
        .update(updateFields)
        .eq('id', id)
        .eq('user_id', userId); // Enforces RLS verification

      if (error) {
        alert(`Error updating opportunity: ${error.message}`);
      } else {
        fetchApplications();
      }
    } else {
      // INSERT
      const { data, error } = await supabaseClient
        .from('applications')
        .insert({
          ...formData,
          user_id: userId,
        });

      if (error) {
        alert(`Error inserting opportunity: ${error.message}`);
      } else {
        fetchApplications();
      }
    }
  };

  // Delete Application
  const handleDeleteApplication = async (id: string) => {
    if (!userId) return;
    const supabaseClient = session ? getSupabase() : mockSupabaseInstance;
    const { error } = await supabaseClient
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Enforces RLS verification

    if (error) {
      alert(`Error deleting record: ${error.message}`);
    } else {
      // Optimistic state update or full reload
      setApplications(prev => prev.filter(a => a.id !== id));
    }
  };

  // Quick Inline Status Change
  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    if (!userId) return;
    const supabaseClient = session ? getSupabase() : mockSupabaseInstance;
    const { error } = await supabaseClient
      .from('applications')
      .update({ application_status: newStatus })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      alert(`Error updating status: ${error.message}`);
    } else {
      // Optimistic update
      setApplications(prev => 
        prev.map(app => app.id === id ? { ...app, application_status: newStatus, updated_at: new Date().toISOString() } : app)
      );
    }
  };

  // Triggered when Supabase Connection engine parameters change
  const handleModeChanged = () => {
    setConnectionModeState(getConnectionMode());
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-800">
      
      {/* Navbar Header */}
      <Navbar
        isLoggedIn={!!session}
        userEmail={userEmail}
        userName={session?.user?.user_metadata?.full_name || null}
        onSignInClick={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSchema={() => setIsSchemaOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Dashboard
          applications={applications}
          onAddApplication={() => {
            setEditingApp(null);
            setIsFormOpen(true);
          }}
          onEditApplication={(app) => {
            setEditingApp(app);
            setIsFormOpen(true);
          }}
          onDeleteApplication={handleDeleteApplication}
          onStatusChange={handleStatusChange}
          userEmail={userEmail}
          onRefresh={fetchApplications}
          isLoading={isLoading}
          onSignInClick={() => setIsAuthOpen(true)}
        />
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-sans font-semibold tracking-tight text-gray-700">JobPulse Tracker</span>
            <span className="text-gray-300">|</span>
            <span>Production Grade Pipeline OS</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="rounded bg-gray-100 border border-gray-150 px-2 py-0.5 text-gray-600 font-mono">
              Engine: {connectionMode === 'live' ? 'Supabase Live' : 'Sandbox (WebStorage)'}
            </span>
            <button
              onClick={() => setIsSchemaOpen(true)}
              className="text-blue-600 hover:underline flex items-center space-x-1"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Get Postgres Schema & RLS SQL</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: Add/Edit Job Application */}
      <ApplicationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApp(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingApp}
      />

      {/* MODAL: Database Settings / Connection keys config */}
      <SupabaseSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onModeChanged={handleModeChanged}
      />

      {/* MODAL: SQL setup exporter guide */}
      <SupabaseSetupGuide
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
      />

      {/* MODAL: Supabase Auth (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    </div>
  );
}
