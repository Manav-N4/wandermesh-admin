
import { motion } from 'framer-motion';

interface StatsProps {
  total: number;
  tripCounts: Record<string, number>;
}

const StatsSection = ({ total, tripCounts }: StatsProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="stats-container"
    >
      <motion.div variants={item} className="stat-card total">
        <div className="stat-accent" style={{ background: '#3b82f6' }}></div>
        <div className="stat-info">
          <span className="stat-label">Total Leads</span>
          <span className="stat-value">{total}</span>
        </div>
      </motion.div>

      <motion.div variants={item} className="stat-card">
        <div className="stat-accent" style={{ background: '#10b981' }}></div>
        <div className="stat-info">
          <span className="stat-label">Vietnam Trips</span>
          <span className="stat-value">{tripCounts['Vietnam'] || 0}</span>
        </div>
      </motion.div>

      <motion.div variants={item} className="stat-card">
        <div className="stat-accent" style={{ background: '#f59e0b' }}></div>
        <div className="stat-info">
          <span className="stat-label">Bali Trips</span>
          <span className="stat-value">{tripCounts['Bali'] || 0}</span>
        </div>
      </motion.div>

      <motion.div variants={item} className="stat-card">
        <div className="stat-accent" style={{ background: '#8b5cf6' }}></div>
        <div className="stat-info">
          <span className="stat-label">BLR Trips</span>
          <span className="stat-value">{tripCounts['BLR'] || tripCounts['Bangalore'] || 0}</span>
        </div>
      </motion.div>

      <style>{`
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          transition: transform 0.2s;
          position: relative;
          overflow: hidden;
        }

        .stat-accent {
          width: 4px;
          height: 32px;
          border-radius: 2px;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border-color: #cbd5e1;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }
      `}</style>
    </motion.div>
  );
};

export default StatsSection;
