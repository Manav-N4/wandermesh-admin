import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import type { Lead, LeadStatus } from './types/lead';
import AuthGate from './components/AuthGate';
import StatsSection from './components/StatsSection';
import FiltersBar from './components/FiltersBar';
import LeadCard from './components/LeadCard';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null means checking session
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [tripFilter, setTripFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  
  // Tracking new lead
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // 1. Check for initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchLeads = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    setRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        setError(`Supabase error: ${error.message}`);
      } else {
        const enrichedLeads = (data || []).map((l: any) => ({
          ...l,
          status: l.status || 'New'
        }));
        setLeads(enrichedLeads);
        setError(null);
        setLastRefreshedAt(new Date());
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Network error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) {
      fetchLeads();
      const interval = setInterval(() => fetchLeads(true), 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchLeads]);

  const handleStatusChange = (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Safe string conversion for search fields
      const name = l.name?.toLowerCase() || '';
      const phone = l.phone || '';
      const insta = l.insta_id?.toLowerCase() || '';
      const trip = l.trip?.toLowerCase() || '';
      
      const searchTerm = search.toLowerCase();

      const matchesSearch = 
        name.includes(searchTerm) || 
        phone.includes(search) ||
        insta.includes(searchTerm);
      
      const matchesTrip = tripFilter === 'All' || trip.includes(tripFilter.toLowerCase());
      
      const matchesGender = genderFilter === 'All' || l.gender === genderFilter;
      
      return matchesSearch && matchesTrip && matchesGender;
    });
  }, [leads, search, tripFilter, genderFilter]);

  const tripCounts = useMemo(() => {
    const counts = { Vietnam: 0, Bali: 0, BLR: 0 };
    leads.forEach(l => {
      const t = l.trip?.toLowerCase() || '';
      if (t.includes('vietnam')) counts.Vietnam++;
      else if (t.includes('bali')) counts.Bali++;
      else if (t.includes('blr') || t.includes('bangalore')) counts.BLR++;
    });
    return counts;
  }, [leads]);

  // Loading state while checking session
  if (isAuthenticated === null) {
    return (
      <div className="dashboard-loading-screen">
        <div className="loader"></div>
        <p>Verifying session...</p>
        <style>{`
          .dashboard-loading-screen {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #64748b;
            font-weight: 500;
          }
          .loader {
            width: 32px;
            height: 32px;
            border: 3px solid #f1f5f9;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return <AuthGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-dot"></span>
            <h1>WanderMesh Admin</h1>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">Leads</span>
          </div>
          <div className="header-actions">
            <span className="last-refresh">Last update: {lastRefreshedAt.toLocaleTimeString()}</span>
            <button className="logout-btn" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="summary-section">
          <StatsSection total={leads.length} tripCounts={tripCounts} />
        </section>

        <section className="listing-section">
          <FiltersBar 
            search={search} setSearch={setSearch}
            tripFilter={tripFilter} setTripFilter={setTripFilter}
            genderFilter={genderFilter} setGenderFilter={setGenderFilter}
            onRefresh={() => fetchLeads()}
            isRefreshing={refreshing}
          />

          {error ? (
            <div className="error-state">
              <div className="error-emoji">⚠️</div>
              <h3>Unable to load leads</h3>
              <p>{error}</p>
              <button onClick={() => fetchLeads()} className="refresh-btn mt-4">Try Again</button>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Fetching leads...</p>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="leads-grid">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead, idx) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onStatusChange={handleStatusChange}
                    isNew={idx === 0 && (new Date().getTime() - new Date(lead.created_at).getTime() < 600000)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-indicator">?</div>
              <h3>No leads found</h3>
              <p>The "leads" table appears to be empty or does not exist.</p>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .dashboard-wrapper {
          min-height: 100vh;
          width: 100%;
          background: #f8fafc;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-dot {
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border-radius: 50%;
        }

        .brand h1 {
          font-size: 1rem;
          margin: 0;
          color: #1e293b;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .breadcrumb-divider {
          color: #cbd5e1;
        }

        .breadcrumb-current {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .last-refresh {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .logout-btn {
          color: #64748b;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          text-transform: uppercase;
          transition: all 0.2s;
          cursor: pointer;
        }

        .logout-btn:hover {
          color: #ef4444;
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .dashboard-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .leads-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .loading-state, .empty-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 0;
          color: #64748b;
          background: white;
          border-radius: 24px;
          border: 1px dashed #e2e8f0;
        }

        .error-state {
          border-color: #fca5a5;
          background: #fffafa;
        }

        .error-emoji { font-size: 2rem; margin-bottom: 1rem; }
        .error-state p { color: #ef4444; font-weight: 500; margin-top: 8px; }

        .loader {
          width: 32px;
          height: 32px;
          border: 3px solid #f1f5f9;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .empty-indicator {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: #cbd5e1;
          margin-bottom: 1rem;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .leads-grid { grid-template-columns: 1fr; }
          .header-actions .last-refresh { display: none; }
        }
      `}</style>
    </div>
  );
}

export default App;
