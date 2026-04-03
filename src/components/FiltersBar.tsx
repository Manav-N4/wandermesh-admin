

interface FiltersBarProps {
  search: string;
  setSearch: (s: string) => void;
  tripFilter: string;
  setTripFilter: (t: string) => void;
  genderFilter: string;
  setGenderFilter: (g: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const FiltersBar = ({ 
  search, setSearch, tripFilter, setTripFilter, genderFilter, setGenderFilter, onRefresh, isRefreshing 
}: FiltersBarProps) => {
  return (
    <div className="filters-bar">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters-group">
        <div className="filter-item">
          <select value={tripFilter} onChange={(e) => setTripFilter(e.target.value)}>
            <option value="All">All Trips</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Bali">Bali</option>
            <option value="BLR">BLR</option>
            <option value="Euro">Europe</option>
          </select>
        </div>

        <div className="filter-item">
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <button 
          onClick={onRefresh} 
          className="refresh-btn"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      <style>{`
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 280px;
        }

        .search-box input {
          width: 100%;
          padding: 0 16px;
          height: 48px;
          border-radius: 12px;
          font-size: 15px;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          background: white;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .filters-group {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .filter-item select {
          padding: 0 12px;
          height: 48px;
          border-radius: 12px;
          font-weight: 500;
          color: #1e293b;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          background: white;
        }

        .refresh-btn {
          height: 48px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e293b;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #0f172a;
        }

        .refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default FiltersBar;
