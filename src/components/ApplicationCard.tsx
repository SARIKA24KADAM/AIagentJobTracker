import React, { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { Calendar, DollarSign, MapPin, Notebook, Briefcase, Trash2, Edit3, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { parseJobDescription } from '../utils/parser';

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  key?: string | number;
}

const STATUS_CONFIGS: Record<ApplicationStatus, { bg: string; text: string; border: string; dot: string }> = {
  Applied: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
  Interview: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500'
  },
  Assessment: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  Offer: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  Rejected: {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  Withdrawn: {
    bg: 'bg-slate-200',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-500'
  }
};

const ALL_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Assessment', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationCard({ application, onEdit, onDelete, onStatusChange }: ApplicationCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const statusCfg = STATUS_CONFIGS[application.application_status] || STATUS_CONFIGS.Applied;

  // Highlight extracted skills inside the description
  const { detectedSkills } = parseJobDescription(application.job_description);

  const formattedDate = new Date(application.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div 
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md"
      id={`app-card-${application.id}`}
    >
      <div>
        {/* Card Header: Job Details and Status Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1.5 font-mono text-[11px] font-semibold text-slate-500">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <span>{application.company_name}</span>
            </span>
            <h3 className="font-sans text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {application.job_title}
            </h3>
          </div>

          <div className="flex flex-col items-end space-y-1">
            {/* Status Dropdown/Badge */}
            <div className="relative inline-block">
              <select
                value={application.application_status}
                onChange={(e) => onStatusChange(application.id, e.target.value as ApplicationStatus)}
                className={`appearance-none cursor-pointer rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} pr-6 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                title="Change status"
                id={`status-select-${application.id}`}
              >
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-white text-slate-800 font-bold uppercase text-[10px]">
                    {status}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                <span className={`mr-1 h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                <svg className="h-3 w-3 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata section (Salary, Location, Date) */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3 text-xs text-slate-600">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={application.location}>
              {application.location || 'Remote / Unspecified'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-mono" title={application.salary_range}>
              {application.salary_range || 'Unspecified'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 col-span-2 mt-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Applied: <span className="font-mono text-[11px] text-slate-500">{formattedDate}</span></span>
          </div>
        </div>

        {/* Highlight Skills detected */}
        {detectedSkills.length > 0 && (
          <div className="mt-3">
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Detected Requirements:</div>
            <div className="flex flex-wrap gap-1">
              {detectedSkills.map((skill) => (
                <span 
                  key={skill} 
                  className="rounded-md bg-slate-50 border border-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes/Notes toggle */}
        {(application.notes || application.job_description) && (
          <div className="mt-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              id={`toggle-notes-${application.id}`}
            >
              <Notebook className="h-3.5 w-3.5 text-slate-400" />
              <span>{showNotes ? 'Hide details' : 'Show job description & notes'}</span>
              {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showNotes && (
              <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-100">
                {application.job_description && (
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider block font-mono">Description Excerpt</span>
                    <p className="whitespace-pre-line text-slate-600 line-clamp-4 leading-relaxed mt-0.5 font-mono text-[11px]">
                      {application.job_description}
                    </p>
                  </div>
                )}
                {application.notes && (
                  <div className="border-t border-slate-200/60 pt-2">
                    <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider block font-mono">Interview Notes & Reminders</span>
                    <p className="whitespace-pre-line text-slate-700 leading-relaxed mt-0.5">
                      {application.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Actions Panel */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center space-x-1 text-[10px] font-mono text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Updated: {new Date(application.updated_at).toLocaleDateString()}</span>
        </span>

        <div className="flex items-center space-x-2">
          {confirmDelete ? (
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-semibold text-rose-600 font-mono uppercase">Confirm?</span>
              <button
                onClick={() => {
                  onDelete(application.id);
                  setConfirmDelete(false);
                }}
                className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                id={`confirm-del-${application.id}`}
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                id={`cancel-del-${application.id}`}
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onEdit(application)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                title="Edit details"
                id={`edit-app-btn-${application.id}`}
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-rose-600 transition-colors"
                title="Delete application"
                id={`delete-app-btn-${application.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
