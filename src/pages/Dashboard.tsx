import React, { useState, useMemo } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import ApplicationCard from '../components/ApplicationCard';
import { 
  Plus, Search, SlidersHorizontal, Layers, CheckCircle2, AlertCircle, XCircle, FileClock, 
  HelpCircle, ChevronDown, Calendar, ArrowUpDown, RefreshCw, Sparkles, AlertTriangle
} from 'lucide-react';
import { seedSandboxData, getConnectionMode } from '../supabase';

interface DashboardProps {
  applications: JobApplication[];
  onAddApplication: () => void;
  onEditApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  userEmail: string | null;
  onRefresh: () => void;
  isLoading: boolean;
  onSignInClick: () => void;
}

type SortOption = 'newest' | 'oldest' | 'company' | 'title';
type DateFilterOption = 'all' | 'week' | 'month' | 'quarter';

export default function Dashboard({ 
  applications, 
  onAddApplication, 
  onEditApplication, 
  onDeleteApplication, 
  onStatusChange,
  userEmail,
  onRefresh,
  isLoading,
  onSignInClick
}: DashboardProps) {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const connectionMode = getConnectionMode();

  // Statistics calculation
  const stats = useMemo(() => {
    const counts = {
      total: applications.length,
      Applied: 0,
      Interview: 0,
      Assessment: 0,
      Offer: 0,
      Rejected: 0,
      Withdrawn: 0
    };

    applications.forEach(app => {
      if (counts[app.application_status] !== undefined) {
        counts[app.application_status]++;
      }
    });

    return counts;
  }, [applications]);

  // Filtered applications list
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // 1. Search Query (Filter by Company, Title, Location, or Description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(app => 
        app.company_name.toLowerCase().includes(query) ||
        app.job_title.toLowerCase().includes(query) ||
        (app.location && app.location.toLowerCase().includes(query)) ||
        (app.notes && app.notes.toLowerCase().includes(query))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(app => app.application_status === statusFilter);
    }

    // 3. Date Filter
    if (dateFilter !== 'all') {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      
      result = result.filter(app => {
        const createdTime = new Date(app.created_at).getTime();
        const diffDays = (now - createdTime) / oneDay;

        if (dateFilter === 'week') return diffDays <= 7;
        if (dateFilter === 'month') return diffDays <= 30;
        if (dateFilter === 'quarter') return diffDays <= 90;
        return true;
      });
    }

    // 4. Sort Logic
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'company') {
        return a.company_name.localeCompare(b.company_name);
      }
      if (sortBy === 'title') {
        return a.job_title.localeCompare(b.job_title);
      }
      return 0;
    });

    return result;
  }, [applications, searchQuery, statusFilter, dateFilter, sortBy]);

  // Trigger quick seed for Mock Sandbox
  const handleSeedData = () => {
    if (userEmail) {
      seedSandboxData(userEmail);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Guest Mode Alert Notice */}
      {!userEmail ? (
        <div className="rounded-xl border border-indigo-150 bg-indigo-50/40 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 animate-fadeIn">
          <div className="flex items-start space-x-3 text-indigo-900">
            <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold block text-sm">✨ Experiencing JobPulse in Guest Mode</span>
              <p className="mt-0.5 text-indigo-700">
                You are currently in guest mode. Any job opportunities you track are saved in your local browser sandbox and won't sync to the cloud. Click Sign In to connect your Supabase account and persist your records permanently.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {applications.length === 0 && (
              <button
                onClick={() => {
                  seedSandboxData('guest-user');
                  onRefresh();
                }}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-all cursor-pointer shadow-xs"
                id="dash-seed-guest"
              >
                Seed Guest Samples
              </button>
            )}
            <button
              onClick={onSignInClick}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-sm"
              id="dash-guest-signin"
            >
              <span>Sign In to Cloud</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sandbox Alert Notice */
        connectionMode === 'sandbox' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-start space-x-3 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block text-sm">💡 Offline Local Sandbox Active</span>
                <p className="mt-0.5 text-amber-700">
                  You are playing with a fully simulated database saved in your local browser sandbox. All auth checks, data inserts, status updates, and deletions follow standard PostgreSQL Row-Level Security! Paste your real Supabase parameters inside settings to sync live.
                </p>
              </div>
            </div>
            {applications.length === 0 && (
              <button
                onClick={handleSeedData}
                className="self-start sm:self-center flex items-center space-x-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                id="dash-seed-sandbox"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Seed Mock Applications</span>
              </button>
            )}
          </div>
        )
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {/* Total applications */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Tracked</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-slate-900">
              {stats.total < 10 ? `0${stats.total}` : stats.total}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">jobs</span>
          </div>
        </div>

        {/* Applied */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Applied</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-indigo-600">
              {stats.Applied < 10 ? `0${stats.Applied}` : stats.Applied}
            </span>
            <span className="text-[10px] text-indigo-400 font-medium font-mono">pending</span>
          </div>
        </div>

        {/* Interviewing */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block mb-1">Interview</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-amber-500">
              {stats.Interview < 10 ? `0${stats.Interview}` : stats.Interview}
            </span>
            <span className="text-[10px] text-amber-400 font-medium font-mono">scheduled</span>
          </div>
        </div>

        {/* Assessment */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block mb-1">Assessment</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-purple-600">
              {stats.Assessment < 10 ? `0${stats.Assessment}` : stats.Assessment}
            </span>
            <span className="text-[10px] text-purple-400 font-medium font-mono">tests</span>
          </div>
        </div>

        {/* Offers */}
        <div className="rounded-xl border border-slate-200 bg-emerald-50/20 p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Offers</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-emerald-600">
              {stats.Offer < 10 ? `0${stats.Offer}` : stats.Offer}
            </span>
            <span className="text-[10px] text-emerald-500 font-medium">won 🎉</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Rejected</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-rose-600">
              {stats.Rejected < 10 ? `0${stats.Rejected}` : stats.Rejected}
            </span>
            <span className="text-[10px] text-rose-400 font-medium">stopped</span>
          </div>
        </div>

        {/* Withdrawn */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Withdrawn</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="font-mono text-3xl font-bold text-slate-700">
              {stats.Withdrawn < 10 ? `0${stats.Withdrawn}` : stats.Withdrawn}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">closed</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter, Search and Sort Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, job title, location, key skills..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="dash-search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-900 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Selector */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'All')}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="dash-filter-status"
              >
                <option value="All">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Assessment">Assessment</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Added:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="dash-filter-date"
              >
                <option value="all">Anytime</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
                <option value="quarter">Past 90 Days</option>
              </select>
            </div>

            {/* Sorter */}
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="dash-sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="company">Company (A-Z)</option>
                <option value="title">Job Title (A-Z)</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Refresh database"
              id="dash-refresh-button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* Main Dashboard Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans text-base font-bold text-slate-900 uppercase tracking-wide">
              Applications Tracker List
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Showing {filteredApplications.length} of {applications.length} logged opportunities.
            </p>
          </div>

          <button
            onClick={onAddApplication}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold transition-all shadow-sm"
            id="dash-add-new-button"
          >
            <Plus className="h-4 w-4" />
            <span>Add Application</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-semibold text-slate-500 font-mono">Fetching applications secure records...</p>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onEdit={onEditApplication}
                onDelete={onDeleteApplication}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        ) : (
          /* Empty state view */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-150">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-sans text-base font-bold text-slate-900 uppercase tracking-wide">
              {applications.length === 0 ? 'Start your tracking journey' : 'No matches found'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
              {applications.length === 0 
                ? 'Create your very first application. Log interview stages, salary estimates, locations, and personal task logs easily.'
                : 'Try adjusting your search terms or filter constraints to see other applications.'}
            </p>
            {applications.length === 0 ? (
              <div className="mt-6 flex items-center justify-center space-x-3">
                {connectionMode === 'sandbox' && (
                  <button
                    onClick={handleSeedData}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                    id="dash-empty-seed"
                  >
                    Load Sandbox Samples
                  </button>
                )}
                <button
                  onClick={onAddApplication}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer shadow-sm transition-all"
                  id="dash-empty-add"
                >
                  Create Application Card
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setDateFilter('all');
                }}
                className="mt-4 rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                id="dash-clear-all-filters"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
