/**
 * Grateful Relief Loan Manager - Application Entry Point
 * Company: Grateful Relief Program Limited (Nigeria)
 * Currency: NGN (₦) | Timezone: Africa/Lagos
 */

import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import { TabType, Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DailyCollectionsView } from './components/DailyCollectionsView';
import { BorrowersView } from './components/BorrowersView';
import { LoanApplicationsView } from './components/LoanApplicationsView';
import { DisbursementView } from './components/DisbursementView';
import { ActiveLoansView } from './components/ActiveLoansView';
import { OverdueLoansView } from './components/OverdueLoansView';
import { ExpenseManagerView } from './components/ExpenseManagerView';
import { ReconciliationView } from './components/ReconciliationView';
import { AccountingReportsView } from './components/AccountingReportsView';
import { InvestorManagementView } from './components/InvestorManagementView';
import { StaffManagementView } from './components/StaffManagementView';
import { CompanyBranchesView } from './components/CompanyBranchesView';
import { AuditTrailView } from './components/AuditTrailView';
import { LoginView } from './components/LoginView';

// Modals
import { ReceiptModal } from './components/ReceiptModal';
import { LoanAgreementModal } from './components/LoanAgreementModal';
import { RepaymentScheduleModal } from './components/RepaymentScheduleModal';
import { TestSuiteModal } from './components/TestSuiteModal';
import { DatabaseDocsModal } from './components/DatabaseDocsModal';
import { ThemeMode, getInitialTheme, applyTheme } from './services/theme';
import { Repayment, Loan, Borrower, SystemNotification } from './types';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('grp_auth_active') !== 'false';
  });
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentUser, setCurrentUser] = useState(dbService.getCurrentUser());
  const [users, setUsers] = useState(dbService.getUsers());
  const [notifications, setNotifications] = useState<SystemNotification[]>(dbService.getNotifications());

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  // Modal states
  const [activeReceipt, setActiveReceipt] = useState<{ repayment: Repayment; loan?: Loan | null } | null>(null);
  const [activeAgreementLoan, setActiveAgreementLoan] = useState<Loan | null>(null);
  const [activeScheduleLoan, setActiveScheduleLoan] = useState<Loan | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // App metrics for sidebar badges
  const applications = dbService.getApplications();
  const pendingApprovalsCount = applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const pendingDisbursementsCount = applications.filter(a => a.status === 'approved').length;
  const overdueLoansCount = dbService.getLoans().filter(l => l.status === 'overdue').length;
  const pendingExpensesCount = dbService.getExpenses().filter(e => e.status === 'pending').length;

  const handleSwitchUser = (userId: string) => {
    const switched = dbService.switchUser(userId);
    setCurrentUser({ ...switched });
  };

  const handleResetData = () => {
    dbService.resetToDemoData();
    setCurrentUser(dbService.getCurrentUser());
    setUsers(dbService.getUsers());
    setNotifications(dbService.getNotifications());
    alert('System database reset to initial demonstration fixtures successfully.');
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    dbService.markNotificationAsRead(notif.id);
    setNotifications(dbService.getNotifications());
    if (notif.linkTab) {
      setCurrentTab(notif.linkTab as TabType);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLoginSuccess={user => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('grp_auth_active', 'true');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSwitchUser={handleSwitchUser}
        onOpenTests={() => setIsTestModalOpen(true)}
        onOpenDocs={() => setIsDocsModalOpen(true)}
        onResetData={handleResetData}
        onSignOut={() => {
          setIsAuthenticated(false);
          localStorage.setItem('grp_auth_active', 'false');
        }}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
      />

      {/* Main Body with Sidebar + Tab Workspace */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          userRole={currentUser.role}
          pendingApprovalsCount={pendingApprovalsCount}
          pendingDisbursementsCount={pendingDisbursementsCount}
          overdueLoansCount={overdueLoansCount}
          pendingExpensesCount={pendingExpensesCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToTab={tab => setCurrentTab(tab)}
              onViewReceipt={repayment => {
                const loan = dbService.getLoans().find(l => l.id === repayment.loanId);
                setActiveReceipt({ repayment, loan });
              }}
            />
          )}

          {currentTab === 'collections' && (
            <DailyCollectionsView
              onRepaymentRecorded={(repayment, loan) => {
                setActiveReceipt({ repayment, loan });
              }}
              onViewSchedule={loan => setActiveScheduleLoan(loan)}
            />
          )}

          {currentTab === 'borrowers' && (
            <BorrowersView
              onSelectBorrowerLoans={() => setCurrentTab('loans')}
            />
          )}

          {currentTab === 'applications' && (
            <LoanApplicationsView
              onApplicationApproved={() => setCurrentTab('disbursements')}
            />
          )}

          {currentTab === 'disbursements' && (
            <DisbursementView
              onLoanDisbursed={loan => {
                setActiveAgreementLoan(loan);
              }}
              onViewAgreement={loan => {
                setActiveAgreementLoan(loan);
              }}
            />
          )}

          {currentTab === 'loans' && (
            <ActiveLoansView
              onViewSchedule={loan => setActiveScheduleLoan(loan)}
              onViewAgreement={loan => setActiveAgreementLoan(loan)}
            />
          )}

          {currentTab === 'overdue' && (
            <OverdueLoansView
              onCollectPayment={() => setCurrentTab('collections')}
            />
          )}

          {currentTab === 'expenses' && <ExpenseManagerView />}

          {currentTab === 'reconciliation' && <ReconciliationView />}

          {currentTab === 'reports' && <AccountingReportsView />}

          {currentTab === 'investors' && <InvestorManagementView />}

          {currentTab === 'staff' && (
            <StaffManagementView
              onStaffUpdated={() => setUsers(dbService.getUsers())}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {currentTab === 'branches' && <CompanyBranchesView />}

          {currentTab === 'audit' && <AuditTrailView />}
        </main>
      </div>

      {/* Global Modals */}
      {activeReceipt && (
        <ReceiptModal
          repayment={activeReceipt.repayment}
          loan={activeReceipt.loan}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {activeAgreementLoan && (
        <LoanAgreementModal
          loan={activeAgreementLoan}
          onClose={() => setActiveAgreementLoan(null)}
        />
      )}

      {activeScheduleLoan && (
        <RepaymentScheduleModal
          loan={activeScheduleLoan}
          installments={dbService.getScheduleForLoan(activeScheduleLoan.id)}
          onClose={() => setActiveScheduleLoan(null)}
        />
      )}

      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      <DatabaseDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
}
