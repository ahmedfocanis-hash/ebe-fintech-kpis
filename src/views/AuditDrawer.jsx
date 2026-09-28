import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchScorecardById, saveAuditorReview } from '../utils/api';
import Tooltip from '../components/Tooltip';
import Avatar from '../components/Avatar';
import { 
  X, 
  CheckCircle, 
  RotateCcw, 
  MessageSquare, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Save,
  Lock,
  AlertCircle
} from 'lucide-react';

export default function AuditDrawer({ scorecardId, isOpen, onClose, onUpdated }) {
  const { currentUser, showToast } = useAuth();
  const [scorecard, setScorecard] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [itemsState, setItemsState] = useState([]);

  const loadData = async () => {
    if (!scorecardId) return;
    setLoading(true);
    try {
      const data = await fetchScorecardById(scorecardId);
      if (data.success && data.scorecard) {
        setScorecard(data.scorecard);
        setItemsState(data.scorecard.items.map(item => ({
          kpi_id: item.kpi_id,
          code: item.code,
          title: item.title,
          tooltip: item.tooltip,
          category_id: item.category_id,
          order_idx: item.order_idx,
          self_score: item.self_score || 0,
          manager_score: item.manager_score || 0,
          manager_notes: item.manager_notes || '',
          auditor_comment: item.auditor_comment || ''
        })));
      }
    } catch (err) {
      showToast('Error loading scorecard details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [scorecardId, isOpen]);

  const isAhmedHashim = scorecard?.employee_role === 'TEAM_LEAD' || scorecard?.employee_name === 'Ahmed Hashim';

  // Group items by category
  const categoriesWithItems = useMemo(() => {
    if (!scorecard || !itemsState.length) return [];
    
    const grouped = {};
    itemsState.forEach(item => {
      if (!grouped[item.category_id]) grouped[item.category_id] = [];
      grouped[item.category_id].push(item);
    });

    const breakdown = scorecard.managerCalculations?.category_breakdown || 
                      scorecard.selfCalculations?.category_breakdown || [];

    return breakdown.map(cat => {
      const catItems = grouped[cat.category_id] || [];
      const totalManager = catItems.reduce((acc, curr) => acc + (Number(curr.manager_score) || 0), 0);
      const avgManager = catItems.length > 0 ? (totalManager / catItems.length) : 0;
      const weightedManager = (avgManager * cat.weight_percentage) / 100;

      return {
        ...cat,
        items: catItems,
        live_avg: Number(avgManager.toFixed(2)),
        live_weighted: Number(weightedManager.toFixed(3))
      };
    });
  }, [scorecard, itemsState]);

  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const toggleAll = () => {
    const allOpen = Object.keys(collapsedCategories).length === 0 || 
                    Object.values(collapsedCategories).every(v => !v);
    const nextState = {};
    categoriesWithItems.forEach(c => {
      nextState[c.category_id] = allOpen;
    });
    setCollapsedCategories(nextState);
  };

  const handleAuditorCommentChange = (kpiId, comment) => {
    setItemsState(prev => prev.map(item => 
      item.kpi_id === kpiId ? { ...item, auditor_comment: comment } : item
    ));
  };

  // Perform Governance & Audit Action
  const handleGovernanceAction = async (actionType) => {
    if (actionType === 'REVISION_REQUESTED' && !commentText.trim()) {
      showToast('Please enter revision instructions in the overall feedback box before sending back to Ahmed Hashim.', 'error');
      return;
    }

    const defaultApprovedComment = `Executive sign-off confirmed by ${currentUser?.name}. Scorecard certified as official.`;
    const finalComment = commentText.trim() || (actionType === 'APPROVED' ? defaultApprovedComment : '');

    setSubmitting(true);
    try {
      const res = await saveAuditorReview(scorecardId, {
        auditor_notes: itemsState.map(i => ({
          kpi_id: i.kpi_id,
          comment: i.auditor_comment || ''
        })),
        overall_comment: finalComment,
        action: actionType,
        authorId: currentUser?.id,
        authorName: `${currentUser?.name} (Executive Manager)`
      });

      if (res.success) {
        showToast(res.message, 'success');
        if (actionType === 'APPROVED' || actionType === 'REVISION_REQUESTED') {
          setCommentText('');
        }
        await loadData();
        if (onUpdated) onUpdated();
      } else {
        showToast('Audit action failed: ' + res.message, 'error');
      }
    } catch (err) {
      showToast('Error recording audit action: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#00191c]/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-[#032125] border-l border-[#0b363b] sm:rounded-[2px] max-w-4xl w-full h-full sm:h-[95vh] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#032125] border-b border-[#0b363b] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            {scorecard ? (
              <Avatar
                src={scorecard.employee_avatar}
                name={scorecard.employee_name}
                role={scorecard.employee_role}
                level={scorecard.employee_level}
                className="w-10 h-10 rounded-[6px] object-cover border border-[#0b363b]"
              />
            ) : (
              <div className="p-2 bg-[#0b363b] text-[#abffae] rounded-[2px]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-[475] text-white">Executive Audit & Governance Panel</h2>
                {isAhmedHashim && (
                  <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#0b363b] text-[#abffae] border border-[#0b363b]">
                    Team Lead BA Scorecard
                  </span>
                )}
              </div>
              {scorecard && (
                <p className="text-xs text-[#a1c2c6] font-[475] mt-0.5">
                  Auditing <strong className="text-white">{scorecard.employee_name}</strong> &bull; {scorecard.employee_level} BA ({scorecard.employee_title})
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#a1c2c6] hover:text-white p-1.5 rounded-full hover:bg-[#0b363b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center flex-1">
            <div className="w-8 h-8 border-2 border-[#abffae] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs text-[#a1c2c6]">Loading audit scorecard details...</span>
          </div>
        ) : !scorecard ? (
          <div className="p-8 text-center text-[#a1c2c6] flex-1">Scorecard details unavailable.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#032125]">
            
            {/* Top Score Summary Banner (Strictly Read-Only Governance) */}
            <div className="p-4 bg-[#00191c] border border-[#0b363b] rounded-[2px] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div>
                  <div className="text-[10px] uppercase font-[475] text-[#a1c2c6]">Self-Rating Score</div>
                  <div className="text-2xl font-[475] text-white font-mono mt-0.5">
                    {scorecard.self_composite_score > 0 ? scorecard.self_composite_score.toFixed(2) : '-'}
                  </div>
                  <div className="text-[10px] text-[#437278]">out of 10.0</div>
                </div>

                <div className="border-l border-[#0b363b] pl-6">
                  <div className="text-[10px] uppercase font-[475] text-[#abffae]">Official Manager Score (Lead)</div>
                  <div className="text-2xl font-[475] text-[#abffae] font-mono mt-0.5">
                    {scorecard.final_composite_score > 0 ? scorecard.final_composite_score.toFixed(2) : 'Pending'}
                  </div>
                  <div className="text-[10px] text-[#437278] font-mono">
                    Delta: {scorecard.final_composite_score > 0 && scorecard.self_composite_score > 0 
                      ? (scorecard.final_composite_score - scorecard.self_composite_score).toFixed(1) 
                      : '-'}
                  </div>
                </div>

                <div className="border-l border-[#0b363b] pl-6">
                  <div className="text-[10px] uppercase font-[475] text-[#a1c2c6]">Status & Tier</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                      scorecard.status === 'Audited' ? 'bg-[#0b363b] text-white border-[#abffae]' :
                      scorecard.status === 'Needs Revision' ? 'bg-[#863d1c]/40 text-[#fdf0e9] border-[#863d1c]' :
                      scorecard.status === 'Reviewed' ? 'bg-[#0b363b] text-[#abffae] border-[#0b363b]' :
                      'bg-[#00191c] text-[#a1c2c6] border-[#0b363b]'
                    }`}>
                      {scorecard.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                      scorecard.tier === 'Top Performer' ? 'bg-[#0b363b] text-[#abffae] border-[#abffae]' :
                      scorecard.tier === 'Solid Contributor' ? 'bg-[#0b363b] text-[#e2f4ff] border-[#a1c2c6]' :
                      'bg-[#863d1c]/30 text-[#fdf0e9] border-[#863d1c]'
                    }`}>
                      {scorecard.tier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Read-Only Governance Pill */}
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1.5 rounded-[2px] bg-[#0b363b] border border-[#0b363b] text-[#a1c2c6] text-xs font-[475] flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#abffae]" />
                  <span>Scores Locked (Governance Mode)</span>
                </div>
              </div>
            </div>

            {/* Team Lead Feedback (if not Ahmed himself) */}
            {!isAhmedHashim && scorecard.overall_manager_notes && (
              <div className="p-4 bg-[#0b363b] border border-[#0b363b] rounded-[2px] space-y-1">
                <div className="text-xs font-[475] text-[#abffae] uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Team Lead Review Notes (Ahmed Hashim):</span>
                </div>
                <p className="text-xs text-[#a1c2c6] italic leading-relaxed font-[475]">
                  "{scorecard.overall_manager_notes}"
                </p>
              </div>
            )}

            {/* GRANULAR SUB-CRITERIA BREAKDOWN WITH PER-ITEM AUDIT NOTES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-[475] text-white uppercase tracking-wider flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-[#abffae]" />
                    <span>Category & Granular Criteria Breakdown (27 Sub-Points)</span>
                  </h3>
                  <p className="text-[11px] text-[#a1c2c6]">
                    Numerical scores are read-only. Leave specific manager audit feedback under individual criteria below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleAll}
                  className="rounded-full px-3 py-1 bg-[#0b363b] hover:bg-[#00191c] text-[#a1c2c6] hover:text-white border border-[#0b363b] text-xs font-[475] transition-colors cursor-pointer"
                >
                  Expand / Collapse All
                </button>
              </div>

              {/* Expandable Category Accordions */}
              <div className="space-y-3">
                {categoriesWithItems.map((cat) => {
                  const isCollapsed = collapsedCategories[cat.category_id];

                  return (
                    <div 
                      key={cat.category_id}
                      className="bg-[#0b363b] border border-[#0b363b] rounded-[2px] overflow-hidden transition-all"
                    >
                      {/* Category Header */}
                      <div
                        onClick={() => toggleCategory(cat.category_id)}
                        className="px-5 py-3.5 bg-[#0b363b] hover:bg-[#00191c]/50 cursor-pointer flex items-center justify-between border-b border-[#00191c] transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-[2px] bg-[#00191c] text-[#abffae] font-mono text-xs flex items-center justify-center border border-[#0b363b]">
                            {cat.category_id}
                          </span>
                          <span className="font-[475] text-white text-sm">{cat.category_name}</span>
                          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-[2px] bg-[#00191c] text-[#a1c2c6] border border-[#0b363b]">
                            Weight: {cat.weight_percentage}%
                          </span>
                          <span className="text-[11px] text-[#a1c2c6] hidden sm:inline">
                            ({cat.items.length} criteria)
                          </span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right text-xs">
                            <span className="text-[#a1c2c6]">Cat Avg: </span>
                            <strong className="text-[#abffae] font-mono text-sm">{cat.live_avg}</strong>
                            <span className="text-[#437278] font-mono"> / 10</span>
                          </div>

                          <div className="text-right text-xs font-mono text-[#a1c2c6] hidden sm:block">
                            +{cat.live_weighted} pts
                          </div>

                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-[#a1c2c6]" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-[#a1c2c6]" />
                          )}
                        </div>
                      </div>

                      {/* Granular Sub-criteria List */}
                      {!isCollapsed && (
                        <div className="divide-y divide-[#00191c] p-3 space-y-3 bg-[#032125]/80">
                          {cat.items.map((item) => {
                            const selfVal = item.self_score || 0;
                            const mgrVal = item.manager_score || 0;
                            const delta = (mgrVal && selfVal) ? (mgrVal - selfVal).toFixed(1) : null;

                            return (
                              <div key={item.kpi_id} className="pt-3 pb-2 px-2 hover:bg-[#0b363b]/40 rounded-[2px] transition-colors space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  {/* Code, Title, Tooltip */}
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="px-1.5 py-0.5 rounded-[2px] bg-[#00191c] text-[11px] font-mono font-[475] text-[#a1c2c6] border border-[#0b363b]">
                                        {item.code}
                                      </span>
                                      <span className="text-xs font-[475] text-white">
                                        {item.title}
                                      </span>
                                      <Tooltip title={`${item.code} ${item.title}`} text={item.tooltip} />
                                    </div>
                                  </div>

                                  {/* Ratings & Variance (100% Read-Only Badges) */}
                                  <div className="flex items-center space-x-3 shrink-0">
                                    {/* Self Score */}
                                    <div className="text-center px-2.5 py-1 bg-[#00191c] rounded-[2px] border border-[#0b363b]">
                                      <span className="text-[9px] uppercase font-[475] text-[#a1c2c6] mr-1.5">Self:</span>
                                      <span className="text-xs font-mono font-[475] text-white">
                                        {selfVal ? `${selfVal}/10` : '-'}
                                      </span>
                                    </div>

                                    {/* Ahmed Hashim's Official Manager Score */}
                                    <div className="px-2.5 py-1 rounded-[2px] text-xs font-mono text-center border bg-[#00191c] text-[#abffae] border-[#0b363b] font-[475]">
                                      <span className="text-[9px] uppercase font-[475] text-[#a1c2c6] mr-1.5">Lead Score:</span>
                                      <span>{mgrVal ? `${mgrVal}/10` : 'Pending'}</span>
                                    </div>

                                    {/* Variance Delta Badge */}
                                    {delta !== null ? (
                                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-[475] ${
                                        Number(delta) > 0 ? 'bg-[#00191c] text-[#abffae] border border-[#abffae]' :
                                        Number(delta) < 0 ? 'bg-[#00191c] text-[#fdf0e9] border border-[#863d1c]' :
                                        'bg-[#00191c] text-[#a1c2c6] border border-[#0b363b]'
                                      }`}>
                                        {Number(delta) > 0 ? `+${delta}` : delta}
                                      </span>
                                    ) : (
                                      <span className="text-[#437278] text-xs font-mono">-</span>
                                    )}
                                  </div>
                                </div>

                                {/* Ahmed Hashim's Notes for this item (if any) */}
                                {item.manager_notes && (
                                  <div className="pl-6 text-[11px] text-[#a1c2c6] bg-[#00191c] p-2 rounded-[2px] border border-[#0b363b] flex items-start space-x-1.5">
                                    <span className="font-[475] text-[#abffae] shrink-0">Ahmed Hashim Note:</span>
                                    <span className="italic leading-relaxed">"{item.manager_notes}"</span>
                                  </div>
                                )}

                                {/* Per-Criterion Manager Audit Note Input */}
                                <div className="pl-6 pt-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-[#a1c2c6] select-none">💬</span>
                                    <input
                                      type="text"
                                      value={item.auditor_comment || ''}
                                      onChange={(e) => handleAuditorCommentChange(item.kpi_id, e.target.value)}
                                      placeholder="Manager Audit Note for this item (e.g. Good edge case coverage, but clarify rollback policy)..."
                                      className="w-full bg-[#00191c] border border-[#0b363b] hover:border-[#abffae] focus:border-[#abffae] rounded-[2px] px-3 py-1.5 text-xs text-white placeholder-[#437278] focus:outline-none focus:shadow-glow-verdant transition-all font-[475]"
                                    />
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Audit History Trail */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-[475] text-white uppercase tracking-wider">
                Audit Trail & History
              </h3>
              {scorecard.auditLogs && scorecard.auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {scorecard.auditLogs.map(log => (
                    <div key={log.id} className="p-3 bg-[#00191c] border border-[#0b363b] rounded-[2px] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-[475] text-[#abffae]">{log.author_name}</span>
                        <span className="text-[10px] text-[#437278] font-mono">{log.created_at}</span>
                      </div>
                      <p className="text-xs text-[#a1c2c6] leading-relaxed font-[475]">{log.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#00191c] border border-[#0b363b] rounded-[2px] text-xs text-[#437278] text-center">
                  No previous audit comments logged for this employee scorecard.
                </div>
              )}
            </div>

            {/* Executive Governance Actions & Overall Remarks */}
            <div className="bg-[#0b363b] p-4 rounded-[2px] border border-[#0b363b] space-y-3">
              <label className="text-xs font-[475] text-white uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#abffae]" />
                <span>Overall Executive Remarks for Ahmed Hashim:</span>
              </label>

              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Overall Executive Remarks for Ahmed Hashim (e.g. Approved with commendations, or specific revision directives)..."
                className="w-full bg-[#00191c] border border-[#0b363b] rounded-[2px] p-3 text-xs text-white placeholder-[#437278] focus:outline-none focus:border-[#abffae] focus:shadow-glow-verdant font-[475]"
              />

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Button 1: Grant Final Sign-Off Approval */}
                <button
                  type="button"
                  onClick={() => handleGovernanceAction('APPROVED')}
                  disabled={submitting}
                  className="rounded-full px-4 py-2 bg-[#abffae] hover:bg-[#96f599] text-[#032125] text-xs font-[475] border border-[#0b363b] hover:shadow-glow-verdant transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Processing...' : 'Grant Final Sign-Off Approval'}</span>
                </button>

                {/* Button 2: Send Revisions to Ahmed Hashim */}
                <button
                  type="button"
                  onClick={() => handleGovernanceAction('REVISION_REQUESTED')}
                  disabled={submitting}
                  className="rounded-full px-4 py-2 bg-[#fdf0e9] hover:bg-[#fae3d5] text-[#863d1c] border border-[#863d1c] text-xs font-[475] transition-all flex items-center space-x-1.5 cursor-pointer hover:shadow-glow-zest"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Revisions to Ahmed Hashim'}</span>
                </button>

                {/* Button 3: Save Comments Only */}
                <button
                  type="button"
                  onClick={() => handleGovernanceAction('COMMENT')}
                  disabled={submitting}
                  className="rounded-full px-4 py-2 bg-[#00191c] hover:bg-[#0b363b] text-[#a1c2c6] hover:text-white border border-[#0b363b] text-xs font-[475] transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#abffae]" />
                  <span>{submitting ? 'Saving...' : 'Save Comments Only'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-[#032125] border-t border-[#0b363b] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-1.5 bg-[#00191c] hover:bg-[#0b363b] text-[#a1c2c6] hover:text-white text-xs font-[475] border border-[#0b363b] transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
