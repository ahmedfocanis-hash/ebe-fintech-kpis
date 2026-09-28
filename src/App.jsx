import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import EmployeeView from './views/EmployeeView';
import TeamLeadView from './views/TeamLeadView';
import AuditorView from './views/AuditorView';
import WeightMatrixModal from './components/WeightMatrixModal';
import Toast from './components/Toast';
import { ArrowLeft } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [inspectUserId, setInspectUserId] = useState(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Clear inspectUserId when user changes
  useEffect(() => {
    setInspectUserId(null);
  }, [currentUser?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-warm flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-spruce-900 border-t-transparent rounded-full animate-spin" />
          <div className="text-spruce-mist font-[475] text-sm">Initializing EBE Fintech BA Portal...</div>
        </div>
      </div>
    );
  }

  // Goal 3.1: If no user is logged in, show ONLY the polished login landing page
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <Toast />
      </>
    );
  }

  // Goal 3.2: Strict Role-Based View Rendering
  return (
    <div className="min-h-screen bg-cream-warm text-spruce-900 flex flex-col font-sans selection:bg-verdant-300 selection:text-spruce-900">
      {/* Global Header */}
      <Header
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
      />

      {/* Breadcrumb if Team Lead or Auditor is inspecting a specific employee scorecard */}
      {inspectUserId && (currentUser.role === 'TEAM_LEAD' || currentUser.role === 'EXECUTIVE_AUDITOR') && (
        <div className="bg-spruce-900 border-b border-spruce-700 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setInspectUserId(null)}
              className="inline-flex items-center space-x-2 text-xs font-[475] text-verdant-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                Back to {currentUser.role === 'TEAM_LEAD' ? 'Team Lead Dashboard' : 'Executive Leaderboard'}
              </span>
            </button>
            <span className="text-xs text-spruce-200 font-mono">
              Drill-down Scorecard Mode
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace View */}
      <main className="flex-1 pb-16">
        {/* If BA logs in, they see ONLY their personal KPI scorecard */}
        {currentUser.role === 'EMPLOYEE' && (
          <EmployeeView 
            targetUserId={currentUser.id} 
          />
        )}

        {/* If Team Lead (Ahmed Hashim) logs in */}
        {currentUser.role === 'TEAM_LEAD' && (
          inspectUserId ? (
            <EmployeeView targetUserId={inspectUserId} />
          ) : (
            <TeamLeadView 
              onInspectScorecard={(uid) => setInspectUserId(uid)} 
            />
          )
        )}

        {/* If Executive Manager (Ahmed Nasser / Nour Asser) logs in */}
        {currentUser.role === 'EXECUTIVE_AUDITOR' && (
          inspectUserId ? (
            <EmployeeView targetUserId={inspectUserId} />
          ) : (
            <AuditorView 
              onInspectScorecard={(uid) => setInspectUserId(uid)} 
            />
          )
        )}
      </main>

      {/* Scoring Rules Modal */}
      <WeightMatrixModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
      />

      {/* Global Toast */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
