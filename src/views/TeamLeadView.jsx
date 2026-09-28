import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchScorecards, fetchAuditFeed } from '../utils/api';
import GradeModal from './GradeModal';
import EmployeeView from './EmployeeView';
import Avatar from '../components/Avatar';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Award, 
  Search, 
  Edit3, 
  Eye, 
  ShieldCheck, 
  MessageSquare, 
  RotateCcw,
  UserCheck
} from 'lucide-react';

export default function TeamLeadView({ onInspectScorecard }) {
  const { currentUser, showToast } = useAuth();
  const [scorecards, setScorecards] = useState([]);
  const [auditFeed, setAuditFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScorecardId, setSelectedScorecardId] = useState(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  // Tab State: 'team' (Team Scorecards 3 BAs) vs 'self' (My Self-Assessment Lead BA)
  const [activeTab, setActiveTab] = useState('team');

  // Filters for Team Scorecards
  const [statusFilter, setStatusFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [scData, feedData] = await Promise.all([
        fetchScorecards(),
        fetchAuditFeed()
      ]);
      if (scData.success) {
        setScorecards(scData.scorecards);
      }
      if (feedData.success) {
        setAuditFeed(feedData.feed);
      }
    } catch (err) {
      showToast('Error loading team data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teamScorecards = useMemo(() => {
    return scorecards.filter(s => s.user_id !== currentUser?.id && s.employee_role !== 'TEAM_LEAD');
  }, [scorecards, currentUser]);

  const myScorecard = useMemo(() => {
    return scorecards.find(s => s.user_id === currentUser?.id || s.employee_role === 'TEAM_LEAD');
  }, [scorecards, currentUser]);

  const metrics = useMemo(() => {
    const total = teamScorecards.length;
    const submitted = teamScorecards.filter(s => s.status === 'Submitted').length;
    const needsRevision = teamScorecards.filter(s => s.status === 'Needs Revision').length;
    const reviewed = teamScorecards.filter(s => s.status === 'Reviewed').length;
    const audited = teamScorecards.filter(s => s.status === 'Audited').length;
    const draft = teamScorecards.filter(s => s.status === 'Draft').length;

    const evaluated = teamScorecards.filter(s => s.final_composite_score > 0);
    const avgScore = evaluated.length > 0
      ? (evaluated.reduce((sum, s) => sum + s.final_composite_score, 0) / evaluated.length).toFixed(2)
      : '0.00';

    return { total, submitted, needsRevision, reviewed, audited, draft, avgScore };
  }, [teamScorecards]);

  const filteredScorecards = useMemo(() => {
    return teamScorecards.filter(sc => {
      const matchStatus = statusFilter === 'All' || sc.status === statusFilter;
      const matchLevel = levelFilter === 'All' || sc.employee_level === levelFilter;
      const matchSearch = !searchQuery || 
        sc.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.employee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.employee_title?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchLevel && matchSearch;
    });
  }, [teamScorecards, statusFilter, levelFilter, searchQuery]);

  const handleOpenGrade = (scId) => {
    setSelectedScorecardId(scId);
    setIsGradeModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Audited':
        return <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#0b363b] text-[#abffae] border border-[#0b363b]">Audited</span>;
      case 'Reviewed':
        return <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#eafde8] text-[#032125] border border-[#ebebeb]">Reviewed</span>;
      case 'Submitted':
        return <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#e2f4ff] text-[#123a88] border border-[#ebebeb]">Submitted</span>;
      case 'Needs Revision':
        return <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#fdf0e9] text-[#863d1c] border border-[#863d1c]">Needs Revision</span>;
      default:
        return <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#fafafa] text-[#354d51] border border-[#ebebeb]">Draft</span>;
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Top Performer':
        return <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-[475] bg-[#eafde8] text-[#032125] border border-[#ebebeb]">Top Performer</span>;
      case 'Solid Contributor':
        return <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-[475] bg-[#e2f4ff] text-[#123a88] border border-[#ebebeb]">Solid Contributor</span>;
      case 'Needs Improvement':
        return <span className="px-2 py-0.5 rounded-[2px] text-[11px] font-[475] bg-[#fdf0e9] text-[#863d1c] border border-[#863d1c]/40">Needs Improvement</span>;
      default:
        return <span className="text-[11px] text-[#437278] font-mono">Unrated</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white border border-[#ebebeb] rounded-[2px] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-[2px] bg-[#032125] text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#abffae]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-[475] text-[#032125] tracking-tight">Team Lead BA Evaluation Hub</h1>
                <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[#eafde8] text-[#032125] font-[475] border border-[#ebebeb]">
                  Ahmed Hashim
                </span>
                <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[#e2f4ff] text-[#123a88] font-[475] border border-[#ebebeb]">
                  Lead Level BA
                </span>
              </div>
              <p className="text-xs text-[#354d51] mt-1">
                Direct Reports: Yousef Ali (Senior BA), ALy Alaa (Junior BA), Rawan Mohamed (Junior BA) &bull; Q3 2026 Cycle
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-3 bg-[#fafafa] border border-[#ebebeb] rounded-[2px] text-right">
              <div className="text-[10px] uppercase font-[475] text-[#354d51]">Team Composite Avg</div>
              <div className="text-2xl font-[475] text-[#032125] font-mono">
                {metrics.avgScore} <span className="text-xs text-[#437278]">/ 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO PILL TABS */}
      <div className="flex items-center space-x-2 border-b border-[#ebebeb] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-full font-[475] text-xs transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-[#032125] text-white'
              : 'bg-white text-[#354d51] hover:text-[#032125] hover:bg-[#fafafa] border border-[#ebebeb]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Scorecards (3 BAs)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'team' ? 'bg-[#0b363b] text-[#abffae]' : 'bg-[#fafafa] text-[#354d51]'
          }`}>
            {teamScorecards.length || 3}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('self')}
          className={`px-4 py-2 rounded-full font-[475] text-xs transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'self'
              ? 'bg-[#032125] text-white'
              : 'bg-white text-[#354d51] hover:text-[#032125] hover:bg-[#fafafa] border border-[#ebebeb]'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>My Self-Assessment (Lead BA)</span>
          {myScorecard && (
            <span className={`px-2 py-0.2 rounded-[2px] text-[10px] font-[475] border ${
              myScorecard.status === 'Audited' ? 'bg-[#0b363b] text-[#abffae] border-[#0b363b]' :
              myScorecard.status === 'Submitted' ? 'bg-[#e2f4ff] text-[#123a88] border-[#ebebeb]' :
              myScorecard.status === 'Needs Revision' ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]' :
              'bg-[#fafafa] text-[#354d51] border-[#ebebeb]'
            }`}>
              {myScorecard.status}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TEAM SCORECARDS (3 BAS) */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          
          {/* Progress Cards for the 3 BAs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setStatusFilter('All')}
              className={`p-4 rounded-[2px] border transition-all cursor-pointer ${
                statusFilter === 'All' ? 'bg-white border-[#032125] ring-1 ring-[#032125]' : 'bg-white border-[#ebebeb] hover:border-[#032125]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#354d51] mb-1">
                <span>Direct Reports</span>
                <Users className="w-3.5 h-3.5 text-[#354d51]" />
              </div>
              <div className="text-2xl font-[475] text-[#032125] font-mono">{metrics.total}</div>
              <div className="text-[11px] text-[#437278] mt-1">Yousef, ALy, Rawan</div>
            </div>

            <div 
              onClick={() => setStatusFilter('Submitted')}
              className={`p-4 rounded-[2px] border transition-all cursor-pointer ${
                statusFilter === 'Submitted' ? 'bg-[#e2f4ff] border-[#123a88] ring-1 ring-[#123a88]' : 'bg-white border-[#ebebeb] hover:border-[#123a88]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#123a88] mb-1">
                <span>Awaiting Review</span>
                <Clock className="w-3.5 h-3.5 text-[#123a88]" />
              </div>
              <div className="text-2xl font-[475] text-[#123a88] font-mono">{metrics.submitted}</div>
              <div className="text-[11px] text-[#123a88]/80 mt-1">Ready for Lead Grading</div>
            </div>

            <div 
              onClick={() => setStatusFilter('Needs Revision')}
              className={`p-4 rounded-[2px] border transition-all cursor-pointer ${
                statusFilter === 'Needs Revision' ? 'bg-[#fdf0e9] border-[#863d1c] ring-1 ring-[#863d1c]' : 'bg-white border-[#ebebeb] hover:border-[#863d1c]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#863d1c] mb-1">
                <span>Needs Revision</span>
                <RotateCcw className="w-3.5 h-3.5 text-[#863d1c]" />
              </div>
              <div className="text-2xl font-[475] text-[#863d1c] font-mono">{metrics.needsRevision}</div>
              <div className="text-[11px] text-[#863d1c]/80 mt-1">Directives from Management</div>
            </div>

            <div 
              onClick={() => setStatusFilter('Reviewed')}
              className={`p-4 rounded-[2px] border transition-all cursor-pointer ${
                statusFilter === 'Reviewed' ? 'bg-[#eafde8] border-[#032125] ring-1 ring-[#032125]' : 'bg-white border-[#ebebeb] hover:border-[#032125]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#032125] mb-1">
                <span>Reviewed & Sent</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#032125]" />
              </div>
              <div className="text-2xl font-[475] text-[#032125] font-mono">{metrics.reviewed + metrics.audited}</div>
              <div className="text-[11px] text-[#437278] mt-1">{metrics.audited} Audited &bull; {metrics.reviewed} In Audit</div>
            </div>
          </div>

          {/* Audit Feed Banner */}
          <div className="bg-white border border-[#ebebeb] rounded-[2px] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ebebeb]">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-[#863d1c]" />
                <h3 className="text-xs font-[475] text-[#032125] uppercase tracking-wider">
                  Executive Governance & Audit Directives Feed
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#437278]">
                {auditFeed.length} logged events
              </span>
            </div>

            {auditFeed.length === 0 ? (
              <div className="py-6 text-center text-[#437278] text-xs">
                No executive audit feedback or revision requests received yet.
              </div>
            ) : (
              <div className="space-y-2">
                {auditFeed.slice(0, 3).map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3.5 rounded-[2px] border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      item.action === 'REVISION_REQUESTED'
                        ? 'bg-[#fdf0e9] border-[#863d1c]/40'
                        : item.action === 'APPROVED'
                        ? 'bg-[#eafde8] border-[#ebebeb]'
                        : 'bg-[#fafafa] border-[#ebebeb]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-[475] text-[#032125] text-xs">{item.author_name}</span>
                        <span className={`px-2 py-0.2 rounded-[2px] text-[10px] font-[475] border ${
                          item.action === 'REVISION_REQUESTED' ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]' :
                          item.action === 'APPROVED' ? 'bg-[#0b363b] text-[#abffae] border-[#0b363b]' :
                          'bg-white text-[#354d51] border-[#ebebeb]'
                        }`}>
                          {item.action === 'REVISION_REQUESTED' ? 'Revision Requested' : item.action === 'APPROVED' ? 'Approved & Audited' : 'Audit Note'}
                        </span>
                        <span className="text-[11px] text-[#354d51]">
                          re: <strong className="text-[#032125]">{item.employee_name}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-[#032125] italic leading-relaxed">
                        "{item.comment}"
                      </p>
                      <div className="text-[10px] text-[#437278] font-mono">{item.created_at}</div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenGrade(item.scorecard_id)}
                        className="rounded-full px-3 py-1.5 bg-[#032125] text-white hover:bg-[#0b363b] text-xs font-[475] transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#abffae]" />
                        <span>Inspect & Grade</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white border border-[#ebebeb] rounded-[2px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {['All', 'Submitted', 'Needs Revision', 'Reviewed', 'Audited', 'Draft'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-[475] transition-all cursor-pointer ${
                    statusFilter === st
                      ? (st === 'Needs Revision' ? 'bg-[#863d1c] text-white' : 'bg-[#032125] text-white')
                      : 'bg-white text-[#354d51] hover:bg-[#fafafa] border border-[#ebebeb]'
                  }`}
                >
                  {st} {st === 'All' ? `(${metrics.total})` : st === 'Submitted' ? `(${metrics.submitted})` : st === 'Needs Revision' ? `(${metrics.needsRevision})` : ''}
                </button>
              ))}
            </div>

            {/* Level and Search */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-white border border-[#ebebeb] rounded-[2px] px-3 py-1.5 text-xs text-[#032125] focus-glow"
              >
                <option value="All">All Role Levels</option>
                <option value="Junior">Junior BA</option>
                <option value="Senior">Senior BA</option>
              </select>

              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 text-[#437278] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#ebebeb] rounded-[2px] text-xs text-[#032125] placeholder-[#437278]/70 focus-glow"
                />
              </div>
            </div>
          </div>

          {/* 3 BAs Table */}
          <div className="bg-white border border-[#ebebeb] rounded-[2px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#032125]">
                <thead className="bg-[#fafafa] text-xs uppercase font-[475] text-[#354d51] border-b border-[#ebebeb]">
                  <tr>
                    <th className="py-3 px-5">Direct Report</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Self Score</th>
                    <th className="py-3 px-4 text-center">Lead Score</th>
                    <th className="py-3 px-4 text-center">Variance</th>
                    <th className="py-3 px-4 text-center">Tier</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {filteredScorecards.map((sc) => {
                    const delta = (sc.final_composite_score && sc.self_composite_score)
                      ? (sc.final_composite_score - sc.self_composite_score).toFixed(1)
                      : null;

                    return (
                      <tr key={sc.id} className="hover:bg-[#fafafa] transition-colors">
                        {/* BA Info */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={sc.employee_avatar}
                              name={sc.employee_name}
                              role={sc.employee_role}
                              level={sc.employee_level}
                              className="w-9 h-9 rounded-[6px] object-cover"
                            />
                            <div>
                              <div className="font-[475] text-sm text-[#032125]">
                                {sc.employee_name}
                              </div>
                              <div className="text-xs text-[#437278] font-mono">
                                {sc.employee_email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                            sc.employee_level === 'Senior' 
                              ? 'bg-[#e2f4ff] text-[#123a88] border-[#ebebeb]' 
                              : 'bg-[#fdf0e9] text-[#863d1c] border-[#ebebeb]'
                          }`}>
                            {sc.employee_level} BA
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(sc.status)}
                        </td>

                        {/* Self Score */}
                        <td className="py-3.5 px-4 text-center font-mono font-[475] text-[#032125]">
                          {sc.self_composite_score > 0 ? sc.self_composite_score.toFixed(2) : '-'}
                        </td>

                        {/* Manager Final */}
                        <td className="py-3.5 px-4 text-center font-mono font-[475] text-[#032125]">
                          {sc.final_composite_score > 0 ? (
                            <span className="font-bold">{sc.final_composite_score.toFixed(2)}</span>
                          ) : (
                            <span className="text-[#437278] text-xs">Pending</span>
                          )}
                        </td>

                        {/* Variance */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          {delta !== null ? (
                            <span className={`px-1.5 py-0.5 rounded-[2px] font-[475] ${
                              Number(delta) > 0 ? 'bg-[#eafde8] text-[#032125]' :
                              Number(delta) < 0 ? 'bg-[#fdf0e9] text-[#863d1c]' :
                              'bg-[#fafafa] text-[#437278]'
                            }`}>
                              {Number(delta) > 0 ? `+${delta}` : delta}
                            </span>
                          ) : (
                            <span className="text-[#437278]">-</span>
                          )}
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4 text-center">
                          {getTierBadge(sc.tier)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenGrade(sc.id)}
                              className={`rounded-full px-3.5 py-1.5 text-xs font-[475] transition-all flex items-center space-x-1.5 cursor-pointer ${
                                sc.status === 'Needs Revision'
                                  ? 'bg-[#863d1c] text-white hover:bg-[#723215]'
                                  : sc.status === 'Submitted'
                                  ? 'bg-[#abffae] text-[#032125] hover:bg-[#96f799] border border-[#abffae] focus-glow'
                                  : 'bg-white hover:bg-[#fafafa] text-[#032125] border border-[#ebebeb]'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>
                                {sc.status === 'Needs Revision' 
                                  ? 'Revise & Re-Grade' 
                                  : (sc.status === 'Submitted' ? 'Grade Now' : 'Edit Evaluation')}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onInspectScorecard && onInspectScorecard(sc.user_id)}
                              title="View Scorecard"
                              className="p-1.5 rounded-full text-[#437278] hover:text-[#032125] hover:bg-[#fafafa] transition-colors cursor-pointer"
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

          {/* Grade Modal */}
          <GradeModal
            scorecardId={selectedScorecardId}
            isOpen={isGradeModalOpen}
            onClose={() => setIsGradeModalOpen(false)}
            onUpdated={loadData}
          />
        </div>
      )}

      {/* TAB 2: MY SELF-ASSESSMENT (LEAD BA) */}
      {activeTab === 'self' && (
        <div>
          <EmployeeView 
            targetUserId={currentUser?.id} 
          />
        </div>
      )}

    </div>
  );
}
