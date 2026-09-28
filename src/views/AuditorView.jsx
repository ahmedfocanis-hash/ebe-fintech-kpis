import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard } from '../utils/api';
import AuditDrawer from './AuditDrawer';
import Avatar from '../components/Avatar';
import { 
  Award, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Filter, 
  ShieldCheck, 
  Eye, 
  ChevronRight, 
  BarChart2, 
  FileText 
} from 'lucide-react';

export default function AuditorView({ onInspectScorecard }) {
  const { currentUser, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScorecardId, setSelectedScorecardId] = useState(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Filters
  const [tierFilter, setTierFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchLeaderboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      showToast('Error loading leaderboard: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const leaderboard = data?.leaderboard || [];

  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter(item => {
      const matchTier = tierFilter === 'All' || item.tier === tierFilter;
      const matchLevel = levelFilter === 'All' || item.employee_level === levelFilter;
      const matchSearch = !searchQuery || 
        item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employee_email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTier && matchLevel && matchSearch;
    });
  }, [leaderboard, tierFilter, levelFilter, searchQuery]);

  const handleOpenAudit = (scId) => {
    setSelectedScorecardId(scId);
    setIsAuditDrawerOpen(true);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return <span className="w-5 h-5 rounded-[2px] bg-[#abffae] text-[#032125] font-mono font-[475] text-xs flex items-center justify-center border border-[#0b363b]">1</span>;
    }
    if (rank === 2) {
      return <span className="w-5 h-5 rounded-[2px] bg-[#e2f4ff] text-[#123a88] font-mono font-[475] text-xs flex items-center justify-center border border-[#a1c2c6]">2</span>;
    }
    if (rank === 3) {
      return <span className="w-5 h-5 rounded-[2px] bg-[#fdf0e9] text-[#863d1c] font-mono font-[475] text-xs flex items-center justify-center border border-[#863d1c]">3</span>;
    }
    return <span className="w-5 h-5 rounded-[2px] bg-[#fafafa] text-[#354d51] font-mono text-xs flex items-center justify-center border border-[#ebebeb]">{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Executive Header */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-[2px] bg-[#032125] border border-[#0b363b] flex items-center justify-center text-[#abffae]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-[475] text-[#032125] tracking-tight">Executive Performance Leaderboard</h1>
                <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[#e2f4ff] text-[#123a88] font-[475] border border-[#a1c2c6]">
                  Audit & Governance
                </span>
              </div>
              <p className="text-xs text-[#354d51] font-[475] mt-1">
                Executive Director Oversight &bull; Real-Time Merit Ranking & Promotion Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2.5 bg-[#fafafa] border border-[#ebebeb] rounded-[2px] text-right">
              <div className="text-[10px] uppercase font-[475] text-[#354d51]">Team Composite Average</div>
              <div className="text-2xl font-[475] text-[#032125] font-mono">
                {data?.teamAverageScore || '0.00'} <span className="text-xs text-[#354d51]">/ 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Top Performer Card */}
        <div 
          onClick={() => setTierFilter('Top Performer')}
          className={`p-5 rounded-[2px] border transition-all cursor-pointer ${
            tierFilter === 'Top Performer' 
              ? 'bg-[#ffffff] border-[#032125] shadow-glow-verdant' 
              : 'bg-[#ffffff] border-[#ebebeb] hover:border-[#032125]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-[475] uppercase tracking-wider text-[#437278]">Top Performers (&ge; 8.4)</span>
            <Award className="w-4 h-4 text-[#437278]" />
          </div>
          <div className="text-3xl font-[475] text-[#032125] font-mono">{data?.tiers?.topPerformer || 0}</div>
          <div className="text-xs text-[#354d51] mt-1 font-[475]">Promotion Eligible &bull; 1.5x Bonus Multiplier</div>
        </div>

        {/* Solid Contributor Card */}
        <div 
          onClick={() => setTierFilter('Solid Contributor')}
          className={`p-5 rounded-[2px] border transition-all cursor-pointer ${
            tierFilter === 'Solid Contributor' 
              ? 'bg-[#ffffff] border-[#123a88] shadow-glow-wave' 
              : 'bg-[#ffffff] border-[#ebebeb] hover:border-[#123a88]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-[475] uppercase tracking-wider text-[#123a88]">Solid Contributors (6.0 - 8.39)</span>
            <CheckCircle2 className="w-4 h-4 text-[#123a88]" />
          </div>
          <div className="text-3xl font-[475] text-[#032125] font-mono">{data?.tiers?.solidContributor || 0}</div>
          <div className="text-xs text-[#354d51] mt-1 font-[475]">Standard Progression &bull; 1.0x Bonus Multiplier</div>
        </div>

        {/* Needs Improvement Card */}
        <div 
          onClick={() => setTierFilter('Needs Improvement')}
          className={`p-5 rounded-[2px] border transition-all cursor-pointer ${
            tierFilter === 'Needs Improvement' 
              ? 'bg-[#ffffff] border-[#863d1c] shadow-glow-zest' 
              : 'bg-[#ffffff] border-[#ebebeb] hover:border-[#863d1c]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-[475] uppercase tracking-wider text-[#863d1c]">Needs Improvement (&lt; 6.0)</span>
            <ShieldAlert className="w-4 h-4 text-[#863d1c]" />
          </div>
          <div className="text-3xl font-[475] text-[#032125] font-mono">{data?.tiers?.needsImprovement || 0}</div>
          <div className="text-xs text-[#354d51] mt-1 font-[475]">Mandatory PIP &bull; Bonus Ineligible</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tier Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['All', 'Top Performer', 'Solid Contributor', 'Needs Improvement'].map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`rounded-full px-3.5 py-1 text-xs font-[475] transition-all cursor-pointer ${
                tierFilter === tier
                  ? 'bg-[#032125] text-white border border-[#032125]'
                  : 'bg-[#ffffff] text-[#354d51] hover:bg-[#fafafa] border border-[#ebebeb]'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Level and Search */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] px-3 py-1.5 text-xs text-[#032125] font-[475] focus:outline-none focus:border-[#032125]"
          >
            <option value="All">All Role Levels</option>
            <option value="Junior">Junior BA</option>
            <option value="Mid">Mid-Level BA</option>
            <option value="Senior">Senior BA</option>
            <option value="Lead">Lead BA</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-[#354d51] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#ffffff] border border-[#ebebeb] rounded-[2px] text-xs text-[#032125] font-[475] placeholder-[#354d51]/50 focus:outline-none focus:shadow-glow-verdant focus:border-[#032125]"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#032125]">
            <thead className="bg-[#fafafa] text-xs uppercase font-[475] text-[#354d51] border-b border-[#ebebeb]">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-6">Business Analyst</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4 text-center">Final Score</th>
                <th className="py-3 px-4 text-center">Self Score</th>
                <th className="py-3 px-4 text-center">Performance Tier</th>
                <th className="py-3 px-4">HR Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {filteredLeaderboard.map((item, idx) => {
                const isTop = item.tier === 'Top Performer';
                const isSolid = item.tier === 'Solid Contributor';
                const isPip = item.tier === 'Needs Improvement';

                return (
                  <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {getRankBadge(idx + 1)}
                      </div>
                    </td>

                    {/* BA Profile */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={item.employee_avatar}
                          name={item.employee_name}
                          role={item.employee_role}
                          level={item.employee_level}
                          className="w-9 h-9 rounded-[6px] object-cover border border-[#ebebeb]"
                        />
                        <div>
                          <div className="font-[475] text-[#032125] text-sm flex items-center space-x-2">
                            <span>{item.employee_name}</span>
                            {(item.employee_role === 'TEAM_LEAD' || item.employee_level === 'Lead' || item.employee_name === 'Ahmed Hashim') && (
                              <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] font-[475] bg-[#e2f4ff] text-[#123a88] border border-[#a1c2c6]">
                                Team Lead
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#354d51] font-mono">
                            {item.employee_title}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="py-3.5 px-4">
                      {(item.employee_role === 'TEAM_LEAD' || item.employee_level === 'Lead') ? (
                        <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#eafde8] text-[#032125] border border-[#abffae]">
                          Lead BA
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                          item.employee_level === 'Junior' ? 'bg-[#fffcf6] text-[#83611c] border-[#83611c]/30' :
                          item.employee_level === 'Mid' ? 'bg-[#e2f4ff] text-[#123a88] border-[#a1c2c6]' :
                          'bg-[#fafafa] text-[#032125] border-[#ebebeb]'
                        }`}>
                          {item.employee_level} BA
                        </span>
                      )}
                    </td>

                    {/* Final Composite Score */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {item.final_composite_score > 0 ? (
                        <span className="text-base font-[475] text-[#032125]">
                          {item.final_composite_score.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[#354d51] text-xs italic">Pending</span>
                      )}
                    </td>

                    {/* Self Score */}
                    <td className="py-3.5 px-4 text-center font-mono font-[475] text-[#354d51]">
                      {item.self_composite_score > 0 ? item.self_composite_score.toFixed(2) : '-'}
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                        isTop ? 'bg-[#eafde8] text-[#032125] border-[#abffae]' :
                        isSolid ? 'bg-[#e2f4ff] text-[#123a88] border-[#a1c2c6]' :
                        isPip ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]' :
                        'bg-[#fafafa] text-[#354d51] border-[#ebebeb]'
                      }`}>
                        {item.tier}
                      </span>
                    </td>

                    {/* HR Action Recommendation */}
                    <td className="py-3.5 px-4 text-xs font-[475]">
                      {isTop && <span className="text-[#032125]">&bull; Promo & 1.5x Bonus</span>}
                      {isSolid && <span className="text-[#123a88]">&bull; Standard (1.0x)</span>}
                      {isPip && <span className="text-[#863d1c]">&bull; Mandatory PIP</span>}
                      {!isTop && !isSolid && !isPip && <span className="text-[#354d51]">-</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                        item.status === 'Audited' ? 'bg-[#032125] text-white border-[#032125]' :
                        item.status === 'Reviewed' ? 'bg-[#eafde8] text-[#032125] border-[#abffae]' :
                        item.status === 'Submitted' ? 'bg-[#fffcf6] text-[#83611c] border-[#83611c]' :
                        item.status === 'Needs Revision' ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]' :
                        'bg-[#fafafa] text-[#354d51] border-[#ebebeb]'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenAudit(item.id)}
                          className="rounded-full px-3 py-1 bg-[#abffae] hover:bg-[#96f599] text-[#032125] text-xs font-[475] border border-[#0b363b] hover:shadow-glow-verdant transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Audit & Comment</span>
                        </button>

                        <button
                          onClick={() => onInspectScorecard && onInspectScorecard(item.user_id)}
                          title="Full Drill-down View"
                          className="rounded-full p-1.5 text-[#354d51] hover:text-[#032125] hover:bg-[#fafafa] border border-transparent hover:border-[#ebebeb] transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Drawer */}
      <AuditDrawer
        scorecardId={selectedScorecardId}
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        onUpdated={loadData}
      />
    </div>
  );
}
