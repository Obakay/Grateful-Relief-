/**
 * Grateful Relief Loan Manager - Domain Types
 * Company: Grateful Relief Program Limited (Nigeria)
 * Currency: NGN (₦) | Timezone: Africa/Lagos
 */

export type UserRole = 'administrator' | 'loan_officer' | 'auditor' | 'branch_manager' | 'accountant' | 'supervisor';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
  branch: string;
  avatarUrl?: string;
  approvalLimit: number; // in NGN
  isActive: boolean;
  password?: string;
  createdAt: string;
}

export type BorrowerStatus = 'active' | 'pending_verification' | 'blacklisted' | 'inactive';

export interface Borrower {
  id: string;
  borrowerCode: string; // e.g. GRP-BOR-2026-001
  fullName: string;
  phone: string;
  alternatePhone?: string;
  nin: string; // National Identity Number (masked for privacy)
  bvn?: string; // Bank Verification Number (masked)
  residentialAddress: string;
  businessName: string;
  businessAddress: string;
  businessType: 'Market Trader' | 'Provisions' | 'Fabric & Clothing' | 'Food & Catering' | 'Tailoring' | 'Cosmetics' | 'Agriculture' | 'Services' | 'Other';
  marketStallNumber?: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  assignedOfficerId: string;
  assignedOfficerName: string;
  branch: string;
  status: BorrowerStatus;
  creditScoreRating: 'A - Low Risk' | 'B - Moderate Risk' | 'C - High Risk';
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InterestMethod = 'flat' | 'reducing_balance';
export type RepaymentFrequency = 'daily' | 'weekly' | 'monthly';

export interface LoanProduct {
  id: string;
  code: string; // e.g. PROD-DAILY-24
  name: string;
  description: string;
  minPrincipal: number;
  maxPrincipal: number;
  defaultPrincipal: number;
  interestRatePercent: number; // e.g. 20 for 20%
  interestMethod: InterestMethod;
  durationUnits: number; // e.g. 24
  repaymentFrequency: RepaymentFrequency;
  excludeWeekends: boolean; // Exclude Saturdays & Sundays
  gracePeriodDays: number;
  lateFeePercent: number; // e.g. 2% after grace
  isActive: boolean;
  createdAt: string;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'cancelled';

export interface LoanApplication {
  id: string;
  applicationCode: string; // e.g. GRP-APP-2026-0042
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  productId: string;
  productName: string;
  requestedPrincipal: number;
  approvedPrincipal?: number;
  interestRatePercent: number;
  interestCalculationMethod: InterestMethod;
  durationUnits: number;
  repaymentFrequency: RepaymentFrequency;
  proposedDisbursementDate: string;
  repaymentStartDate: string;
  purpose: string;
  status: ApplicationStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export type LoanStatus = 'active' | 'fully_paid' | 'overdue' | 'defaulted' | 'written_off';

export interface Loan {
  id: string;
  loanCode: string; // e.g. GRP-LN-2026-0018
  applicationId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerBusiness: string;
  productId: string;
  productName: string;
  principalAmount: number;
  contractualInterest: number;
  totalScheduledRepayment: number;
  interestRatePercent: number;
  interestMethod: InterestMethod;
  durationUnits: number; // e.g. 24
  repaymentFrequency: RepaymentFrequency;
  dailyScheduledRepayment: number;
  disbursementDate: string;
  repaymentStartDate: string;
  repaymentEndDate: string;
  disbursementMethod: 'cash' | 'bank_transfer';
  disbursementReference: string;
  disbursedBy: string;
  disbursedByName: string;
  approvedBy: string;
  approvedByName: string;
  assignedOfficerId: string;
  assignedOfficerName: string;
  branch: string;
  status: LoanStatus;
  // Repayment tracking
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  outstandingBalance: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  installmentsTotal: number;
  installmentsPaidCount: number;
  lastPaymentDate?: string;
  daysOverdue: number;
  overdueAmount: number;
  createdAt: string;
}

export type InstallmentStatus = 'upcoming' | 'due' | 'paid' | 'partially_paid' | 'overdue';

export interface RepaymentInstallment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  openingBalance: number;
  scheduledPrincipal: number;
  scheduledInterest: number;
  scheduledTotal: number;
  actualPaid: number;
  remainingDue: number;
  status: InstallmentStatus;
  paymentDate?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos';

export interface Repayment {
  id: string;
  receiptNumber: string; // e.g. GRP-RCP-2026-1049
  idempotencyKey: string;
  loanId: string;
  loanCode: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  amount: number;
  principalAllocated: number;
  interestAllocated: number;
  excessAllocated: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy: string;
  collectedByName: string;
  notes?: string;
  isReversed?: boolean;
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  isSynced: boolean; // For offline support
  createdAt: string;
}

export type ExpenseCategory =
  | 'Staff Salaries'
  | 'Office Rent'
  | 'Transportation & Fuel'
  | 'Collection Expenses'
  | 'Administrative'
  | 'Communication & Airtime'
  | 'Utilities'
  | 'Marketing'
  | 'Software & Technology'
  | 'Bank Charges'
  | 'Other Operations';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Expense {
  id: string;
  expenseCode: string; // e.g. GRP-EXP-2026-015
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recipientVendor: string;
  referenceNumber: string;
  submittedBy: string;
  submittedByName: string;
  submittedDate: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  branch: string;
  createdAt: string;
}

export type ReconciliationStatus = 'pending' | 'reconciled' | 'discrepancy_flagged' | 'closed';

export interface ReconciliationSession {
  id: string;
  sessionCode: string; // e.g. GRP-REC-2026-10-23-01
  reconciliationDate: string;
  officerId: string;
  officerName: string;
  branch: string;
  expectedCollections: number;
  actualCashSubmitted: number;
  actualBankTransferConfirmed: number;
  totalCollected: number;
  variance: number; // totalCollected - expectedCollections
  discrepancyReason?: string;
  reconciledBy: string;
  reconciledByName: string;
  status: ReconciliationStatus;
  signedOffAt?: string;
  notes?: string;
}

export interface Investor {
  id: string;
  investorCode: string;
  fullName: string;
  phone: string;
  email: string;
  totalCapitalInvested: number;
  currentCapitalBalance: number;
  profitSharePercentage: number; // e.g. 15% of net profit
  agreementStartDate: string;
  maturityDate: string;
  withdrawalNoticeDays: number;
  status: 'active' | 'matured' | 'withdrawn';
  totalDistributionsPaid: number;
  createdAt: string;
}

export interface InvestorDistribution {
  id: string;
  distributionCode: string;
  investorId: string;
  investorName: string;
  periodLabel: string; // e.g. "October 2026"
  netProfitBasis: number;
  sharePercentage: number;
  distributionAmount: number;
  paymentDate: string;
  paymentReference: string;
  paidBy: string;
  status: 'scheduled' | 'paid';
}

export interface CollectionFollowUp {
  id: string;
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  officerId: string;
  officerName: string;
  followUpDate: string;
  followUpType: 'Phone Call' | 'Market Stall Visit' | 'Guarantor Contact' | 'Formal Letter';
  promiseToPayDate?: string;
  promisedAmount?: number;
  notes: string;
  outcome: 'Promise to Pay' | 'Refused' | 'Stall Closed' | 'Partial Paid' | 'Unreachable';
}

export type SystemMode = 'demo' | 'production';

export interface AuditEvent {
  id: string;
  eventType:
    | 'LOGIN'
    | 'BORROWER_CREATED'
    | 'BORROWER_UPDATED'
    | 'APPLICATION_SUBMITTED'
    | 'APPLICATION_APPROVED'
    | 'APPLICATION_REJECTED'
    | 'LOAN_DISBURSED'
    | 'REPAYMENT_RECORDED'
    | 'REPAYMENT_REVERSED'
    | 'EXPENSE_APPROVED'
    | 'RECONCILIATION_COMPLETED'
    | 'SETTINGS_CHANGED'
    | 'BRANCH_CREATED'
    | 'BRANCH_UPDATED'
    | 'BRANCH_DELETED'
    | 'COMPANY_PROFILE_UPDATED'
    | 'BIOMETRIC_ENROLLED'
    | 'BIOMETRIC_REMOVED'
    | 'SYSTEM_PRODUCTION_INITIALIZED'
    | 'DATABASE_RESTORED'
    | 'DATABASE_EXPORTED';
  entityType: string;
  entityId: string;
  performedBy: string;
  performedByName: string;
  userRole: UserRole;
  description: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface CompanyProfile {
  companyName: string;
  registrationNumber: string;
  taxId?: string;
  licenseNumber?: string;
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  supportEmail?: string;
  headquartersAddress: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  operatingHours: string;
  googleMapsUrl?: string;
  defaultCurrency: string;
  timezone: string;
  lastUpdated: string;
  updatedBy?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  marketLocation: string;
  address: string;
  city: string;
  state: string;
  managerId?: string;
  managerName?: string;
  contactPhone: string;
  contactEmail?: string;
  operatingDays: string;
  status: 'active' | 'inactive';
  targetTradersCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
