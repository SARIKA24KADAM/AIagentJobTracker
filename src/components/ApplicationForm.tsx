import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { parseJobDescription, ParsedJobInfo } from '../utils/parser';
import { X, Sparkles, Building2, Briefcase, MapPin, DollarSign, FileText, Check, AlertCircle } from 'lucide-react';

interface ApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  initialData?: JobApplication | null;
}

const ALL_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Assessment', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationForm({ isOpen, onClose, onSubmit, initialData }: ApplicationFormProps) {
  // Main form fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [location, setLocation] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');

  // Parser preview state
  const [parsedInfo, setParsedInfo] = useState<ParsedJobInfo | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // Sync initialData if editing
  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.company_name || '');
      setJobTitle(initialData.job_title || '');
      setSalaryRange(initialData.salary_range || '');
      setLocation(initialData.location || '');
      setJobDescription(initialData.job_description || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.application_status || 'Applied');
    } else {
      // Clear form
      setCompanyName('');
      setJobTitle('');
      setSalaryRange('');
      setLocation('');
      setJobDescription('');
      setNotes('');
      setStatus('Applied');
    }
    setParsedInfo(null);
    setParseNotice(null);
  }, [initialData, isOpen]);

  // Handle live job description analysis
  const handleDescriptionChange = (text: string) => {
    setJobDescription(text);
    if (!text.trim()) {
      setParsedInfo(null);
      return;
    }

    // Parse immediately for preview
    const parsed = parseJobDescription(text);
    setParsedInfo(parsed);
  };

  // Apply parsed fields to the form
  const applyParsedValues = () => {
    if (!parsedInfo) return;

    let appliedCount = 0;

    if (parsedInfo.jobTitle && !jobTitle) {
      setJobTitle(parsedInfo.jobTitle);
      appliedCount++;
    }
    if (parsedInfo.salaryRange && !salaryRange) {
      setSalaryRange(parsedInfo.salaryRange);
      appliedCount++;
    }
    if (parsedInfo.location && (!location || location === 'Remote / Unspecified')) {
      setLocation(parsedInfo.location);
      appliedCount++;
    }

    if (appliedCount > 0) {
      setParseNotice(`Applied ${appliedCount} extracted attributes (Title, Salary or Location) to form! You can still edit them manually.`);
    } else {
      // Force apply even if they are filled
      if (parsedInfo.jobTitle) setJobTitle(parsedInfo.jobTitle);
      if (parsedInfo.salaryRange) setSalaryRange(parsedInfo.salaryRange);
      if (parsedInfo.location) setLocation(parsedInfo.location);
      setParseNotice(`Overwrote fields with extracted values.`);
    }

    setTimeout(() => {
      setParseNotice(null);
    }, 5000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return alert('Company Name is required.');
    if (!jobTitle.trim()) return alert('Job Title is required.');

    onSubmit({
      id: initialData?.id,
      company_name: companyName.trim(),
      job_title: jobTitle.trim(),
      salary_range: salaryRange.trim(),
      location: location.trim() || 'Remote',
      job_description: jobDescription.trim(),
      notes: notes.trim(),
      application_status: status
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        id="application-form-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
          <div>
            <h2 className="font-sans text-lg font-bold text-slate-900 uppercase tracking-wide">
              {initialData ? 'Edit Job Application' : 'Add New Job Application'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialData ? 'Update status, interview notes and company metrics.' : 'Track a new opportunity in your job hunt pipeline.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            id="form-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Company Name *</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Google, Stripe, Supabase..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="form-company"
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span>Job Title *</span>
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Full Stack Engineer..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="form-title"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote, San Francisco, Hybrid..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="form-location"
              />
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span>Salary Range</span>
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="$120k - $150k, £80/hr..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="form-salary"
              />
            </div>

            {/* Application Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Application Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="form-status"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Description (with Local Parser Card) */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Job Description / Requirement Text</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Paste job posting text here to extract key location, salary range, job title, and core skills instantly..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="form-description"
            />

            {/* Interactive Local Parser Preview */}
            {parsedInfo && (
              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800">
                    <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                    <span>Local Zero-AI Job Scanner detected parameters:</span>
                  </span>
                  <button
                    type="button"
                    onClick={applyParsedValues}
                    className="flex items-center space-x-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                    id="form-apply-parsed"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Apply Extracted Values</span>
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase">Detected Title</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {parsedInfo.jobTitle || <span className="italic text-slate-400">Not found</span>}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase">Detected Salary</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {parsedInfo.salaryRange || <span className="italic text-gray-400">Not found</span>}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase">Detected Location</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {parsedInfo.location || <span className="italic text-slate-400">Not found</span>}
                    </span>
                  </div>
                </div>

                {parsedInfo.detectedSkills.length > 0 && (
                  <div className="mt-2.5">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase mb-1">Keywords / Skills identified:</span>
                    <div className="flex flex-wrap gap-1">
                      {parsedInfo.detectedSkills.map(skill => (
                        <span key={skill} className="rounded bg-indigo-100/80 px-2 py-0.5 font-mono text-[10px] text-indigo-800 font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {parseNotice && (
              <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                <Check className="h-4 w-4" />
                <span>{parseNotice}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Personal Notes & Reminders
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spoke with Hiring Manager... Prepared list of questions... Next interview scheduled..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="form-notes"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              id="form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              id="form-submit"
            >
              {initialData ? 'Save Changes' : 'Track Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
