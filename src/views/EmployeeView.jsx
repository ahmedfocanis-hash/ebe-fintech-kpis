import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchScorecardByUserId, 
  saveSelfRatings, 
  submitScorecard
} from '../utils/api';
import Tooltip from '../components/Tooltip';
import Avatar from '../components/Avatar';
import { 
  Award, 
  Send, 
  Save, 
  Layers, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle
} from 'lucide-react';

export default function EmployeeView({ targetUserId, onSwitchView }) {
  const { currentUser, showToast, users } = useAuth();

  const effectiveUserId = useMemo(() => {
    if (targetUserId) return Number(targetUserId);
    if (currentUser?.role === 'EMPLOYEE') return Number(currentUser.id);
    if (currentUser?.id) return Number(currentUser.id);
    const emp = users.find(u => u.role === 'EMPLOYEE');
    return emp ? Number(emp.id) : null;
  }, [targetUserId, currentUser, users]);

  const [scorecard, setScorecard] = useState(null);
  const [itemsState, setItemsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const loadScorecard = async () => {
    setLoading(true);
    try {
      const data = await fetchScorecardByUserId(effectiveUserId);
      if (data.success && data.scorecard) {
        setScorecard(data.scorecard);
        setItemsState(data.scorecard.items.map(item => ({
          kpi_id: item.kpi_id,
          self_score: item.self_score || 0,
          manager_score: item.manager_score || 0,
          manager_notes: item.manager_notes || '',
          code: item.code,
          title: item.title,
          tooltip: item.tooltip,
          category_id: item.category_id,
          order_idx: item.order_idx
        })));
      }
    } catch (err) {
      console.error('Failed to load scorecard:', err);
      showToast('Error loading scorecard: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScorecard();
  }, [effectiveUserId]);

  const isReadOnly = scorecard?.status === 'Submitted' || scorecard?.status === 'Reviewed' || scorecard?.status === 'Audited' || scorecard?.status === 'Needs Revision';

  const handleScoreChange = (kpiId, score) => {
    if (isReadOnly) return;
    setItemsState(prev => prev.map(item => 
      item.kpi_id === kpiId ? { ...item, self_score: score } : item
    ));
  };

  const categoriesWithItems = useMemo(() => {
    if (!scorecard || !itemsState.length) return [];
    
    const grouped = {};
    itemsState.forEach(item => {
      if (!grouped[item.category_id]) {
        grouped[item.category_id] = [];
      }
      grouped[item.category_id].push(item);
    });

    const isReviewedOrAudited = scorecard.status === 'Reviewed' || scorecard.status === 'Audited';

    return (scorecard.calculations?.category_breakdown || scorecard.managerCalculations?.category_breakdown || scorecard.selfCalculations?.category_breakdown || []).map(cat => {
      const items = grouped[cat.category_id] || [];
      const totalScore = items.reduce((acc, curr) => {
        const val = isReviewedOrAudited 
          ? (curr.manager_score != null && curr.manager_score > 0 ? Number(curr.manager_score) : (Number(curr.self_score) || 0))
          : (Number(curr.self_score) || 0);
        return acc + val;
      }, 0);
      const avgScore = items.length > 0 ? (totalScore / items.length) : 0;
      const weightedScore = (avgScore * cat.weight_percentage) / 100;

      return {
        ...cat,
        items,
        live_avg: Number(avgScore.toFixed(2)),
        live_weighted: Number(weightedScore.toFixed(3))
      };
    });
  }, [scorecard, itemsState]);

  const liveCompositeScore = useMemo(() => {
    const sum = categoriesWithItems.reduce((acc, cat) => acc + cat.live_weighted, 0);
    return Number(sum.toFixed(2));
  }, [categoriesWithItems]);

  const liveTier = useMemo(() => {
    if (liveCompositeScore >= 8.4) return { name: 'Top Performer', badgeClass: 'bg-[#eafde8] text-[#032125] border-[#ebebeb]' };
    if (liveCompositeScore >= 6.0) return { name: 'Solid Contributor', badgeClass: 'bg-[#e2f4ff] text-[#123a88] border-[#ebebeb]' };
    if (liveCompositeScore > 0) return { name: 'Needs Improvement', badgeClass: 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]/40' };
    return { name: 'Unrated', badgeClass: 'bg-[#fafafa] text-[#354d51] border-[#ebebeb]' };
  }, [liveCompositeScore]);

  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleSaveDraft = async () => {
    if (!scorecard) return;
    setSaving(true);
    try {
      const res = await saveSelfRatings(scorecard.id, itemsState.map(i => ({
        kpi_id: i.kpi_id,
        self_score: i.self_score
      })));
      if (res.success) {
        showToast('Self-ratings draft saved successfully!', 'success');
        await loadScorecard();
      } else {
        showToast('Failed to save draft: ' + res.message, 'error');
      }
    } catch (err) {
      showToast('Error saving draft: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!scorecard) return;
    
    const unratedCount = itemsState.filter(i => !i.self_score || i.self_score === 0).length;
    if (unratedCount > 0) {
      const confirmIncomplete = window.confirm(
        `Notice: You have ${unratedCount} unrated criteria (score = 0). Do you want to submit anyway?`
      );
      if (!confirmIncomplete) return;
    }

    setSubmitting(true);
    try {
      const res = await submitScorecard(scorecard.id, {
        items: itemsState.map(i => ({
          kpi_id: i.kpi_id,
          self_score: i.self_score
        })),
        authorId: currentUser?.id,
        authorName: currentUser?.name
      });
      if (res.success) {
        const isLead = scorecard.employee_role === 'TEAM_LEAD' || scorecard.employee_level === 'Lead';
        showToast(
          isLead
            ? 'Scorecard submitted to Executive Management (Ahmed Nasser & Nour Asser)!'
            : 'Scorecard submitted to Team Lead Ahmed Hashim!',
          'success'
        );
        await loadScorecard();
      } else {
        showToast('Submission error: ' + res.message, 'error');
      }
    } catch (err) {
      showToast('Error submitting scorecard: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#032125] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#354d51] text-xs font-[475]">Loading employee scorecard...</p>
        </div>
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-[#ebebeb] rounded-[2px] p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center mx-auto text-[#437278]">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-[475] text-[#032125]">No Active Scorecard</h3>
          <p className="text-[#354d51] text-xs mt-1">Scorecard record could not be loaded for user ID {effectiveUserId || 'unknown'}.</p>
        </div>
        <button
          type="button"
          onClick={loadScorecard}
          className="px-4 py-2 rounded-full bg-[#032125] text-white text-xs font-[475] hover:bg-[#0b363b] transition-all cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-32">
      
      {/* Top Banner / Employee Profile Card */}
      <div className="bg-white border border-[#ebebeb] rounded-[2px] p-6 card-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <Avatar
              src={scorecard.employee_avatar}
              name={scorecard.employee_name}
              role={scorecard.employee_role}
              level={scorecard.employee_level}
              className="w-14 h-14 rounded-[6px] object-cover"
              initialsClassName="text-base font-[475]"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-[475] text-[#032125] tracking-tight">
                  {scorecard.employee_name}
                </h1>
                <span className="px-2 py-0.5 rounded-[2px] text-xs font-[475] bg-[#e2f4ff] text-[#123a88] border border-[#ebebeb]">
                  {scorecard.employee_level} Level BA
                </span>
                <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                  scorecard.status === 'Audited' ? 'bg-[#0b363b] text-[#abffae] border-[#0b363b]' :
                  scorecard.status === 'Reviewed' ? 'bg-[#eafde8] text-[#032125] border-[#ebebeb]' :
                  scorecard.status === 'Submitted' ? 'bg-[#e2f4ff] text-[#123a88] border-[#ebebeb]' :
                  scorecard.status === 'Needs Revision' ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]' :
                  'bg-[#fafafa] text-[#354d51] border-[#ebebeb]'
                }`}>
                  Status: {scorecard.status}
                </span>
              </div>

              <p className="text-xs text-[#354d51] font-[475]">
                {scorecard.employee_title} &bull; {scorecard.department}
              </p>

              <div className="flex items-center space-x-4 mt-2 text-xs text-[#437278] font-mono">
                <span>Period: <strong className="text-[#032125]">{scorecard.period}</strong></span>
                {scorecard.self_submitted_at && (
                  <span>Submitted: <strong className="text-[#032125]">{scorecard.self_submitted_at}</strong></span>
                )}
                {scorecard.reviewed_at && (
                  <span>Reviewed: <strong className="text-[#032125]">{scorecard.reviewed_at}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar on Right */}
          <div className="flex items-center gap-4 bg-[#fafafa] p-4 rounded-[2px] border border-[#ebebeb]">
            {isReadOnly ? (
              <>
                <div className="text-center px-3 border-r border-[#ebebeb]">
                  <div className="text-[10px] uppercase text-[#123a88] font-[475] tracking-wider">
                    Official Score
                  </div>
                  <div className="text-2xl font-[475] text-[#032125] font-mono mt-0.5">
                    {scorecard.final_composite_score != null && Number(scorecard.final_composite_score) > 0 
                      ? Number(scorecard.final_composite_score).toFixed(2) 
                      : 'Pending'}
                  </div>
                  <div className="text-[10px] text-[#437278]">by Team Lead</div>
                </div>

                <div className="text-center px-3 border-r border-[#ebebeb]">
                  <div className="text-[10px] uppercase text-[#354d51] font-[475] tracking-wider">
                    Self Rating
                  </div>
                  <div className="text-2xl font-[475] text-[#032125] font-mono mt-0.5">
                    {scorecard.self_composite_score != null ? Number(scorecard.self_composite_score).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-[10px] text-[#437278]">out of 10.0</div>
                </div>
              </>
            ) : (
              <div className="text-center px-3 border-r border-[#ebebeb]">
                <div className="text-[10px] uppercase text-[#354d51] font-[475] tracking-wider">
                  Projected Self
                </div>
                <div className="text-2xl font-[475] text-[#032125] font-mono mt-0.5">
                  {liveCompositeScore.toFixed(2)}
                </div>
                <div className="text-[10px] text-[#437278]">out of 10.0</div>
              </div>
            )}

            <div className="text-center px-3">
              <div className="text-[10px] uppercase text-[#354d51] font-[475] tracking-wider">
                Assigned Tier
              </div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${
                  isReadOnly ? (
                    scorecard.tier === 'Top Performer' ? 'bg-[#eafde8] text-[#032125] border-[#ebebeb]' :
                    scorecard.tier === 'Solid Contributor' ? 'bg-[#e2f4ff] text-[#123a88] border-[#ebebeb]' :
                    scorecard.tier === 'Needs Improvement' ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]/40' :
                    'bg-[#fafafa] text-[#354d51] border-[#ebebeb]'
                  ) : liveTier.badgeClass
                }`}>
                  {isReadOnly ? (scorecard.tier || 'Pending') : liveTier.name}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Weight Allocation Bar for this Employee's Level */}
        <div className="mt-6 pt-5 border-t border-[#ebebeb]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-[475] text-[#032125] uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#032125]" />
              <span>Dynamic Weights for {scorecard.employee_level} BA:</span>
            </span>
            <span className="text-xs text-[#437278] font-mono">Allocation: 100%</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {categoriesWithItems.map((cat) => (
              <div key={cat.category_id} className="bg-[#fafafa] border border-[#ebebeb] p-2.5 rounded-[2px]">
                <div className="flex items-center justify-between text-[11px] text-[#354d51] mb-1">
                  <span>Cat {cat.category_id}</span>
                  <span className="font-mono font-bold text-[#032125]">{cat.weight_percentage}%</span>
                </div>
                <div className="text-xs font-[475] text-[#032125] line-clamp-1" title={cat.category_name}>
                  {cat.category_name}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[#437278]">Score:</span>
                  <span className="font-mono font-semibold text-[#032125]">{cat.live_avg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Official Manager & Audit Remarks Banner if Reviewed, Audited, Needs Revision, or has Audit Logs */}
      {(scorecard.status === 'Reviewed' || scorecard.status === 'Audited' || scorecard.status === 'Needs Revision' || (scorecard.auditLogs && scorecard.auditLogs.length > 0)) && (
        <div className={`border rounded-[2px] p-5 space-y-3.5 ${
          scorecard.status === 'Needs Revision'
            ? 'bg-[#fdf0e9] border-[#863d1c]/40 text-[#863d1c]'
            : 'bg-white border-[#ebebeb] text-[#032125]'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-[2px] bg-[#fffcf6] border border-[#ebebeb]">
                {scorecard.status === 'Needs Revision' ? <AlertCircle className="w-5 h-5 text-[#863d1c]" /> : <Award className="w-5 h-5 text-[#032125]" />}
              </div>
              <div>
                <h3 className="text-sm font-[475] text-[#032125]">
                  {scorecard.status === 'Needs Revision' 
                    ? 'Revision Requested by Executive Management' 
                    : (scorecard.status === 'Audited' ? 'Executive Audit Sign-Off Completed' : 'Official Evaluation Review')}
                </h3>
                <p className="text-xs text-[#354d51] font-[475]">
                  {scorecard.employee_role === 'TEAM_LEAD' || scorecard.employee_level === 'Lead'
                    ? 'Governed by Executive Management (Ahmed Nasser & Nour Asser)'
                    : `Reviewed by Team Lead (${scorecard.manager_name || 'Ahmed Mohamed Hashim'})`}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-[2px] text-xs font-[475] border ${
              scorecard.status === 'Needs Revision'
                ? 'bg-[#fdf0e9] text-[#863d1c] border-[#863d1c]'
                : 'bg-[#eafde8] text-[#032125] border-[#ebebeb]'
            }`}>
              {scorecard.status === 'Needs Revision' ? 'Needs Revision' : `${scorecard.tier || 'Evaluated'} (Official)`}
            </span>
          </div>

          {scorecard.overall_manager_notes && (
            <div className="p-3.5 bg-[#fafafa] border border-[#ebebeb] rounded-[2px]">
              <div className="text-[11px] font-[475] uppercase tracking-wider text-[#354d51] mb-1 flex items-center space-x-1.5">
                <MessageSquare className="w-3 h-3 text-[#032125]" />
                <span>
                  {scorecard.employee_role === 'TEAM_LEAD' || scorecard.employee_level === 'Lead'
                    ? 'Executive Auditor Comprehensive Notes:'
                    : 'Team Lead Comprehensive Review Notes:'}
                </span>
              </div>
              <p className="text-xs text-[#032125] leading-relaxed italic">
                "{scorecard.overall_manager_notes}"
              </p>
            </div>
          )}

          {scorecard.auditLogs && scorecard.auditLogs.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#ebebeb]">
              <div className="text-[11px] font-[475] uppercase tracking-wider text-[#354d51]">
                Audit Trail & Executive Governance Instructions:
              </div>
              {scorecard.auditLogs.map(log => (
                <div key={log.id} className="text-xs p-2.5 rounded-[2px] bg-[#fafafa] border border-[#ebebeb] flex items-start justify-between">
                  <div>
                    <span className="font-[475] text-[#032125]">{log.author_name}: </span>
                    <span className="text-[#354d51]">{log.comment}</span>
                  </div>
                  <span className="text-[10px] text-[#437278] font-mono shrink-0 ml-3">{log.created_at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accordion / Cards of 7 Categories and 27 Granular Sub-points */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#ebebeb]">
          <div>
            <h2 className="text-base font-[475] text-[#032125] tracking-tight">Quarterly KPI Scorecard Criteria</h2>
            <p className="text-xs text-[#354d51]">
              {isReadOnly
                ? 'Official ratings finalized. Side-by-side view with manager scores and variance.'
                : 'Enter your self-ratings (1 to 10) for each sub-criterion below. Hover [ ! ] for definitions.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const allOpen = Object.keys(collapsedCategories).length === 0;
              const nextState = {};
              if (allOpen) {
                categoriesWithItems.forEach(c => { nextState[c.category_id] = true; });
              }
              setCollapsedCategories(nextState);
            }}
            className="text-xs text-[#032125] hover:bg-[#fafafa] px-3 py-1.5 rounded-[2px] bg-white border border-[#ebebeb] transition-colors cursor-pointer"
          >
            Toggle All Categories
          </button>
        </div>

        {categoriesWithItems.map((category) => {
          const isCollapsed = collapsedCategories[category.category_id];

          return (
            <div
              key={category.category_id}
              className="bg-white border border-[#ebebeb] rounded-[2px] overflow-hidden card-print"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.category_id)}
                className="px-5 py-3.5 bg-white hover:bg-[#fafafa] cursor-pointer flex items-center justify-between border-b border-[#ebebeb] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-[2px] bg-[#032125] text-white flex items-center justify-center font-mono text-xs font-[475]">
                    {category.category_id}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-[475] text-sm text-[#032125]">{category.category_name}</h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-[2px] bg-[#e2f4ff] text-[#123a88] font-mono border border-[#ebebeb]">
                        Weight: {category.weight_percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs text-[#354d51]">Cat Avg: </span>
                    <strong className="text-sm font-mono text-[#032125] font-[475]">{category.live_avg}</strong>
                    <span className="text-xs text-[#437278]"> / 10</span>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono text-[#437278]">+{category.live_weighted} pts</span>
                  </div>

                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-[#437278]" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-[#437278]" />
                  )}
                </div>
              </div>

              {/* Items List */}
              {!isCollapsed && (
                <div className="divide-y divide-[#ebebeb] p-3 space-y-2">
                  {category.items.map((item) => {
                    const selfVal = item.self_score || 0;
                    const mgrVal = item.manager_score || 0;
                    const delta = (mgrVal && selfVal) ? (mgrVal - selfVal).toFixed(1) : null;

                    return (
                      <div
                        key={item.kpi_id}
                        className="pt-2.5 pb-2 px-2 hover:bg-[#fafafa] rounded-[2px] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                      >
                        {/* Title & Tooltip */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.2 rounded-[2px] bg-[#fafafa] text-[#032125] font-mono text-[11px] font-[475] border border-[#ebebeb]">
                              {item.code}
                            </span>
                            <h4 className="text-xs font-[475] text-[#032125]">
                              {item.title}
                            </h4>
                            <Tooltip
                              title={`${item.code} ${item.title}`}
                              text={item.tooltip}
                            />
                          </div>

                          {/* Manager Note if Available */}
                          {item.manager_notes && (
                            <div className="mt-2 text-xs text-[#354d51] bg-[#fafafa] p-2 rounded-[2px] border border-[#ebebeb] flex items-start space-x-2">
                              <span className="font-[475] text-[#032125] shrink-0">Team Lead Note:</span>
                              <span className="italic">{item.manager_notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Rating Controls & Manager Comparison */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          {/* Self Rating Input / Display */}
                          <div>
                            <div className="text-[10px] text-[#354d51] mb-1 font-[475] flex items-center justify-between">
                              <span>Self:</span>
                              <span className="font-mono text-[#032125] font-bold">{selfVal || '-'}</span>
                            </div>

                            {isReadOnly ? (
                              <div className="px-3 py-1 bg-[#fafafa] border border-[#ebebeb] rounded-[2px] font-mono font-[475] text-[#032125] text-xs">
                                {selfVal ? `${selfVal}/10` : 'N/A'}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-0.5 bg-[#fafafa] p-0.5 rounded-[2px] border border-[#ebebeb]">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                  const isSelected = selfVal === num;
                                  return (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => handleScoreChange(item.kpi_id, num)}
                                      className={`w-6 h-6 rounded-[2px] text-xs font-mono transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#032125] text-white font-[475]'
                                          : 'text-[#354d51] hover:bg-white hover:border hover:border-[#ebebeb]'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Manager Rating Column */}
                          {(scorecard.status === 'Reviewed' || scorecard.status === 'Audited' || scorecard.status === 'Needs Revision') && (
                            <div className="pl-3 border-l border-[#ebebeb] flex items-center space-x-2">
                              <div>
                                <div className="text-[10px] text-[#032125] font-[475] mb-1">
                                  Lead Rating
                                </div>
                                <div className="px-2.5 py-1 bg-[#eafde8] border border-[#ebebeb] rounded-[2px] font-mono font-bold text-[#032125] text-xs text-center">
                                  {mgrVal ? `${mgrVal}/10` : '-'}
                                </div>
                              </div>

                              {delta !== null && (
                                <div className="text-center pt-3">
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] font-[475] ${
                                    Number(delta) > 0 ? 'bg-[#eafde8] text-[#032125]' :
                                    Number(delta) < 0 ? 'bg-[#fdf0e9] text-[#863d1c]' :
                                    'bg-[#fafafa] text-[#437278]'
                                  }`}>
                                    {Number(delta) > 0 ? `+${delta}` : delta}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
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

      {/* Floating / Sticky Action Footer */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#ebebeb] p-4 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-[10px] text-[#354d51] uppercase font-[475]">Live Self-Composite Score</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-[475] text-[#032125] font-mono">
                    {liveCompositeScore.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#437278]">/ 10.0</span>
                </div>
              </div>

              <div className="border-l border-[#ebebeb] pl-6">
                <div className="text-[10px] text-[#354d51] uppercase font-[475]">Projected Tier</div>
                <div className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded-[2px] text-xs font-[475] border ${liveTier.badgeClass}`}>
                    {liveTier.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-white hover:bg-[#fafafa] text-[#032125] text-xs font-[475] border border-[#ebebeb] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#437278]" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-2 rounded-full bg-[#abffae] hover:bg-[#96f799] text-[#032125] text-xs font-[475] transition-all flex items-center justify-center space-x-2 border border-[#abffae] focus-glow cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? 'Submitting...'
                    : (scorecard.employee_role === 'TEAM_LEAD' || scorecard.employee_level === 'Lead' || currentUser?.role === 'TEAM_LEAD')
                      ? 'Submit My Evaluation to Executive Management'
                      : 'Submit to Ahmed Hashim'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
