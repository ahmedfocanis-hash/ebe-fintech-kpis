import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchScorecardById, saveManagerReview, finalizeReview } from '../utils/api';
import Tooltip from '../components/Tooltip';
import { 
  X, 
  Save, 
  CheckCircle2, 
  Award, 
  AlertCircle, 
  Layers, 
  MessageSquare, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Send,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function GradeModal({ scorecardId, isOpen, onClose, onUpdated }) {
  const { currentUser, showToast } = useAuth();
  const [scorecard, setScorecard] = useState(null);
  const [items, setItems] = useState([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const loadData = async () => {
    if (!scorecardId) return;
    setLoading(true);
    try {
      const data = await fetchScorecardById(scorecardId);
      if (data.success && data.scorecard) {
        setScorecard(data.scorecard);
        setOverallNotes(data.scorecard.overall_manager_notes || '');
        setItems(data.scorecard.items.map(item => ({
          kpi_id: item.kpi_id,
          code: item.code,
          title: item.title,
          tooltip: item.tooltip,
          category_id: item.category_id,
          order_idx: item.order_idx,
          self_score: item.self_score || 0,
          manager_score: item.manager_score || (item.self_score ? item.self_score : 0),
          manager_notes: item.manager_notes || '',
          auditor_comment: item.auditor_comment || null
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

  const handleManagerScoreChange = (kpiId, score) => {
    setItems(prev => prev.map(item => 
      item.kpi_id === kpiId ? { ...item, manager_score: score } : item
    ));
  };

  const handleNoteChange = (kpiId, note) => {
    setItems(prev => prev.map(item => 
      item.kpi_id === kpiId ? { ...item, manager_notes: note } : item
    ));
  };

  // Group items by category and compute live category averages & weighted scores
  const categoryCalculations = useMemo(() => {
    if (!scorecard || !items.length) return [];
    
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category_id]) grouped[item.category_id] = [];
      grouped[item.category_id].push(item);
    });

    return (scorecard.managerCalculations?.category_breakdown || scorecard.selfCalculations?.category_breakdown || []).map(cat => {
      const catItems = grouped[cat.category_id] || [];
      const totalManager = catItems.reduce((acc, curr) => acc + (Number(curr.manager_score) || 0), 0);
      const avgManager = catItems.length > 0 ? (totalManager / catItems.length) : 0;
      const weightedManager = (avgManager * cat.weight_percentage) / 100;

      return {
        ...cat,
        items: catItems,
        live_manager_avg: Number(avgManager.toFixed(2)),
        live_weighted_points: Number(weightedManager.toFixed(3))
      };
    });
  }, [scorecard, items]);

  const liveCompositeScore = useMemo(() => {
    const sum = categoryCalculations.reduce((acc, cat) => acc + cat.live_weighted_points, 0);
    return Number(sum.toFixed(2));
  }, [categoryCalculations]);

  const liveTier = useMemo(() => {
    if (liveCompositeScore >= 8.4) return { name: 'Top Performer', desc: 'Eligible for promotion, 1.5x bonus', bg: 'bg-[#eafde8] text-[#032125] border-[#abffae]' };
    if (liveCompositeScore >= 6.0) return { name: 'Solid Contributor', desc: 'Standard progression, 1.0x bonus', bg: 'bg-[#e2f4ff] text-[#123a88] border-[#a1c2c6]' };
    if (liveCompositeScore > 0) return { name: 'Needs Improvement', desc: 'Mandatory PIP, bonus ineligible', bg: 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]' };
    return { name: 'Pending', desc: 'Incomplete evaluation', bg: 'bg-[#fafafa] text-[#354d51] border-[#ebebeb]' };
  }, [liveCompositeScore]);

  const latestRevisionLog = useMemo(() => {
    if (!scorecard?.auditLogs || scorecard.status !== 'Needs Revision') return null;
    const logs = [...scorecard.auditLogs].reverse();
    return logs.find(l => l.action === 'REVISION_REQUESTED') || logs[0];
  }, [scorecard]);

  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSaveDraftReview = async () => {
    setSaving(true);
    try {
      const res = await saveManagerReview(scorecardId, {
        items: items.map(i => ({
          kpi_id: i.kpi_id,
          manager_score: i.manager_score,
          manager_notes: i.manager_notes
        })),
        overall_manager_notes: overallNotes,
        managerId: currentUser?.id
      });
      if (res.success) {
        showToast('Manager review draft saved successfully!', 'success');
        if (onUpdated) onUpdated();
      } else {
        showToast('Failed to save draft: ' + res.message, 'error');
      }
    } catch (err) {
      showToast('Error saving draft: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeReview = async () => {
    const unrated = items.filter(i => !i.manager_score || i.manager_score === 0).length;
    if (unrated > 0) {
      const confirmUnrated = window.confirm(`There are ${unrated} criteria with a score of 0. Finalize anyway?`);
      if (!confirmUnrated) return;
    }

    setFinalizing(true);
    try {
      const res = await finalizeReview(scorecardId, {
        items: items.map(i => ({
          kpi_id: i.kpi_id,
          manager_score: i.manager_score,
          manager_notes: i.manager_notes
        })),
        overall_manager_notes: overallNotes,
        managerId: currentUser?.id,
        managerName: currentUser?.name
      });
      if (res.success) {
        showToast(`Evaluation finalized for ${scorecard.employee_name}! Composite: ${res.final_composite_score} (${res.tier})`, 'success');
        if (onUpdated) onUpdated();
        onClose();
      } else {
        showToast('Finalize failed: ' + res.message, 'error');
      }
    } catch (err) {
      showToast('Error finalizing evaluation: ' + err.message, 'error');
    } finally {
      setFinalizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00191c]/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh] my-4 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#ffffff] border-b border-[#ebebeb] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-[2px] bg-[#032125] text-[#abffae] flex items-center justify-center font-[475] border border-[#0b363b]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-[475] text-[#032125]">Manager Evaluation & Review</h2>
                {scorecard && (
                  <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[#e2f4ff] text-[#123a88] font-[475] border border-[#a1c2c6]">
                    {scorecard.employee_name} ({scorecard.employee_level} BA)
                  </span>
                )}
                {scorecard?.status === 'Needs Revision' && (
                  <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[#fdf0e9] text-[#863d1c] font-semibold border border-[#863d1c]">
                    Revision Requested
                  </span>
                )}
              </div>
              <p className="text-xs text-[#354d51] font-[475] mt-0.5">
                Official Reviewer: {currentUser?.name} &bull; Side-by-side Self vs Manager Rating
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#354d51] hover:text-[#032125] p-2 rounded-full hover:bg-[#fafafa] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-7 h-7 border-2 border-[#032125] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs text-[#354d51]">Loading evaluation scorecard...</span>
          </div>
        ) : !scorecard ? (
          <div className="p-8 text-center text-[#354d51]">Scorecard data unavailable.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fffcf6]">
            
            {/* Prominent Warning Banner if Needs Revision */}
            {scorecard.status === 'Needs Revision' && (
              <div className="p-4 bg-[#fdf0e9] border border-[#863d1c] rounded-[2px] flex items-start space-x-3.5">
                <div className="p-1.5 bg-[#ffffff] text-[#863d1c] rounded-[2px] border border-[#863d1c] shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-[#863d1c]" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-semibold text-[#863d1c]">
                      Executive Revision Requested by {latestRevisionLog?.author_name || 'Executive Management (Ahmed Nasser / Nour Asser)'}
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono font-bold bg-[#ffffff] text-[#863d1c] border border-[#863d1c]">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-[#863d1c] leading-relaxed font-[475] bg-[#ffffff] p-3 rounded-[2px] border border-[#ebebeb] italic">
                    "{latestRevisionLog?.comment || 'Executive management has requested adjustments. Inspect per-criterion feedback tags below.'}"
                  </p>
                  <p className="text-[11px] text-[#863d1c] font-[475]">
                    Please inspect each criterion containing highlighted <strong>👔 Executive Feedback</strong> tags below, adjust your official manager scores (1-10) and notes, then click <strong>"Re-Finalize & Send to Management"</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#354d51] font-[475]">Employee Self-Score</div>
                  <div className="text-xl font-[475] font-mono text-[#032125]">
                    {scorecard.self_composite_score.toFixed(2)} <span className="text-xs text-[#354d51]">/ 10</span>
                  </div>
                </div>

                <div className="border-l border-[#ebebeb] pl-6">
                  <div className="text-[10px] uppercase tracking-wider text-[#437278] font-[475]">Live Manager Score</div>
                  <div className="text-2xl font-[475] font-mono text-[#032125]">
                    {liveCompositeScore.toFixed(2)} <span className="text-xs text-[#354d51]">/ 10</span>
                  </div>
                </div>

                <div className="border-l border-[#ebebeb] pl-6">
                  <div className="text-[10px] uppercase tracking-wider text-[#354d51] font-[475]">Projected Tier</div>
                  <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${liveTier.bg}`}>
                    {liveTier.name}
                  </span>
                  <div className="text-[10px] text-[#354d51] mt-0.5">{liveTier.desc}</div>
                </div>
              </div>

              {/* Dynamic Weights Mini-table */}
              <div className="text-xs text-[#354d51] flex items-center space-x-3">
                <span className="font-[475]">Level: <strong className="text-[#032125]">{scorecard.employee_level}</strong></span>
                <span className="px-2 py-0.5 rounded-[2px] bg-[#fafafa] text-[11px] font-mono text-[#032125] border border-[#ebebeb]">
                  Dynamic Weights Applied
                </span>
              </div>
            </div>

            {/* Overall Manager Notes */}
            <div className="bg-[#ffffff] p-4 rounded-[2px] border border-[#ebebeb] space-y-2">
              <label className="text-xs font-[475] text-[#032125] uppercase tracking-wider flex items-center space-x-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#437278]" />
                <span>Overall Manager Performance Feedback (Visible to BA & Auditor):</span>
              </label>
              <textarea
                rows={3}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Enter comprehensive quarterly evaluation comments, key achievements, squad feedback, and promotion/PIP recommendations..."
                className="w-full bg-[#ffffff] border border-[#ebebeb] rounded-[2px] p-3 text-xs text-[#032125] placeholder-[#354d51]/50 focus:outline-none focus:shadow-glow-verdant focus:border-[#032125] transition-all font-[475]"
              />
            </div>

            {/* Categories & Granular Scoring */}
            <div className="space-y-4">
              <h3 className="text-xs font-[475] text-[#032125] uppercase tracking-wider">
                Granular Criteria Scoring (Side-by-Side Review)
              </h3>

              {categoryCalculations.map((cat) => {
                const isCollapsed = collapsedCategories[cat.category_id];

                return (
                  <div key={cat.category_id} className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] overflow-hidden">
                    {/* Category Title Bar */}
                    <div
                      onClick={() => toggleCategory(cat.category_id)}
                      className="px-5 py-3 bg-[#fafafa] hover:bg-[#fffcf6] cursor-pointer flex items-center justify-between border-b border-[#ebebeb] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-[2px] bg-[#032125] text-[#abffae] font-mono text-xs flex items-center justify-center">
                          {cat.category_id}
                        </span>
                        <span className="font-[475] text-[#032125] text-sm">{cat.category_name}</span>
                        <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-[2px] bg-[#e2f4ff] text-[#123a88] border border-[#a1c2c6]">
                          Weight: {cat.weight_percentage}%
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right text-xs">
                          <span className="text-[#354d51]">Category Avg: </span>
                          <strong className="text-[#032125] font-mono text-sm">{cat.live_manager_avg}</strong>
                          <span className="text-[#354d51] font-mono"> / 10</span>
                        </div>
                        <div className="text-right text-xs font-mono text-[#354d51]">
                          +{cat.live_weighted_points} pts
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-[#354d51]" /> : <ChevronUp className="w-4 h-4 text-[#354d51]" />}
                      </div>
                    </div>

                    {/* Criteria Sub-points */}
                    {!isCollapsed && (
                      <div className="divide-y divide-[#ebebeb] p-3 space-y-3">
                        {cat.items.map((item) => {
                          const selfVal = item.self_score || 0;
                          const mgrVal = item.manager_score || 0;
                          const delta = (mgrVal && selfVal) ? (mgrVal - selfVal).toFixed(1) : null;

                          return (
                            <div key={item.kpi_id} className="pt-3 pb-2 space-y-2">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                {/* Title & Tooltip */}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="px-1.5 py-0.5 rounded-[2px] bg-[#fafafa] text-[11px] font-mono font-[475] text-[#032125] border border-[#ebebeb]">
                                      {item.code}
                                    </span>
                                    <span className="text-xs font-[475] text-[#032125]">
                                      {item.title}
                                    </span>
                                    <Tooltip title={`${item.code} ${item.title}`} text={item.tooltip} />
                                  </div>
                                </div>

                                {/* Comparison Controls */}
                                <div className="flex items-center space-x-3 shrink-0">
                                  {/* Self Score Display */}
                                  <div className="text-center px-2 py-1 bg-[#fafafa] rounded-[2px] border border-[#ebebeb]">
                                    <div className="text-[9px] uppercase font-[475] text-[#354d51]">Self</div>
                                    <div className="text-xs font-mono font-[475] text-[#032125]">{selfVal || '-'}</div>
                                  </div>

                                  {/* Manager Score Selector 1-10 */}
                                  <div className="flex items-center space-x-1 bg-[#ffffff] p-0.5 rounded-[2px] border border-[#ebebeb]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                      const isSelected = mgrVal === num;
                                      let colorClass = 'hover:bg-[#fafafa] text-[#354d51] border border-transparent';
                                      if (isSelected) {
                                        colorClass = 'bg-[#032125] text-[#ffffff] font-mono font-[475] border border-[#032125]';
                                      }

                                      return (
                                        <button
                                          key={num}
                                          type="button"
                                          onClick={() => handleManagerScoreChange(item.kpi_id, num)}
                                          className={`w-6 h-6 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${colorClass}`}
                                        >
                                          {num}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Delta Badge */}
                                  {delta !== null && (
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-[475] ${
                                      Number(delta) > 0 ? 'bg-[#eafde8] text-[#032125] border border-[#abffae]' :
                                      Number(delta) < 0 ? 'bg-[#fdf0e9] text-[#863d1c] border border-[#863d1c]' :
                                      'bg-[#fafafa] text-[#354d51] border border-[#ebebeb]'
                                    }`}>
                                      {Number(delta) > 0 ? `+${delta}` : delta}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Executive Auditor Comment Badge (Ahmed Nasser / Nour Asser) */}
                              {item.auditor_comment && (
                                <div className="pl-6 pt-1">
                                  <div className="p-2.5 bg-[#fdf0e9] border border-[#863d1c] rounded-[2px] flex items-start space-x-2 text-xs">
                                    <span className="text-sm select-none shrink-0">👔</span>
                                    <div className="space-y-0.5">
                                      <div className="font-[475] text-[#863d1c] text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                                        <span>Executive Feedback (Ahmed Nasser / Nour Asser):</span>
                                      </div>
                                      <p className="text-[#863d1c] italic leading-relaxed font-[475]">
                                        "{item.auditor_comment}"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Manager Specific Note for this Item */}
                              <div className="pl-6">
                                <input
                                  type="text"
                                  value={item.manager_notes}
                                  onChange={(e) => handleNoteChange(item.kpi_id, e.target.value)}
                                  placeholder="Specific feedback note for this sub-point (optional)..."
                                  className="w-full bg-[#ffffff] border border-[#ebebeb] rounded-[2px] px-3 py-1.5 text-xs text-[#032125] placeholder-[#354d51]/50 focus:outline-none focus:shadow-glow-verdant focus:border-[#032125] font-[475]"
                                />
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
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#ffffff] border-t border-[#ebebeb] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-[#354d51] font-[475]">Live Final Composite:</span>
            <span className="text-xl font-[475] text-[#032125] font-mono">{liveCompositeScore.toFixed(2)}</span>
            <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${liveTier.bg}`}>{liveTier.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveDraftReview}
              disabled={saving || loading}
              className="rounded-full px-4 py-2 bg-[#ffffff] hover:bg-[#fafafa] text-[#032125] text-xs font-[475] border border-[#ebebeb] transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#437278]" />
              <span>{saving ? 'Saving...' : 'Save Draft Grades'}</span>
            </button>

            <button
              onClick={handleFinalizeReview}
              disabled={finalizing || loading}
              className="rounded-full px-5 py-2 bg-[#abffae] hover:bg-[#96f599] text-[#032125] text-xs font-[475] border border-[#0b363b] transition-all flex items-center space-x-1.5 cursor-pointer hover:shadow-glow-verdant"
            >
              {scorecard?.status === 'Needs Revision' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{finalizing ? 'Re-Finalizing...' : 'Re-Finalize & Send to Management'}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{finalizing ? 'Finalizing...' : 'Finalize & Send to Management'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
