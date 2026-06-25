import React from 'react';
import { motion } from 'motion/react';
import { Database, LogOut, LogIn, Settings, Key, Terminal, User, BookOpen } from 'lucide-react';
import { getConnectionMode } from '../supabase';

interface NavbarProps {
  isLoggedIn: boolean;
  userEmail: string | null;
  userName: string | null;
  onSignInClick: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenSchema: () => void;
}

export default function Navbar({ 
  isLoggedIn, 
  userEmail, 
  userName, 
  onSignInClick, 
  onSignOut, 
  onOpenSettings, 
  onOpenSchema 
}: NavbarProps) {
  const mode = getConnectionMode();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md shadow-xs animate-fadeIn">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Pulsing Indicator */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <span className="font-sans text-xl font-bold">JP</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border border-white"></span>
            </span>
          </div>
          <div>
            <span className="font-sans text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Job<span className="text-indigo-600">Pulse</span>
            </span>
            <div className="text-[10px] font-mono text-slate-500 leading-none">Job Tracking OS</div>
          </div>
        </div>

        {/* Action Controls and Session Badges */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Connection Mode Status Pill */}
          <div className="hidden items-center rounded-full bg-slate-50 border border-slate-200 p-1 pl-2.5 pr-1.5 sm:flex">
            <div className="flex items-center space-x-2">
              <span className={`h-2 w-2 rounded-full ${mode === 'live' ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className="font-mono text-xs font-semibold text-slate-600">
                {mode === 'live' ? 'Live Supabase' : 'Sandbox (Local)'}
              </span>
            </div>
            <button
              onClick={onOpenSettings}
              className="ml-2 rounded-md p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Configure Database Connection"
              id="navbar-open-settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Database Schema DDL / Guide button */}
          <button
            onClick={onOpenSchema}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Database Table Schema & RLS Setup SQL"
            id="navbar-open-schema"
          >
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span className="hidden md:inline">Supabase Setup SQL</span>
          </button>

          {/* User Sign In or Signed In Status Indicators */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3 md:pl-4">
              <div className="hidden flex-col items-end md:flex">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {userName ? userName : 'Active Session'}
                </span>
                <span className="max-w-[150px] truncate font-mono text-xs font-medium text-slate-700" title={userEmail || ''}>
                  {userEmail}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-mono text-xs font-bold uppercase">
                {userName ? userName[0] : (userEmail ? userEmail[0] : 'U')}
              </div>
              <button
                onClick={onSignOut}
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                title="Sign Out"
                id="navbar-signout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="border-l border-slate-200 pl-3 md:pl-4">
              <button
                onClick={onSignInClick}
                className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
                id="navbar-signin"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection Indicator banner for mobile */}
      <div className="flex justify-between items-center border-t border-gray-100 bg-amber-50/50 px-4 py-1.5 sm:hidden">
        <span className="text-[11px] font-medium text-amber-800 flex items-center space-x-1">
          <span className={`h-1.5 w-1.5 rounded-full ${mode === 'live' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
          <span>Mode: {mode === 'live' ? 'Live Supabase' : 'Local Sandbox'}</span>
        </span>
        <button
          onClick={onOpenSettings}
          className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center space-x-1"
        >
          <Settings className="h-3 w-3" />
          <span>Configure</span>
        </button>
      </div>
    </header>
  );
}
