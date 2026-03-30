import { useState } from 'react';
import type { Lead, LeadStatus } from '../types/lead';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (id: string, status: LeadStatus) => void;
  isNew?: boolean;
}

const statusColors: Record<LeadStatus, string> = {
  New: '#3b82f6',
  Contacted: '#f59e0b',
  Qualified: '#10b981',
  Booked: '#8b5cf6',
};

const LeadCard = ({ lead, onStatusChange, isNew }: LeadCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`lead-card ${isNew ? 'is-new' : ''}`}
    >
      <div className="card-header">
        <div className="header-main">
          <h3>
            {lead.name} {isNew && <span className="new-badge">NEW</span>}
          </h3>
          <div className="trip-tag">
            {lead.trip}
          </div>
        </div>
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
          style={{ borderColor: statusColors[lead.status] }}
          className="status-selector"
        >
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Booked">Booked</option>
        </select>
      </div>

      <div className="card-content">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Phone:</span>
            <span className="phone-wrapper">
               {lead.phone}
               <button onClick={handleCopyPhone} className="copy-btn">
                 {copied ? 'Copied' : 'Copy'}
               </button>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender:</span> {lead.gender}
          </div>
          <div className="info-item">
            <span className="info-label">Insta:</span> 
            <a href={`https://instagram.com/${lead.insta_id}`} target="_blank" rel="noreferrer">
              @{lead.insta_id}
            </a>
          </div>
          <div className="info-item">
            <span className="info-label">Title:</span> {lead.occupation}
          </div>
        </div>

        <div className="why-section">
          <button className="expand-trigger" onClick={() => setIsExpanded(!isExpanded)}>
            <span className="section-label">Why Join?</span>
            <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
          </button>
          
          <AnimatePresence>
            {isExpanded ? (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="expanded-text"
              >
                {lead.why_join}
              </motion.p>
            ) : (
              <p className="collapsed-text">{lead.why_join.slice(0, 80)}{lead.why_join.length > 80 ? '...' : ''}</p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="card-footer">
        <span className="timestamp">
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </span>
      </div>

      <style>{`
        .lead-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          position: relative;
        }

        .lead-card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }

        .is-new {
          border-color: #3b82f6;
          background: #f0f7ff;
        }

        .new-badge {
          background: #3b82f6;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          vertical-align: middle;
          margin-left: 8px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .header-main h3 {
          font-size: 1.1rem;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .trip-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .status-selector {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1.5px solid;
          background: white;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 13px;
          color: #475569;
        }

        .info-label {
          font-weight: 600;
          color: #94a3b8;
          min-width: 50px;
        }

        .phone-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .copy-btn {
          padding: 2px 6px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          color: #64748b;
          font-size: 10px;
          font-weight: 600;
        }

        .copy-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .info-item a {
          color: #3b82f6;
          font-weight: 500;
        }

        .why-section {
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .expand-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0;
          background: none;
          color: inherit;
          border: none;
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .expand-icon {
          font-size: 16px;
          color: #94a3b8;
        }

        .collapsed-text, .expanded-text {
          font-size: 13px;
          color: #475569;
          line-height: 1.4;
          margin-top: 4px;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .timestamp {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }
      `}</style>
    </motion.div>
  );
};

export default LeadCard;
