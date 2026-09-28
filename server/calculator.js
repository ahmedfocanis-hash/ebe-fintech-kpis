import { CATEGORIES, KPIS, CATEGORY_WEIGHTS } from './taxonomy.js';

export function calculateScorecard(level, items, scoreType = 'manager') {
  // scoreType can be 'manager' or 'self'
  const weightMap = CATEGORY_WEIGHTS[level] || CATEGORY_WEIGHTS['Mid'];
  
  // Group items by category_id
  const categoryBreakdown = CATEGORIES.map(cat => {
    const catKpis = KPIS.filter(k => k.category_id === cat.id);
    const catItems = items.filter(item => {
      const kpi = catKpis.find(k => k.id === item.kpi_id);
      return !!kpi;
    });

    const weight = weightMap[cat.id] || 0;

    let totalScore = 0;
    let scoredCount = 0;

    catItems.forEach(item => {
      const score = scoreType === 'manager' 
        ? (item.manager_score !== undefined && item.manager_score !== null ? Number(item.manager_score) : 0)
        : (item.self_score !== undefined && item.self_score !== null ? Number(item.self_score) : 0);
      
      if (score > 0) {
        totalScore += score;
        scoredCount++;
      }
    });

    const averageScore = catKpis.length > 0 ? (totalScore / catKpis.length) : 0;
    const weightedPoints = (averageScore * weight) / 100;

    return {
      category_id: cat.id,
      category_name: cat.name,
      weight_percentage: weight,
      items_count: catKpis.length,
      scored_count: scoredCount,
      average_score: Number(averageScore.toFixed(2)),
      weighted_points: Number(weightedPoints.toFixed(3))
    };
  });

  const compositeScore = categoryBreakdown.reduce((sum, cat) => sum + cat.weighted_points, 0);
  const roundedComposite = Number(compositeScore.toFixed(2));

  let tier = 'Pending';
  let tierDescription = 'Pending complete evaluation';
  let bonusMultiplier = 'N/A';

  if (roundedComposite >= 8.4) {
    tier = 'Top Performer';
    tierDescription = 'Eligible for promotion, 1.5x bonus';
    bonusMultiplier = '1.5x';
  } else if (roundedComposite >= 6.0) {
    tier = 'Solid Contributor';
    tierDescription = 'Standard progression, 1.0x bonus';
    bonusMultiplier = '1.0x';
  } else if (roundedComposite > 0) {
    tier = 'Needs Improvement';
    tierDescription = 'Mandatory PIP, bonus ineligible';
    bonusMultiplier = '0.0x';
  }

  return {
    composite_score: roundedComposite,
    tier,
    tier_description: tierDescription,
    bonus_multiplier: bonusMultiplier,
    category_breakdown: categoryBreakdown
  };
}
