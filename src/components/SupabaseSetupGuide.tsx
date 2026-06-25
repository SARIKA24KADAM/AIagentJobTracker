import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert, Terminal, HelpCircle } from 'lucide-react';

interface SupabaseSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_DDL = `-- 1. Create applications table matching schema
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  salary_range TEXT,
  location TEXT,
  job_description TEXT,
  application_status TEXT NOT NULL DEFAULT 'Applied',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS) to secure client requests
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies for secure CRUD access
-- Users must read, insert, update, or delete only their own records

CREATE POLICY "Users can only insert their own applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only read their own applications" 
ON public.applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own applications" 
ON public.applications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own applications" 
ON public.applications 
FOR DELETE 
USING (auth.uid() = user_id);`;

export default function SupabaseSetupGuide({ isOpen, onClose }: SupabaseSetupGuideProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
        id="setup-guide-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-gray-900">
                Supabase Schema & RLS Setup
              </h2>
              <p className="text-xs text-gray-500">
                Quick copy Postgres script to configure table structure and data isolation.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            id="guide-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm leading-relaxed text-gray-600">
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 flex items-start space-x-3 text-amber-900">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold">Row-Level Security (RLS) is Mandatory:</span>
              <p>
                By enabling RLS and executing the policy scripts below, Supabase automatically validates ownership. Authenticated requests from the frontend using the Anon key will fail if they try to access or write records belonging to other users.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-gray-900 flex items-center space-x-1.5">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <span>Step-by-Step SQL Configuration</span>
            </span>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>Log in to your <b>Supabase Dashboard</b> (<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a>).</li>
              <li>Select your project, and navigate to the <b>SQL Editor</b> in the left sidebar menu.</li>
              <li>Click <b>"New Query"</b>.</li>
              <li>Copy and paste the entire script below into the editor.</li>
              <li>Click <b>"Run"</b> (or press Command/Ctrl + Enter) to construct the table, set up foreign-key cascading, and secure database operations.</li>
            </ol>
          </div>

          {/* DDL Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Postgres SQL Script</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
                id="copy-sql-button"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>
            
            <pre className="rounded-xl bg-gray-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-60 border border-gray-800 leading-relaxed shadow-inner">
              {SQL_DDL}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
            id="guide-got-it"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
