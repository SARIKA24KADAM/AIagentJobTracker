import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { JobApplication, SupabaseConfig } from './types';

// Let's check local storage for manually configured credentials first
const STORAGE_PREFIX = 'jobpulse_';
const CONFIG_KEY = `${STORAGE_PREFIX}supabase_config`;
const MODE_KEY = `${STORAGE_PREFIX}mode`; // 'live' or 'sandbox'

export function getSavedConfig(): SupabaseConfig | null {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved config', e);
  }

  // Fallback to environment variables
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envAnonKey) {
    return { url: envUrl, anonKey: envAnonKey };
  }

  return null;
}

export function saveConfig(config: SupabaseConfig | null) {
  if (config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(MODE_KEY, 'live');
  } else {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.setItem(MODE_KEY, 'sandbox');
  }
}

export function getConnectionMode(): 'live' | 'sandbox' {
  const savedMode = localStorage.getItem(MODE_KEY);
  if (savedMode === 'live' && getSavedConfig()) {
    return 'live';
  }
  return 'sandbox';
}

export function setConnectionMode(mode: 'live' | 'sandbox') {
  localStorage.setItem(MODE_KEY, mode);
}

// ==========================================
// MOCK SUPABASE ENGINE (Local RLS Sandbox)
// ==========================================

class MockAuth {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    // Sync tab auth
    window.addEventListener('storage', (e) => {
      if (e.key === `${STORAGE_PREFIX}session`) {
        this.trigger('SIGNED_IN', this.getSessionSync());
      }
    });
  }

  private getSessionSync() {
    try {
      const sess = localStorage.getItem(`${STORAGE_PREFIX}session`);
      return sess ? JSON.parse(sess) : null;
    } catch {
      return null;
    }
  }

  async getSession() {
    const session = this.getSessionSync();
    return { data: { session }, error: null };
  }

  async signUp({ email, password }: any) {
    try {
      const usersRaw = localStorage.getItem(`${STORAGE_PREFIX}users`) || '[]';
      const users = JSON.parse(usersRaw);

      if (users.some((u: any) => u.email === email)) {
        return { data: { user: null }, error: { message: 'User already exists.' } };
      }

      const newUser = { id: 'mock-user-' + Math.random().toString(36).substring(2, 9), email, password };
      users.push(newUser);
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users));

      const session = {
        access_token: 'mock-token-' + Math.random().toString(),
        user: { id: newUser.id, email: newUser.email }
      };
      localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(session));
      this.trigger('SIGNED_IN', session);

      return { data: { user: session.user, session }, error: null };
    } catch (e: any) {
      return { data: { user: null }, error: { message: e.message } };
    }
  }

  async signInWithPassword({ email, password }: any) {
    try {
      const usersRaw = localStorage.getItem(`${STORAGE_PREFIX}users`) || '[]';
      const users = JSON.parse(usersRaw);

      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        return { data: { session: null }, error: { message: 'Invalid email or password.' } };
      }

      const session = {
        access_token: 'mock-token-' + Math.random().toString(),
        user: { id: user.id, email: user.email }
      };
      localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(session));
      this.trigger('SIGNED_IN', session);

      return { data: { user: session.user, session }, error: null };
    } catch (e: any) {
      return { data: { session: null }, error: { message: e.message } };
    }
  }

  async signOut() {
    localStorage.removeItem(`${STORAGE_PREFIX}session`);
    this.trigger('SIGNED_OUT', null);
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    // Trigger initial state
    const currentSession = this.getSessionSync();
    callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  private trigger(event: string, session: any) {
    this.listeners.forEach(l => l(event, session));
  }
}

class MockQueryBuilder {
  private table: string;
  private filters: Array<{ col: string; op: string; val: any }> = [];
  private orderCol: string | null = null;
  private orderAscending = false;
  private updateData: any = null;
  private isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*') {
    // Returns self for chainability
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val });
    return this;
  }

  order(col: string, { ascending = false } = {}) {
    this.orderCol = col;
    this.orderAscending = ascending;
    return this;
  }

  update(updates: any) {
    this.updateData = updates;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  // Executes query (handles select, update, and delete)
  async then(onfulfilled: (value: { data: any[] | null; error: any }) => any) {
    try {
      if (this.table !== 'applications') {
        return onfulfilled({ data: [], error: null });
      }

      const appsRaw = localStorage.getItem(`${STORAGE_PREFIX}applications`) || '[]';
      let apps: JobApplication[] = JSON.parse(appsRaw);

      if (this.isDelete) {
        // Execute deletion
        const targetUserFilter = this.filters.find(f => f.col === 'user_id');
        const targetIdFilter = this.filters.find(f => f.col === 'id');

        if (!targetUserFilter) {
          return onfulfilled({ data: null, error: { message: 'RLS Violation: user_id criteria is required for delete.' } });
        }

        const filteredApps = apps.filter((app: any) => {
          const matchesUser = String(app.user_id) === String(targetUserFilter.val);
          const matchesId = targetIdFilter ? String(app.id) === String(targetIdFilter.val) : true;
          // Keep records that don't match both filters (i.e., we are deleting the matched ones)
          return !(matchesUser && matchesId);
        });

        localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify(filteredApps));
        return onfulfilled({ data: [], error: null });
      }

      if (this.updateData !== null) {
        // Execute update
        const targetUserFilter = this.filters.find(f => f.col === 'user_id');
        const targetIdFilter = this.filters.find(f => f.col === 'id');

        if (!targetUserFilter) {
          return onfulfilled({ data: null, error: { message: 'RLS Violation: user_id criteria is required for update.' } });
        }

        let updatedRecord: any = null;
        apps = apps.map((app: any) => {
          const matchesUser = String(app.user_id) === String(targetUserFilter.val);
          const matchesId = targetIdFilter ? String(app.id) === String(targetIdFilter.val) : true;

          if (matchesUser && matchesId) {
            updatedRecord = {
              ...app,
              ...this.updateData,
              updated_at: new Date().toISOString()
            };
            return updatedRecord;
          }
          return app;
        });

        localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify(apps));
        return onfulfilled({ data: updatedRecord ? [updatedRecord] : [], error: null });
      }

      // Execute select
      // Apply Row-Level Security (RLS) Filter:
      // Filter out records that don't match standard filter queries (like user_id)
      for (const filter of this.filters) {
        if (filter.op === 'eq') {
          apps = apps.filter((item: any) => String(item[filter.col]) === String(filter.val));
        }
      }

      // Order
      if (this.orderCol) {
        const col = this.orderCol;
        const asc = this.orderAscending;
        apps.sort((a: any, b: any) => {
          const valA = a[col] || '';
          const valB = b[col] || '';
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }

      return onfulfilled({ data: apps, error: null });
    } catch (e: any) {
      return onfulfilled({ data: null, error: { message: e.message } });
    }
  }

  async insert(record: any) {
    try {
      const appsRaw = localStorage.getItem(`${STORAGE_PREFIX}applications`) || '[]';
      const apps = JSON.parse(appsRaw);

      const newRecord: JobApplication = {
        id: record.id || 'mock-app-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...record
      };

      apps.push(newRecord);
      localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify(apps));

      return {
        select: () => ({
          single: async () => ({ data: newRecord, error: null })
        }),
        data: [newRecord],
        error: null
      };
    } catch (e: any) {
      return { select: () => ({ single: async () => ({ data: null, error: e }) }), data: null, error: e };
    }
  }
}

export const mockSupabaseInstance = {
  auth: new MockAuth(),
  from: (table: string) => new MockQueryBuilder(table)
};

// ==========================================
// EXPORTS & DYNAMIC CLIENT SELECTION
// ==========================================

let realSupabaseClient: SupabaseClient | null = null;

export function getSupabase() {
  const mode = getConnectionMode();
  if (mode === 'live') {
    const config = getSavedConfig();
    if (config) {
      try {
        if (!realSupabaseClient) {
          realSupabaseClient = createClient(config.url, config.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true
            }
          });
        }
        return realSupabaseClient;
      } catch (err) {
        console.error('Error creating real Supabase client, falling back to mock sandbox', err);
        return mockSupabaseInstance as unknown as SupabaseClient;
      }
    }
  }
  return mockSupabaseInstance as unknown as SupabaseClient;
}

// Reset instance when settings change
export function resetSupabaseClient() {
  realSupabaseClient = null;
}

// Seed helper for mock sandbox to make it immediately fun and active!
export function seedSandboxData(userId: string) {
  const appsRaw = localStorage.getItem(`${STORAGE_PREFIX}applications`);
  if (!appsRaw || JSON.parse(appsRaw).length === 0) {
    const sampleApps: JobApplication[] = [
      {
        id: 'seed-1',
        user_id: userId,
        company_name: 'Stripe',
        job_title: 'Senior Software Engineer (Full Stack)',
        salary_range: '$140k - $180k',
        location: 'Remote (San Francisco)',
        job_description: 'We are looking for a Senior engineer to build user facing dashboards. Key tech: React, TypeScript, Node.js, PostgreSQL.',
        application_status: 'Interview',
        notes: 'Spoke with recruiter Sarah. Tech interview scheduled next Wednesday at 2pm. Need to brush up on SQL optimization and system design.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'seed-2',
        user_id: userId,
        company_name: 'Linear',
        job_title: 'Product Engineer',
        salary_range: '$150k - $200k',
        location: 'Hybrid',
        job_description: 'Build fast, beautiful tools for product development. Experience with React, TypeScript, high performance web rendering, Rust, and sync mechanisms.',
        application_status: 'Applied',
        notes: 'Submitted resume and portfolio. Really love their product design and alignment to speed.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'seed-3',
        user_id: userId,
        company_name: 'Supabase',
        job_title: 'Developer Relations Engineer',
        salary_range: '$110k - $140k',
        location: 'Remote',
        job_description: 'Write tech guides, create sample apps, and engage with the open-source community. Key skills: Next.js, PostgreSQL, Supabase Auth, Drizzle, Docker.',
        application_status: 'Offer',
        notes: 'Received written offer! Compensation is very competitive and includes standard stock options. Deadline is end of next week.',
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'seed-4',
        user_id: userId,
        company_name: 'Netflix',
        job_title: 'Senior Frontend Architect',
        salary_range: '$300k - $450k',
        location: 'On-site (Los Gatos)',
        job_description: 'Design the core UI experiences for streaming players. Heavy focus on React performance, asset buffering, and telemetry pipelines.',
        application_status: 'Assessment',
        notes: 'Completed the take-home design document. Awaiting feedback from engineering director.',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify(sampleApps));
  }
}
