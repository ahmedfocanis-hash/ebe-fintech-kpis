import React from 'react';
import { X, Award, ShieldAlert, CheckCircle2, Calculator } from 'lucide-react';

export default function WeightMatrixModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00191c]/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-[2px] max-w-3xl w-full overflow-hidden animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#ffffff] border-b border-[#ebebeb] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#032125] rounded-[2px] text-[#abffae] border border-[#0b363b]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-[475] text-[#032125]">Fintech BA Dynamic Weight & Scoring Architecture</h2>
              <p className="text-xs text-[#354d51] font-[475]">Official Q3 Evaluation Weights by Role Level</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#354d51] hover:text-[#032125] p-1.5 rounded-full hover:bg-[#fafafa] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-[#fffcf6]">
          {/* Tier Thresholds */}
          <div>
            <h3 className="text-xs font-[475] text-[#032125] uppercase tracking-wider mb-3">
              Performance Tiers & Bonus Multipliers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#eafde8] border border-[#abffae] rounded-[2px] flex items-start space-x-3">
                <Award className="w-5 h-5 text-[#032125] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-[475] text-[#032125] uppercase tracking-wide">Top Performer</div>
                  <div className="text-lg font-[475] text-[#032125] font-mono">Score &ge; 8.4</div>
                  <div className="text-xs text-[#354d51] mt-1 font-[475]">Promotion eligible &bull; 1.5x Bonus</div>
                </div>
              </div>

              <div className="p-3.5 bg-[#e2f4ff] border border-[#a1c2c6] rounded-[2px] flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#123a88] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-[475] text-[#123a88] uppercase tracking-wide">Solid Contributor</div>
                  <div className="text-lg font-[475] text-[#123a88] font-mono">6.0 &le; Score &lt; 8.4</div>
                  <div className="text-xs text-[#354d51] mt-1 font-[475]">Standard progression &bull; 1.0x Bonus</div>
                </div>
              </div>

              <div className="p-3.5 bg-[#fdf0e9] border border-[#863d1c] rounded-[2px] flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-[#863d1c] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-[475] text-[#863d1c] uppercase tracking-wide">Needs Improvement</div>
                  <div className="text-lg font-[475] text-[#863d1c] font-mono">Score &lt; 6.0</div>
                  <div className="text-xs text-[#354d51] mt-1 font-[475]">Mandatory PIP &bull; Bonus Ineligible</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Weight Matrix Table */}
          <div>
            <h3 className="text-xs font-[475] text-[#032125] uppercase tracking-wider mb-3">
              Category Weights by Role Level
            </h3>
            <div className="overflow-x-auto border border-[#ebebeb] rounded-[2px] bg-[#ffffff]">
              <table className="w-full text-left text-sm text-[#032125]">
                <thead className="bg-[#fafafa] text-xs text-[#354d51] uppercase font-[475] border-b border-[#ebebeb]">
                  <tr>
                    <th className="py-2.5 px-4">KPI Category</th>
                    <th className="py-2.5 px-3 text-center text-[#83611c]">Junior</th>
                    <th className="py-2.5 px-3 text-center text-[#123a88]">Mid-Level</th>
                    <th className="py-2.5 px-3 text-center text-[#032125]">Senior BA</th>
                    <th className="py-2.5 px-3 text-center text-[#437278]">Lead BA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">1. Requirements Quality</td>
                    <td className="py-2.5 px-3 text-center font-mono">20%</td>
                    <td className="py-2.5 px-3 text-center font-mono font-[475] text-[#123a88]">25%</td>
                    <td className="py-2.5 px-3 text-center font-mono font-[475] text-[#032125]">30%</td>
                    <td className="py-2.5 px-3 text-center font-mono">15%</td>
                  </tr>
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">2. Delivery & Timeliness</td>
                    <td className="py-2.5 px-3 text-center font-mono font-[475] text-[#83611c]">30%</td>
                    <td className="py-2.5 px-3 text-center font-mono">20%</td>
                    <td className="py-2.5 px-3 text-center font-mono">15%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                  </tr>
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">3. Domain & Process Knowledge</td>
                    <td className="py-2.5 px-3 text-center font-mono">5%</td>
                    <td className="py-2.5 px-3 text-center font-mono">15%</td>
                    <td className="py-2.5 px-3 text-center font-mono">20%</td>
                    <td className="py-2.5 px-3 text-center font-mono font-[475] text-[#437278]">25%</td>
                  </tr>
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">4. Stakeholder Comms & Prioritization</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono font-[475] text-[#437278]">20%</td>
                  </tr>
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">5. Documentation & Traceability</td>
                    <td className="py-2.5 px-3 text-center font-mono font-[475] text-[#83611c]">25%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">5%</td>
                    <td className="py-2.5 px-3 text-center font-mono">5%</td>
                  </tr>
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">6. Collaboration & Teamwork</td>
                    <td className="py-2.5 px-3 text-center font-mono">5%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                  </tr>
                  <tr className="hover:bg-[#fafafa]">
                    <td className="py-2.5 px-4 font-[475] text-[#032125]">7. Governance, Attitude & Ownership</td>
                    <td className="py-2.5 px-3 text-center font-mono">5%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">10%</td>
                    <td className="py-2.5 px-3 text-center font-mono">15%</td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#fafafa] font-[475] text-[#032125] border-t border-[#ebebeb]">
                  <tr>
                    <td className="py-2.5 px-4 uppercase text-xs tracking-wider">Total Allocation</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#032125]">100%</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#032125]">100%</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#032125]">100%</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#032125]">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="p-4 bg-[#ffffff] border border-[#ebebeb] rounded-[2px] space-y-2 text-xs text-[#354d51]">
            <div className="font-[475] text-[#032125] text-xs">Calculation Formula:</div>
            <ol className="list-decimal list-inside space-y-1 text-[#354d51] font-[475]">
              <li><strong className="text-[#032125]">Category Score</strong> = Simple average of all granular items within that category (1 to 10).</li>
              <li><strong className="text-[#032125]">Category Weighted Points</strong> = (Category Score &times; Category Weight %).</li>
              <li><strong className="text-[#032125]">Final Composite Score</strong> = Sum of all 7 Category Weighted Points.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#ffffff] border-t border-[#ebebeb] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 bg-[#ffffff] hover:bg-[#fafafa] text-[#032125] border border-[#ebebeb] text-xs font-[475] transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
