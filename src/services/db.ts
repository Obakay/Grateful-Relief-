/**
 * High-Integrity Database & Persistence Service
 * Grateful Relief Loan Manager - Grateful Relief Program Limited (Nigeria)
 */

import {
  UserProfile,
  UserRole,
  Borrower,
  LoanProduct,
  LoanApplication,
  Loan,
  RepaymentInstallment,
  Repayment,
  Expense,
  ReconciliationSession,
  Investor,
  InvestorDistribution,
  CollectionFollowUp,
  AuditEvent,
  SystemNotification,
  PaymentMethod,
  CompanyProfile,
  Branch,
} from '../types';
import { generateRepaymentSchedule, allocatePayment } from './loanCalculator';

const STORAGE_KEY = 'grateful_relief_db_v2';
const IDEMPOTENCY_CACHE_KEY = 'grp_idempotency_keys_v2';

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'Grateful Relief Program Limited',
  registrationNumber: 'RC: 1894220',
  taxId: 'TIN: 24891029-0001',
  licenseNumber: 'CBN/MFI/LA/2024/098',
  primaryPhone: '+234 803 555 1020',
  alternatePhone: '+234 814 777 3040',
  email: 'info@gratefulrelief.ng',
  supportEmail: 'support@gratefulrelief.ng',
  headquartersAddress: 'Plot 42, Broad Street, Marina Commercial District',
  city: 'Lagos Island',
  state: 'Lagos State',
  postalCode: '101223',
  country: 'Nigeria',
  operatingHours: 'Monday – Friday: 8:00 AM – 5:00 PM (West Africa Time)',
  googleMapsUrl: 'https://maps.google.com/?q=Broad+Street+Marina+Lagos+Island',
  defaultCurrency: 'NGN (₦)',
  timezone: 'Africa/Lagos',
  lastUpdated: '2026-10-24T08:00:00Z',
  updatedBy: 'Ibrahim Babalola (Managing Director)',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-01',
    code: 'GRP-LAG-ISL',
    name: 'Lagos Island (Balogun Market)',
    marketLocation: 'Balogun Ultra-Modern, Idumota & Mandilas Commercial Hub',
    address: 'Shop 42, Broad Street, Marina Commercial Axis, Lagos Island',
    city: 'Lagos Island',
    state: 'Lagos State',
    managerId: 'usr-admin-01',
    managerName: 'Ibrahim Babalola',
    contactPhone: '+234 803 555 1020',
    contactEmail: 'lagos.island@gratefulrelief.ng',
    operatingDays: 'Monday – Friday (8:00 AM – 5:00 PM)',
    status: 'active',
    targetTradersCount: 250,
    notes: 'Main flagship branch serving textile and provisions traders.',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'br-02',
    code: 'GRP-LAG-YAB',
    name: 'Yaba (Tejuosho Market)',
    marketLocation: 'Tejuosho Ultra-Modern Phase I & II, Ojuelegba Market',
    address: 'Suite B14, Tejuosho Market Complex, Yaba, Lagos',
    city: 'Yaba / Mainland',
    state: 'Lagos State',
    managerId: 'usr-officer-01',
    managerName: 'Chioma Adeleke',
    contactPhone: '+234 814 777 3040',
    contactEmail: 'yaba.branch@gratefulrelief.ng',
    operatingDays: 'Monday – Friday (8:00 AM – 5:00 PM)',
    status: 'active',
    targetTradersCount: 180,
    notes: 'Specializes in fresh commodities, foodstuffs, and catering vendors.',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'br-03',
    code: 'GRP-LAG-OSH',
    name: 'Oshodi (Arena Market)',
    marketLocation: 'Arena Shopping Complex, Bolade & Oshodi Underbridge Hub',
    address: 'Block E, Shop 19, The Arena Complex, Bolade, Oshodi, Lagos',
    city: 'Oshodi / Isolo',
    state: 'Lagos State',
    contactPhone: '+234 802 888 4050',
    contactEmail: 'oshodi.branch@gratefulrelief.ng',
    operatingDays: 'Monday – Friday (8:00 AM – 5:00 PM)',
    status: 'active',
    targetTradersCount: 200,
    notes: 'Heavy footfall retail and micro-wholesalers.',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'br-04',
    code: 'GRP-LAG-IKJ',
    name: 'Ikeja (Computer Village & Central)',
    marketLocation: 'Otigba Computer Village & Ikeja Modern Market',
    address: '15 Otigba Street, Opposite Medical Road, Ikeja, Lagos',
    city: 'Ikeja',
    state: 'Lagos State',
    contactPhone: '+234 809 333 4455',
    contactEmail: 'ikeja.branch@gratefulrelief.ng',
    operatingDays: 'Monday – Friday (8:30 AM – 5:30 PM)',
    status: 'active',
    targetTradersCount: 150,
    notes: 'Electronics accessories and retail technology merchants.',
    createdAt: '2026-02-15T08:00:00Z',
  },
  {
    id: 'br-05',
    code: 'GRP-LAG-ALB',
    name: 'Alaba International (Wholesale Hub)',
    marketLocation: 'Alaba International Electronics & Electricals Section',
    address: 'Fancy Line Plaza, Shop 8B, Alaba International, Ojo, Lagos',
    city: 'Ojo / Alaba',
    state: 'Lagos State',
    contactPhone: '+234 803 777 9900',
    contactEmail: 'alaba.branch@gratefulrelief.ng',
    operatingDays: 'Monday – Friday (8:00 AM – 5:00 PM)',
    status: 'active',
    targetTradersCount: 300,
    notes: 'Large volume turnover expansion loans.',
    createdAt: '2026-03-01T08:00:00Z',
  },
];

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'usr-admin-01',
    email: 'ibrahim.babalola@gratefulrelief.ng',
    fullName: 'Ibrahim Babalola',
    role: 'administrator',
    phone: '+234 803 555 1020',
    branch: 'Lagos Island (Balogun Market)',
    approvalLimit: 5000000,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-officer-01',
    email: 'chioma.adeleke@gratefulrelief.ng',
    fullName: 'Chioma Adeleke',
    role: 'loan_officer',
    phone: '+234 814 777 3040',
    branch: 'Lagos Island (Balogun Market)',
    approvalLimit: 0, // Officers cannot approve
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr-auditor-01',
    email: 'femi.oladipo@gratefulrelief.ng',
    fullName: 'Femi Oladipo',
    role: 'auditor',
    phone: '+234 802 888 4050',
    branch: 'Head Office (Broad Street, Lagos)',
    approvalLimit: 0,
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
  },
];

export const INITIAL_PRODUCTS: LoanProduct[] = [
  {
    id: 'prod-01',
    code: 'PROD-MICRO-24',
    name: 'Daily Micro-Trader (24-Day)',
    description: 'Targeted for market women and food stuff vendors. 20% flat interest, 24 weekdays (excludes weekends).',
    minPrincipal: 10000,
    maxPrincipal: 30000,
    defaultPrincipal: 20000,
    interestRatePercent: 20,
    interestMethod: 'flat',
    durationUnits: 24,
    repaymentFrequency: 'daily',
    excludeWeekends: true,
    gracePeriodDays: 1,
    lateFeePercent: 1.5,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-02',
    code: 'PROD-EXP-24',
    name: 'Market Expansion Booster',
    description: 'For established inventory restocking (textiles, electronics). 20% flat interest, 24 weekdays.',
    minPrincipal: 30000,
    maxPrincipal: 100000,
    defaultPrincipal: 50000,
    interestRatePercent: 20,
    interestMethod: 'flat',
    durationUnits: 24,
    repaymentFrequency: 'daily',
    excludeWeekends: true,
    gracePeriodDays: 2,
    lateFeePercent: 2.0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-03',
    code: 'PROD-FLASH-12',
    name: 'Flash Working Capital (12-Day)',
    description: 'Fast turnover loans for perishable commodity traders. 10% flat interest, 12 weekdays.',
    minPrincipal: 5000,
    maxPrincipal: 20000,
    defaultPrincipal: 10000,
    interestRatePercent: 10,
    interestMethod: 'flat',
    durationUnits: 12,
    repaymentFrequency: 'daily',
    excludeWeekends: true,
    gracePeriodDays: 1,
    lateFeePercent: 2.0,
    isActive: true,
    createdAt: '2026-02-01T00:00:00Z',
  },
];

export const INITIAL_BORROWERS: Borrower[] = [
  {
    id: 'bor-01',
    borrowerCode: 'GRP-BOR-2026-001',
    fullName: 'Alhaja Kudirat Alabi',
    phone: '+234 803 111 2233',
    alternatePhone: '+234 812 444 5566',
    nin: '29384756***',
    bvn: '22119988***',
    residentialAddress: '14 Idumota Lane, Lagos Island',
    businessName: 'Alhaja Kudirat Ankara Fabrics',
    businessAddress: 'Shop 42, Balogun Ultra-Modern Market, Lagos Island',
    businessType: 'Fabric & Clothing',
    marketStallNumber: 'Stall B42',
    nextOfKinName: 'Moruf Alabi (Son)',
    nextOfKinPhone: '+234 809 333 4455',
    nextOfKinRelationship: 'Son',
    assignedOfficerId: 'usr-officer-01',
    assignedOfficerName: 'Chioma Adeleke',
    branch: 'Lagos Island (Balogun Market)',
    status: 'active',
    creditScoreRating: 'A - Low Risk',
    notes: 'Long-standing customer, prompt daily payer in cash every afternoon.',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 'bor-02',
    borrowerCode: 'GRP-BOR-2026-002',
    fullName: 'Mrs. Blessing Okon',
    phone: '+234 802 333 7788',
    nin: '10928374***',
    residentialAddress: '7 Ojuelegba Road, Surulere, Lagos',
    businessName: 'Blessing Fresh Seafoods & Catfish',
    businessAddress: 'Wet Section, Stall 12, Tejuosho Market, Yaba',
    businessType: 'Food & Catering',
    marketStallNumber: 'Wet-12',
    nextOfKinName: 'Emmanuel Okon (Husband)',
    nextOfKinPhone: '+234 803 777 9900',
    nextOfKinRelationship: 'Spouse',
    assignedOfficerId: 'usr-officer-01',
    assignedOfficerName: 'Chioma Adeleke',
    branch: 'Lagos Island (Balogun Market)',
    status: 'active',
    creditScoreRating: 'A - Low Risk',
    notes: 'Takes morning batches from Epe jetty, sells out by 3pm.',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-10-21T11:00:00Z',
  },
  {
    id: 'bor-03',
    borrowerCode: 'GRP-BOR-2026-003',
    fullName: 'Mr. Sunday Eze',
    phone: '+234 814 999 1234',
    nin: '44556677***',
    residentialAddress: '23 Agege Motor Road, Oshodi, Lagos',
    businessName: 'Eze Power Tech Accessories',
    businessAddress: 'Line 3, Shop 18, Arena Market, Bolade Oshodi',
    businessType: 'Market Trader',
    marketStallNumber: 'Line 3-18',
    nextOfKinName: 'Chiamaka Eze (Wife)',
    nextOfKinPhone: '+234 808 222 3311',
    nextOfKinRelationship: 'Spouse',
    assignedOfficerId: 'usr-officer-01',
    assignedOfficerName: 'Chioma Adeleke',
    branch: 'Lagos Island (Balogun Market)',
    status: 'active',
    creditScoreRating: 'B - Moderate Risk',
    notes: 'Experienced occasional delays during rain, but always communicates.',
    createdAt: '2026-03-15T12:00:00Z',
    updatedAt: '2026-10-18T16:00:00Z',
  },
  {
    id: 'bor-04',
    borrowerCode: 'GRP-BOR-2026-004',
    fullName: 'Madam Folashade Adele',
    phone: '+234 805 444 8899',
    nin: '99887766***',
    residentialAddress: '8 Broad Street, Lagos Island',
    businessName: 'Folashade Grain & Rice Depot',
    businessAddress: 'Stall C-15, Oroyinyin Street, Lagos Island',
    businessType: 'Provisions',
    marketStallNumber: 'Stall C15',
    nextOfKinName: 'Taofeeq Adele (Brother)',
    nextOfKinPhone: '+234 813 666 7788',
    nextOfKinRelationship: 'Sibling',
    assignedOfficerId: 'usr-officer-01',
    assignedOfficerName: 'Chioma Adeleke',
    branch: 'Lagos Island (Balogun Market)',
    status: 'active',
    creditScoreRating: 'A - Low Risk',
    notes: 'Wholesale grain distributor.',
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-10-22T08:00:00Z',
  },
];

export interface AppDatabase {
  systemMode?: 'demo' | 'production';
  productionConfig?: {
    initializedAt: string;
    initializedBy: string;
    superAdminEmail: string;
    superAdminName: string;
    superAdminPhone: string;
  };
  users: UserProfile[];
  currentUserId: string;
  companyProfile: CompanyProfile;
  branches: Branch[];
  borrowers: Borrower[];
  products: LoanProduct[];
  applications: LoanApplication[];
  loans: Loan[];
  schedules: Record<string, RepaymentInstallment[]>; // loanId -> installments
  repayments: Repayment[];
  expenses: Expense[];
  reconciliations: ReconciliationSession[];
  investors: Investor[];
  distributions: InvestorDistribution[];
  followUps: CollectionFollowUp[];
  auditEvents: AuditEvent[];
  notifications: SystemNotification[];
}

/**
 * Seed full database with active ₦20,000 illustrative loan
 */
function createInitialDatabase(): AppDatabase {
  // Let's create an active loan for Alhaja Kudirat Alabi:
  // ₦20,000 principal, 20% flat interest = ₦4,000 interest, ₦24,000 total.
  // 24 weekdays = ₦1,000/day.
  const loan1Id = 'ln-01';
  const loan1StartDate = '2026-10-01'; // Oct 1st
  const { installments: loan1Installments, endDate: loan1EndDate } = generateRepaymentSchedule({
    loanId: loan1Id,
    principal: 20000,
    interestRatePercent: 20,
    durationUnits: 24,
    startDate: loan1StartDate,
    excludeWeekends: true,
  });

  // Let's record 16 successful payments of ₦1,000 each = ₦16,000 collected so far
  let runningPrincipalPaid = 0;
  let runningInterestPaid = 0;
  const initialRepayments: Repayment[] = [];

  for (let i = 0; i < 16; i++) {
    const inst = loan1Installments[i];
    inst.actualPaid = 1000;
    inst.remainingDue = 0;
    inst.status = 'paid';
    inst.paymentDate = inst.dueDate;

    const interestPart = Math.round((1000 * (4000 / 24000)) * 100) / 100;
    const principalPart = 1000 - interestPart;
    runningPrincipalPaid += principalPart;
    runningInterestPaid += interestPart;

    initialRepayments.push({
      id: `rcp-01-${i + 1}`,
      receiptNumber: `GRP-RCP-2026-${1000 + i + 1}`,
      idempotencyKey: `idemp-ln01-${i + 1}`,
      loanId: loan1Id,
      loanCode: 'GRP-LN-2026-0001',
      borrowerId: 'bor-01',
      borrowerName: 'Alhaja Kudirat Alabi',
      borrowerPhone: '+234 803 111 2233',
      amount: 1000,
      principalAllocated: principalPart,
      interestAllocated: interestPart,
      excessAllocated: 0,
      paymentMethod: i % 4 === 0 ? 'bank_transfer' : 'cash',
      transactionReference: `TRX-GRP-202610${String(i + 1).padStart(2, '0')}-099`,
      collectionDate: inst.dueDate,
      collectionTime: '13:45:00',
      collectedBy: 'usr-officer-01',
      collectedByName: 'Chioma Adeleke',
      notes: 'Daily collection at Balogun shop',
      isSynced: true,
      createdAt: `${inst.dueDate}T13:45:00Z`,
    });
  }

  // Active Loan 1
  const loan1: Loan = {
    id: loan1Id,
    loanCode: 'GRP-LN-2026-0001',
    applicationId: 'app-01',
    borrowerId: 'bor-01',
    borrowerName: 'Alhaja Kudirat Alabi',
    borrowerPhone: '+234 803 111 2233',
    borrowerBusiness: 'Alhaja Kudirat Ankara Fabrics',
    productId: 'prod-01',
    productName: 'Daily Micro-Trader (24-Day)',
    principalAmount: 20000,
    contractualInterest: 4000,
    totalScheduledRepayment: 24000,
    interestRatePercent: 20,
    interestMethod: 'flat',
    durationUnits: 24,
    repaymentFrequency: 'daily',
    dailyScheduledRepayment: 1000,
    disbursementDate: '2026-10-01',
    repaymentStartDate: '2026-10-02',
    repaymentEndDate: loan1EndDate,
    disbursementMethod: 'bank_transfer',
    disbursementReference: 'CBN-NIP-20261001-98762',
    disbursedBy: 'usr-admin-01',
    disbursedByName: 'Ibrahim Babalola',
    approvedBy: 'usr-admin-01',
    approvedByName: 'Ibrahim Babalola',
    assignedOfficerId: 'usr-officer-01',
    assignedOfficerName: 'Chioma Adeleke',
    branch: 'Lagos Island (Balogun Market)',
    status: 'active',
    totalPaid: 16000,
    principalPaid: Math.round(runningPrincipalPaid * 100) / 100,
    interestPaid: Math.round(runningInterestPaid * 100) / 100,
    outstandingBalance: 8000,
    outstandingPrincipal: Math.round((20000 - runningPrincipalPaid) * 100) / 100,
    outstandingInterest: Math.round((4000 - runningInterestPaid) * 100) / 100,
    installmentsTotal: 24,
    installmentsPaidCount: 16,
    lastPaymentDate: loan1Installments[15].dueDate,
    daysOverdue: 0,
    overdueAmount: 0,
    createdAt: '2026-10-01T09:00:00Z',
  };

  // Loan 2: Overdue scenario for Mr. Sunday Eze (₦20,000, missed 4 installments)
  const loan2Id = 'ln-02';
  const loan2StartDate = '2026-09-15';
  const { installments: loan2Installments, endDate: loan2EndDate } = generateRepaymentSchedule({
    loanId: loan2Id,
    principal: 20000,
    interestRatePercent: 20,
    durationUnits: 24,
    startDate: loan2StartDate,
    excludeWeekends: true,
  });

  // Paid only 8 installments
  for (let i = 0; i < 8; i++) {
    loan2Installments[i].actualPaid = 1000;
    loan2Installments[i].remainingDue = 0;
    loan2Installments[i].status = 'paid';
  }
  // Installments 8, 9, 10, 11 are overdue
  for (let i = 8; i < 12; i++) {
    loan2Installments[i].status = 'overdue';
  }

  const loan2: Loan = {
    id: loan2Id,
    loanCode: 'GRP-LN-2026-0002',
    applicationId: 'app-02',
    borrowerId: 'bor-03',
    borrowerName: 'Mr. Sunday Eze',
    borrowerPhone: '+234 814 999 1234',
    borrowerBusiness: 'Eze Power Tech Accessories',
    productId: 'prod-01',
    productName: 'Daily Micro-Trader (24-Day)',
    principalAmount: 20000,
    contractualInterest: 4000,
    totalScheduledRepayment: 24000,
    interestRatePercent: 20,
    interestMethod: 'flat',
    durationUnits: 24,
    repaymentFrequency: 'daily',
    dailyScheduledRepayment: 1000,
    disbursementDate: '2026-09-15',
    repaymentStartDate: '2026-09-16',
    repaymentEndDate: loan2EndDate,
    disbursementMethod: 'cash',
    disbursementReference: 'CSH-VOUCHER-088',
    disbursedBy: 'usr-admin-01',
    disbursedByName: 'Ibrahim Babalola',
    approvedBy: 'usr-admin-01',
    approvedByName: 'Ibrahim Babalola',
    assignedOfficerId: 'usr-officer-01',
    assignedOfficerName: 'Chioma Adeleke',
    branch: 'Lagos Island (Balogun Market)',
    status: 'overdue',
    totalPaid: 8000,
    principalPaid: 6666.67,
    interestPaid: 1333.33,
    outstandingBalance: 16000,
    outstandingPrincipal: 13333.33,
    outstandingInterest: 2666.67,
    installmentsTotal: 24,
    installmentsPaidCount: 8,
    lastPaymentDate: '2026-09-28',
    daysOverdue: 6,
    overdueAmount: 4000,
    createdAt: '2026-09-15T10:00:00Z',
  };

  const initialApplications: LoanApplication[] = [
    {
      id: 'app-03',
      applicationCode: 'GRP-APP-2026-0043',
      borrowerId: 'bor-02',
      borrowerName: 'Mrs. Blessing Okon',
      borrowerPhone: '+234 802 333 7788',
      productId: 'prod-02',
      productName: 'Market Expansion Booster',
      requestedPrincipal: 50000,
      approvedPrincipal: 50000,
      interestRatePercent: 20,
      interestCalculationMethod: 'flat',
      durationUnits: 24,
      repaymentFrequency: 'daily',
      proposedDisbursementDate: '2026-10-24',
      repaymentStartDate: '2026-10-26',
      purpose: 'Deep freezer restocking and cold storage boxes for fish',
      status: 'approved', // Awaiting disbursement
      submittedBy: 'usr-officer-01',
      submittedByName: 'Chioma Adeleke',
      submittedAt: '2026-10-21T09:30:00Z',
      reviewedBy: 'usr-admin-01',
      reviewedByName: 'Ibrahim Babalola',
      reviewedAt: '2026-10-22T11:00:00Z',
      approvedBy: 'usr-admin-01',
      approvedByName: 'Ibrahim Babalola',
      approvedAt: '2026-10-22T11:05:00Z',
      notes: 'Credit assessment verified. Excellent track record on previous cycle.',
    },
    {
      id: 'app-04',
      applicationCode: 'GRP-APP-2026-0044',
      borrowerId: 'bor-04',
      borrowerName: 'Madam Folashade Adele',
      borrowerPhone: '+234 805 444 8899',
      productId: 'prod-01',
      productName: 'Daily Micro-Trader (24-Day)',
      requestedPrincipal: 20000,
      interestRatePercent: 20,
      interestCalculationMethod: 'flat',
      durationUnits: 24,
      repaymentFrequency: 'daily',
      proposedDisbursementDate: '2026-10-25',
      repaymentStartDate: '2026-10-27',
      purpose: 'Bulk purchase of 50kg rice bags before price increase',
      status: 'submitted', // Under review
      submittedBy: 'usr-officer-01',
      submittedByName: 'Chioma Adeleke',
      submittedAt: '2026-10-23T08:15:00Z',
      notes: 'Market stall inspected, high foot-traffic zone.',
    },
  ];

  const initialExpenses: Expense[] = [
    {
      id: 'exp-01',
      expenseCode: 'GRP-EXP-2026-001',
      category: 'Transportation & Fuel',
      description: 'Field collection logistics & fuel subsidy for collection officers',
      amount: 18500,
      paymentMethod: 'cash',
      recipientVendor: 'TotalEnergies Marina Filling Station',
      referenceNumber: 'PET-RCP-8821',
      submittedBy: 'usr-officer-01',
      submittedByName: 'Chioma Adeleke',
      submittedDate: '2026-10-20',
      approvedBy: 'usr-admin-01',
      approvedByName: 'Ibrahim Babalola',
      approvedDate: '2026-10-20',
      status: 'paid',
      branch: 'Lagos Island (Balogun Market)',
      createdAt: '2026-10-20T16:00:00Z',
    },
    {
      id: 'exp-02',
      expenseCode: 'GRP-EXP-2026-002',
      category: 'Communication & Airtime',
      description: 'Monthly field officer mobile airtime & data bundle for POS app',
      amount: 15000,
      paymentMethod: 'bank_transfer',
      recipientVendor: 'MTN Nigeria Communications',
      referenceNumber: 'NIP-MTN-20261010-019',
      submittedBy: 'usr-admin-01',
      submittedByName: 'Ibrahim Babalola',
      submittedDate: '2026-10-10',
      approvedBy: 'usr-admin-01',
      approvedByName: 'Ibrahim Babalola',
      approvedDate: '2026-10-10',
      status: 'paid',
      branch: 'Head Office (Broad Street, Lagos)',
      createdAt: '2026-10-10T11:00:00Z',
    },
    {
      id: 'exp-03',
      expenseCode: 'GRP-EXP-2026-003',
      category: 'Administrative',
      description: 'Thermal receipt paper rolls (box of 50) and stationery',
      amount: 12000,
      paymentMethod: 'cash',
      recipientVendor: 'Adebayo Stationery Stores, CMS',
      referenceNumber: 'CSH-INV-4412',
      submittedBy: 'usr-officer-01',
      submittedByName: 'Chioma Adeleke',
      submittedDate: '2026-10-22',
      status: 'pending', // Pending approval by admin!
      branch: 'Lagos Island (Balogun Market)',
      createdAt: '2026-10-22T17:00:00Z',
    },
  ];

  const initialReconciliations: ReconciliationSession[] = [
    {
      id: 'rec-01',
      sessionCode: 'GRP-REC-2026-10-22-01',
      reconciliationDate: '2026-10-22',
      officerId: 'usr-officer-01',
      officerName: 'Chioma Adeleke',
      branch: 'Lagos Island (Balogun Market)',
      expectedCollections: 1000,
      actualCashSubmitted: 1000,
      actualBankTransferConfirmed: 0,
      totalCollected: 1000,
      variance: 0,
      reconciledBy: 'usr-admin-01',
      reconciledByName: 'Ibrahim Babalola',
      status: 'reconciled',
      signedOffAt: '2026-10-22T18:00:00Z',
      notes: 'All Balogun collections verified and vaulted in safe.',
    },
  ];

  const initialInvestors: Investor[] = [
    {
      id: 'inv-01',
      investorCode: 'GRP-INV-001',
      fullName: 'Alhaji Mustapha Bello',
      phone: '+234 803 700 8899',
      email: 'm.bello@belloholdings.ng',
      totalCapitalInvested: 2500000,
      currentCapitalBalance: 2500000,
      profitSharePercentage: 15,
      agreementStartDate: '2026-01-01',
      maturityDate: '2027-01-01',
      withdrawalNoticeDays: 60,
      status: 'active',
      totalDistributionsPaid: 125000,
      createdAt: '2026-01-01T08:00:00Z',
    },
  ];

  const initialFollowUps: CollectionFollowUp[] = [
    {
      id: 'fol-01',
      loanId: loan2Id,
      borrowerId: 'bor-03',
      borrowerName: 'Mr. Sunday Eze',
      officerId: 'usr-officer-01',
      officerName: 'Chioma Adeleke',
      followUpDate: '2026-10-22',
      followUpType: 'Market Stall Visit',
      promiseToPayDate: '2026-10-26',
      promisedAmount: 4000,
      notes: 'Customer arrived late from Alaba International market restocking. Promised to clear 4 missed days on Monday.',
      outcome: 'Promise to Pay',
    },
  ];

  const initialAuditEvents: AuditEvent[] = [
    {
      id: 'aud-01',
      eventType: 'LOAN_DISBURSED',
      entityType: 'Loan',
      entityId: loan1Id,
      performedBy: 'usr-admin-01',
      performedByName: 'Ibrahim Babalola',
      userRole: 'administrator',
      description: 'Disbursed ₦20,000 for Alhaja Kudirat Alabi via bank transfer',
      timestamp: '2026-10-01T09:15:00Z',
    },
    {
      id: 'aud-02',
      eventType: 'APPLICATION_APPROVED',
      entityType: 'LoanApplication',
      entityId: 'app-03',
      performedBy: 'usr-admin-01',
      performedByName: 'Ibrahim Babalola',
      userRole: 'administrator',
      description: 'Approved loan application GRP-APP-2026-0043 for Mrs. Blessing Okon (₦50,000)',
      timestamp: '2026-10-22T11:05:00Z',
    },
  ];

  const initialNotifications: SystemNotification[] = [
    {
      id: 'notif-01',
      title: 'Loan Approved Awaiting Disbursement',
      message: 'Application GRP-APP-2026-0043 (Mrs. Blessing Okon - ₦50,000) is ready for disbursement.',
      type: 'info',
      timestamp: '2026-10-22T11:05:00Z',
      read: false,
      linkTab: 'disbursements',
    },
    {
      id: 'notif-02',
      title: 'Expense Awaiting Maker-Checker Approval',
      message: 'Stationery & POS roll purchase (₦12,000) requires administrative sign-off.',
      type: 'warning',
      timestamp: '2026-10-22T17:00:00Z',
      read: false,
      linkTab: 'expenses',
    },
  ];

  return {
    systemMode: 'demo',
    users: INITIAL_STAFF,
    currentUserId: 'usr-admin-01', // Start as Admin
    companyProfile: INITIAL_COMPANY_PROFILE,
    branches: INITIAL_BRANCHES,
    borrowers: INITIAL_BORROWERS,
    products: INITIAL_PRODUCTS,
    applications: initialApplications,
    loans: [loan1, loan2],
    schedules: {
      [loan1Id]: loan1Installments,
      [loan2Id]: loan2Installments,
    },
    repayments: initialRepayments,
    expenses: initialExpenses,
    reconciliations: initialReconciliations,
    investors: initialInvestors,
    distributions: [],
    followUps: initialFollowUps,
    auditEvents: initialAuditEvents,
    notifications: initialNotifications,
  };
}

class DatabaseService {
  private db: AppDatabase;
  private idempotencyKeys: Set<string>;

  constructor() {
    this.idempotencyKeys = new Set<string>();
    this.db = this.loadDatabase();
    this.loadIdempotencyKeys();
  }

  private loadDatabase(): AppDatabase {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.companyProfile) {
          parsed.companyProfile = INITIAL_COMPANY_PROFILE;
        }
        if (!parsed.branches || parsed.branches.length === 0) {
          parsed.branches = INITIAL_BRANCHES;
        }
        if (!parsed.systemMode) {
          parsed.systemMode = 'demo';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load DB from localStorage, falling back to seed data', e);
    }
    const initial = createInitialDatabase();
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(data?: AppDatabase): void {
    const toSave = data || this.db;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to persist DB to localStorage', e);
    }
  }

  private loadIdempotencyKeys() {
    try {
      const raw = localStorage.getItem(IDEMPOTENCY_CACHE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        this.idempotencyKeys = new Set(arr);
      }
    } catch (e) {
      this.idempotencyKeys = new Set();
    }
  }

  private recordIdempotencyKey(key: string) {
    this.idempotencyKeys.add(key);
    try {
      localStorage.setItem(IDEMPOTENCY_CACHE_KEY, JSON.stringify(Array.from(this.idempotencyKeys)));
    } catch (e) {}
  }

  public checkIdempotency(key: string): boolean {
    return this.idempotencyKeys.has(key);
  }

  public logAudit(
    eventType: AuditEvent['eventType'],
    entityType: string,
    entityId: string,
    description: string,
    details?: Record<string, any>
  ) {
    const user = this.getCurrentUser();
    const event: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType,
      entityType,
      entityId,
      performedBy: user.id,
      performedByName: user.fullName,
      userRole: user.role,
      description,
      details,
      timestamp: new Date().toISOString(),
    };
    this.db.auditEvents.unshift(event);
    this.saveDatabase();
  }

  // --- User / Role Management ---
  public getUsers(): UserProfile[] {
    return [...this.db.users];
  }

  public getCurrentUser(): UserProfile {
    return this.db.users.find(u => u.id === this.db.currentUserId) || this.db.users[0];
  }

  public switchUser(userId: string): UserProfile {
    const found = this.db.users.find(u => u.id === userId);
    if (!found) throw new Error('User not found');
    this.db.currentUserId = userId;
    this.saveDatabase();
    return found;
  }

  public addUser(user: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can create new staff accounts.');
    }

    // Check duplicate email
    if (this.db.users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error(`A staff account with email ${user.email} already exists.`);
    }

    const newUser: UserProfile = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.users.push(newUser);
    this.logAudit(
      'SETTINGS_CHANGED',
      'UserProfile',
      newUser.id,
      `Created staff account: ${newUser.fullName} (${newUser.role.replace('_', ' ')}) at ${newUser.branch}`,
      { email: newUser.email, role: newUser.role, approvalLimit: newUser.approvalLimit }
    );
    this.saveDatabase();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<UserProfile>): UserProfile {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can modify staff accounts and permissions.');
    }

    const idx = this.db.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('Staff account not found.');

    const targetUser = this.db.users[idx];

    // Prevent deactivating own account if only active administrator
    if (updates.isActive === false && targetUser.id === currentUser.id) {
      throw new Error('Action blocked: You cannot deactivate your own active administrator account.');
    }

    const updatedUser: UserProfile = {
      ...targetUser,
      ...updates,
    };

    this.db.users[idx] = updatedUser;
    this.logAudit(
      'SETTINGS_CHANGED',
      'UserProfile',
      updatedUser.id,
      `Updated staff account: ${updatedUser.fullName} (${updatedUser.role.replace('_', ' ')})`,
      updates
    );
    this.saveDatabase();
    return updatedUser;
  }

  public toggleUserStatus(userId: string): UserProfile {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can change staff account active status.');
    }

    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('Staff account not found.');

    if (user.id === currentUser.id && user.isActive) {
      throw new Error('Action blocked: You cannot deactivate your own administrator account.');
    }

    user.isActive = !user.isActive;
    this.logAudit(
      'SETTINGS_CHANGED',
      'UserProfile',
      user.id,
      `${user.isActive ? 'Activated' : 'Deactivated'} staff account: ${user.fullName}`
    );
    this.saveDatabase();
    return user;
  }

  public deleteUser(userId: string): void {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can remove staff accounts.');
    }

    if (userId === currentUser.id) {
      throw new Error('Action blocked: You cannot delete your own administrator account.');
    }

    const idx = this.db.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('Staff account not found.');

    const removed = this.db.users[idx];
    this.db.users.splice(idx, 1);

    this.logAudit(
      'SETTINGS_CHANGED',
      'UserProfile',
      userId,
      `Deleted staff account: ${removed.fullName} (${removed.email})`
    );
    this.saveDatabase();
  }

  // --- Borrowers ---
  public getBorrowers(): Borrower[] {
    return [...this.db.borrowers];
  }

  public addBorrower(borrowerData: Omit<Borrower, 'id' | 'borrowerCode' | 'createdAt' | 'updatedAt'>): Borrower {
    const codeNum = this.db.borrowers.length + 1;
    const newBorrower: Borrower = {
      ...borrowerData,
      id: `bor-${Date.now()}`,
      borrowerCode: `GRP-BOR-2026-${String(codeNum).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.borrowers.unshift(newBorrower);
    this.logAudit('BORROWER_CREATED', 'Borrower', newBorrower.id, `Registered borrower ${newBorrower.fullName} (${newBorrower.borrowerCode})`);
    this.saveDatabase();
    return newBorrower;
  }

  public updateBorrower(id: string, updates: Partial<Borrower>): Borrower {
    const idx = this.db.borrowers.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Borrower not found');
    const updated = {
      ...this.db.borrowers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.db.borrowers[idx] = updated;
    this.logAudit('BORROWER_UPDATED', 'Borrower', id, `Updated information for borrower ${updated.fullName}`);
    this.saveDatabase();
    return updated;
  }

  // --- Loan Products ---
  public getProducts(): LoanProduct[] {
    return [...this.db.products];
  }

  public addProduct(productData: Omit<LoanProduct, 'id' | 'createdAt'>): LoanProduct {
    const newProduct: LoanProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.db.products.push(newProduct);
    this.logAudit('SETTINGS_CHANGED', 'LoanProduct', newProduct.id, `Created loan product: ${newProduct.name}`);
    this.saveDatabase();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<LoanProduct>): LoanProduct {
    const idx = this.db.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    const updated = { ...this.db.products[idx], ...updates };
    this.db.products[idx] = updated;
    this.logAudit('SETTINGS_CHANGED', 'LoanProduct', id, `Configured loan product: ${updated.name}`);
    this.saveDatabase();
    return updated;
  }

  // --- Loan Applications & Maker-Checker ---
  public getApplications(): LoanApplication[] {
    return [...this.db.applications];
  }

  public submitApplication(data: {
    borrowerId: string;
    productId: string;
    requestedPrincipal: number;
    purpose: string;
    proposedDisbursementDate: string;
    repaymentStartDate: string;
  }): LoanApplication {
    const borrower = this.db.borrowers.find(b => b.id === data.borrowerId);
    if (!borrower) throw new Error('Borrower does not exist');
    const product = this.db.products.find(p => p.id === data.productId);
    if (!product) throw new Error('Loan product does not exist');

    const user = this.getCurrentUser();
    const appCode = `GRP-APP-2026-${String(this.db.applications.length + 45).padStart(4, '0')}`;

    const newApp: LoanApplication = {
      id: `app-${Date.now()}`,
      applicationCode: appCode,
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      productId: product.id,
      productName: product.name,
      requestedPrincipal: data.requestedPrincipal,
      interestRatePercent: product.interestRatePercent,
      interestCalculationMethod: product.interestMethod,
      durationUnits: product.durationUnits,
      repaymentFrequency: product.repaymentFrequency,
      proposedDisbursementDate: data.proposedDisbursementDate,
      repaymentStartDate: data.repaymentStartDate,
      purpose: data.purpose,
      status: 'submitted',
      submittedBy: user.id,
      submittedByName: user.fullName,
      submittedAt: new Date().toISOString(),
    };

    this.db.applications.unshift(newApp);
    this.logAudit('APPLICATION_SUBMITTED', 'LoanApplication', newApp.id, `Submitted loan application for ${borrower.fullName} (₦${data.requestedPrincipal.toLocaleString()})`);
    
    // Add notification
    this.db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Loan Application',
      message: `${user.fullName} submitted application ${appCode} for ${borrower.fullName} (₦${data.requestedPrincipal.toLocaleString()}).`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: 'applications',
    });

    this.saveDatabase();
    return newApp;
  }

  /**
   * Maker-Checker Approval Enforcement:
   * 1. Submitting officer CANNOT approve their own loan
   * 2. Only Administrator can approve
   * 3. Principal cannot exceed approval limit
   */
  public approveApplication(applicationId: string, approvedPrincipal?: number): LoanApplication {
    const currentUser = this.getCurrentUser();
    const app = this.db.applications.find(a => a.id === applicationId);
    if (!app) throw new Error('Application not found');

    if (app.status !== 'submitted' && app.status !== 'under_review') {
      throw new Error(`Cannot approve application with status: ${app.status}`);
    }

    // STRICT MAKER-CHECKER RULE
    if (app.submittedBy === currentUser.id) {
      throw new Error('Maker-Checker Violation: The submitting officer cannot approve their own loan application.');
    }

    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only authorized Administrators can approve loan applications.');
    }

    const finalPrincipal = approvedPrincipal || app.requestedPrincipal;
    if (currentUser.approvalLimit > 0 && finalPrincipal > currentUser.approvalLimit) {
      throw new Error(`Amount ₦${finalPrincipal.toLocaleString()} exceeds your administrative approval limit of ₦${currentUser.approvalLimit.toLocaleString()}.`);
    }

    app.status = 'approved';
    app.approvedPrincipal = finalPrincipal;
    app.approvedBy = currentUser.id;
    app.approvedByName = currentUser.fullName;
    app.approvedAt = new Date().toISOString();

    this.logAudit('APPLICATION_APPROVED', 'LoanApplication', app.id, `Approved loan application ${app.applicationCode} for ₦${finalPrincipal.toLocaleString()}`);
    this.saveDatabase();
    return app;
  }

  public rejectApplication(applicationId: string, reason: string): LoanApplication {
    const currentUser = this.getCurrentUser();
    const app = this.db.applications.find(a => a.id === applicationId);
    if (!app) throw new Error('Application not found');

    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can reject loan applications.');
    }

    app.status = 'rejected';
    app.rejectionReason = reason;
    app.reviewedBy = currentUser.id;
    app.reviewedByName = currentUser.fullName;
    app.reviewedAt = new Date().toISOString();

    this.logAudit('APPLICATION_REJECTED', 'LoanApplication', app.id, `Rejected loan application ${app.applicationCode}. Reason: ${reason}`);
    this.saveDatabase();
    return app;
  }

  // --- Loan Disbursement ---
  public getLoans(): Loan[] {
    return [...this.db.loans];
  }

  public disburseLoan(params: {
    applicationId: string;
    disbursementMethod: 'cash' | 'bank_transfer';
    disbursementReference: string;
  }): Loan {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can disburse loans.');
    }

    const app = this.db.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error('Application not found');

    if (app.status !== 'approved') {
      throw new Error(`Cannot disburse loan. Application status is ${app.status}, must be approved.`);
    }

    // Check if duplicate disbursement exists
    const existingLoan = this.db.loans.find(l => l.applicationId === app.id);
    if (existingLoan) {
      throw new Error('Duplicate disbursement prevented: This loan has already been disbursed.');
    }

    const borrower = this.db.borrowers.find(b => b.id === app.borrowerId);
    if (!borrower) throw new Error('Borrower record missing');

    const principal = app.approvedPrincipal || app.requestedPrincipal;
    const loanId = `ln-${Date.now()}`;
    const loanCode = `GRP-LN-2026-${String(this.db.loans.length + 1).padStart(4, '0')}`;

    // Generate schedule
    const { installments, endDate } = generateRepaymentSchedule({
      loanId,
      principal,
      interestRatePercent: app.interestRatePercent,
      durationUnits: app.durationUnits,
      startDate: app.repaymentStartDate || new Date().toISOString().split('T')[0],
      repaymentFrequency: app.repaymentFrequency,
      excludeWeekends: true,
    });

    const interestAmount = Math.round(principal * (app.interestRatePercent / 100) * 100) / 100;
    const totalScheduled = Math.round((principal + interestAmount) * 100) / 100;
    const dailyScheduled = Math.round((totalScheduled / app.durationUnits) * 100) / 100;

    const newLoan: Loan = {
      id: loanId,
      loanCode,
      applicationId: app.id,
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerBusiness: borrower.businessName,
      productId: app.productId,
      productName: app.productName,
      principalAmount: principal,
      contractualInterest: interestAmount,
      totalScheduledRepayment: totalScheduled,
      interestRatePercent: app.interestRatePercent,
      interestMethod: app.interestCalculationMethod,
      durationUnits: app.durationUnits,
      repaymentFrequency: app.repaymentFrequency,
      dailyScheduledRepayment: dailyScheduled,
      disbursementDate: new Date().toISOString().split('T')[0],
      repaymentStartDate: app.repaymentStartDate,
      repaymentEndDate: endDate,
      disbursementMethod: params.disbursementMethod,
      disbursementReference: params.disbursementReference,
      disbursedBy: currentUser.id,
      disbursedByName: currentUser.fullName,
      approvedBy: app.approvedBy || currentUser.id,
      approvedByName: app.approvedByName || currentUser.fullName,
      assignedOfficerId: borrower.assignedOfficerId,
      assignedOfficerName: borrower.assignedOfficerName,
      branch: borrower.branch,
      status: 'active',
      totalPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      outstandingBalance: totalScheduled,
      outstandingPrincipal: principal,
      outstandingInterest: interestAmount,
      installmentsTotal: app.durationUnits,
      installmentsPaidCount: 0,
      daysOverdue: 0,
      overdueAmount: 0,
      createdAt: new Date().toISOString(),
    };

    app.status = 'disbursed';
    this.db.loans.unshift(newLoan);
    this.db.schedules[loanId] = installments;

    this.logAudit('LOAN_DISBURSED', 'Loan', loanId, `Disbursed loan ${loanCode} (₦${principal.toLocaleString()}) to ${borrower.fullName}`);
    this.saveDatabase();
    return newLoan;
  }

  // --- Schedules & Repayments ---
  public getScheduleForLoan(loanId: string): RepaymentInstallment[] {
    return this.db.schedules[loanId] || [];
  }

  public getRepayments(): Repayment[] {
    return [...this.db.repayments];
  }

  /**
   * ATOMIC TRANSACTION: Record Repayment
   * Enforces:
   * - Idempotency key check (prevents double submits)
   * - Transaction reference uniqueness
   * - Schedule allocation
   * - Separation of principal vs interest
   * - Automatic loan status updates
   * - Receipt creation
   */
  public recordRepayment(params: {
    loanId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    idempotencyKey?: string;
    notes?: string;
  }): { repayment: Repayment; updatedLoan: Loan } {
    const { loanId, amount, paymentMethod, transactionReference, notes } = params;
    const currentUser = this.getCurrentUser();

    if (currentUser.role === 'auditor') {
      throw new Error('Permission Denied: Auditors cannot record financial transactions.');
    }

    if (amount <= 0) {
      throw new Error('Repayment amount must be greater than zero.');
    }

    // Check idempotency
    const idempKey = params.idempotencyKey || `idemp-${loanId}-${transactionReference}-${amount}`;
    if (this.checkIdempotency(idempKey)) {
      throw new Error(`Duplicate transaction prevented: Transaction reference or idempotency token '${idempKey}' has already been processed.`);
    }

    // Check duplicate reference in historical payments
    const existingRef = this.db.repayments.find(r => r.transactionReference === transactionReference && !r.isReversed);
    if (existingRef) {
      throw new Error(`Duplicate transaction reference '${transactionReference}'. This reference has already been recorded.`);
    }

    const loan = this.db.loans.find(l => l.id === loanId);
    if (!loan) throw new Error('Loan record not found');

    if (loan.status === 'fully_paid') {
      throw new Error('This loan has already been fully repaid.');
    }

    const schedule = this.db.schedules[loanId] || [];
    const interestRatio = loan.contractualInterest / loan.totalScheduledRepayment;

    // Allocate payment
    const allocation = allocatePayment(schedule, amount, interestRatio);

    // Update schedule
    this.db.schedules[loanId] = allocation.updatedInstallments;

    // Update loan position
    loan.totalPaid = Math.round((loan.totalPaid + amount) * 100) / 100;
    loan.principalPaid = Math.round((loan.principalPaid + allocation.principalAllocated) * 100) / 100;
    loan.interestPaid = Math.round((loan.interestPaid + allocation.interestAllocated) * 100) / 100;
    loan.outstandingBalance = Math.max(0, Math.round((loan.totalScheduledRepayment - loan.totalPaid) * 100) / 100);
    loan.outstandingPrincipal = Math.max(0, Math.round((loan.principalAmount - loan.principalPaid) * 100) / 100);
    loan.outstandingInterest = Math.max(0, Math.round((loan.contractualInterest - loan.interestPaid) * 100) / 100);
    loan.installmentsPaidCount = allocation.updatedInstallments.filter(i => i.status === 'paid').length;
    loan.lastPaymentDate = new Date().toISOString().split('T')[0];

    // Status check
    if (loan.outstandingBalance <= 0) {
      loan.status = 'fully_paid';
      loan.daysOverdue = 0;
      loan.overdueAmount = 0;
    } else {
      // Check if overdue
      const overdueInsts = allocation.updatedInstallments.filter(i => i.status === 'overdue');
      if (overdueInsts.length > 0) {
        loan.status = 'overdue';
        loan.overdueAmount = overdueInsts.reduce((sum, i) => sum + i.remainingDue, 0);
      } else {
        loan.status = 'active';
        loan.daysOverdue = 0;
        loan.overdueAmount = 0;
      }
    }

    // Generate unique receipt
    const receiptNum = `GRP-RCP-2026-${String(this.db.repayments.length + 1048).padStart(4, '0')}`;
    const repayment: Repayment = {
      id: `rcp-${Date.now()}`,
      receiptNumber: receiptNum,
      idempotencyKey: idempKey,
      loanId: loan.id,
      loanCode: loan.loanCode,
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      borrowerPhone: loan.borrowerPhone,
      amount,
      principalAllocated: allocation.principalAllocated,
      interestAllocated: allocation.interestAllocated,
      excessAllocated: allocation.excessAllocated,
      paymentMethod,
      transactionReference,
      collectionDate: new Date().toISOString().split('T')[0],
      collectionTime: new Date().toTimeString().split(' ')[0],
      collectedBy: currentUser.id,
      collectedByName: currentUser.fullName,
      notes,
      isSynced: true,
      createdAt: new Date().toISOString(),
    };

    this.recordIdempotencyKey(idempKey);
    this.db.repayments.unshift(repayment);

    this.logAudit(
      'REPAYMENT_RECORDED',
      'Repayment',
      repayment.id,
      `Recorded repayment of ₦${amount.toLocaleString()} for loan ${loan.loanCode} (Receipt: ${receiptNum})`,
      { amount, principalAllocated: allocation.principalAllocated, interestAllocated: allocation.interestAllocated }
    );

    this.saveDatabase();
    return { repayment, updatedLoan: loan };
  }

  /**
   * Controlled Reversal Workflow
   */
  public reverseRepayment(repaymentId: string, reason: string): Repayment {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can reverse completed financial transactions.');
    }

    const repayment = this.db.repayments.find(r => r.id === repaymentId);
    if (!repayment) throw new Error('Repayment record not found');

    if (repayment.isReversed) {
      throw new Error('This repayment has already been reversed.');
    }

    const loan = this.db.loans.find(l => l.id === repayment.loanId);
    if (!loan) throw new Error('Associated loan not found');

    // Reverse loan amounts
    loan.totalPaid = Math.max(0, Math.round((loan.totalPaid - repayment.amount) * 100) / 100);
    loan.principalPaid = Math.max(0, Math.round((loan.principalPaid - repayment.principalAllocated) * 100) / 100);
    loan.interestPaid = Math.max(0, Math.round((loan.interestPaid - repayment.interestAllocated) * 100) / 100);
    loan.outstandingBalance = Math.round((loan.totalScheduledRepayment - loan.totalPaid) * 100) / 100;
    loan.outstandingPrincipal = Math.round((loan.principalAmount - loan.principalPaid) * 100) / 100;
    loan.outstandingInterest = Math.round((loan.contractualInterest - loan.interestPaid) * 100) / 100;
    loan.status = 'active';

    repayment.isReversed = true;
    repayment.reversalReason = reason;
    repayment.reversedBy = currentUser.id;
    repayment.reversedAt = new Date().toISOString();

    this.logAudit(
      'REPAYMENT_REVERSED',
      'Repayment',
      repayment.id,
      `Reversed repayment ${repayment.receiptNumber} (₦${repayment.amount.toLocaleString()}). Reason: ${reason}`
    );

    this.saveDatabase();
    return repayment;
  }

  // --- Expenses & Approvals ---
  public getExpenses(): Expense[] {
    return [...this.db.expenses];
  }

  public addExpense(data: {
    category: Expense['category'];
    description: string;
    amount: number;
    paymentMethod: PaymentMethod;
    recipientVendor: string;
    referenceNumber: string;
    branch: string;
  }): Expense {
    const user = this.getCurrentUser();
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseCode: `GRP-EXP-2026-${String(this.db.expenses.length + 1).padStart(3, '0')}`,
      category: data.category,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      recipientVendor: data.recipientVendor,
      referenceNumber: data.referenceNumber,
      submittedBy: user.id,
      submittedByName: user.fullName,
      submittedDate: new Date().toISOString().split('T')[0],
      status: user.role === 'administrator' ? 'approved' : 'pending',
      approvedBy: user.role === 'administrator' ? user.id : undefined,
      approvedByName: user.role === 'administrator' ? user.fullName : undefined,
      approvedDate: user.role === 'administrator' ? new Date().toISOString().split('T')[0] : undefined,
      branch: data.branch,
      createdAt: new Date().toISOString(),
    };

    this.db.expenses.unshift(newExpense);
    this.logAudit('SETTINGS_CHANGED', 'Expense', newExpense.id, `Created expense ${newExpense.expenseCode} (₦${newExpense.amount.toLocaleString()}) for ${newExpense.category}`);
    this.saveDatabase();
    return newExpense;
  }

  public approveExpense(expenseId: string): Expense {
    const user = this.getCurrentUser();
    if (user.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can approve operational expenses.');
    }

    const exp = this.db.expenses.find(e => e.id === expenseId);
    if (!exp) throw new Error('Expense not found');

    if (exp.submittedBy === user.id && exp.amount > 20000) {
      // Maker-checker on large expenses
      throw new Error('Maker-Checker: Large expenses over ₦20,000 must be reviewed by a distinct supervisor.');
    }

    exp.status = 'approved';
    exp.approvedBy = user.id;
    exp.approvedByName = user.fullName;
    exp.approvedDate = new Date().toISOString().split('T')[0];

    this.logAudit('EXPENSE_APPROVED', 'Expense', exp.id, `Approved expense ${exp.expenseCode} for ₦${exp.amount.toLocaleString()}`);
    this.saveDatabase();
    return exp;
  }

  // --- Reconciliation ---
  public getReconciliationSessions(): ReconciliationSession[] {
    return [...this.db.reconciliations];
  }

  public createReconciliation(data: {
    officerId: string;
    reconciliationDate: string;
    actualCashSubmitted: number;
    actualBankTransferConfirmed: number;
    discrepancyReason?: string;
    notes?: string;
  }): ReconciliationSession {
    const user = this.getCurrentUser();
    const officer = this.db.users.find(u => u.id === data.officerId);
    if (!officer) throw new Error('Officer not found');

    // Calculate expected collections for this officer on the date
    const expected = this.db.repayments
      .filter(r => r.collectedBy === data.officerId && r.collectionDate === data.reconciliationDate && !r.isReversed)
      .reduce((sum, r) => sum + r.amount, 0);

    const totalCollected = data.actualCashSubmitted + data.actualBankTransferConfirmed;
    const variance = totalCollected - expected;

    const session: ReconciliationSession = {
      id: `rec-${Date.now()}`,
      sessionCode: `GRP-REC-${data.reconciliationDate}-${String(this.db.reconciliations.length + 1).padStart(2, '0')}`,
      reconciliationDate: data.reconciliationDate,
      officerId: officer.id,
      officerName: officer.fullName,
      branch: officer.branch,
      expectedCollections: expected,
      actualCashSubmitted: data.actualCashSubmitted,
      actualBankTransferConfirmed: data.actualBankTransferConfirmed,
      totalCollected,
      variance,
      discrepancyReason: data.discrepancyReason,
      reconciledBy: user.id,
      reconciledByName: user.fullName,
      status: variance === 0 ? 'reconciled' : 'discrepancy_flagged',
      signedOffAt: new Date().toISOString(),
      notes: data.notes,
    };

    this.db.reconciliations.unshift(session);
    this.logAudit('RECONCILIATION_COMPLETED', 'ReconciliationSession', session.id, `Completed daily reconciliation for ${officer.fullName}: Expected ₦${expected.toLocaleString()}, Submitted ₦${totalCollected.toLocaleString()} (Variance: ₦${variance.toLocaleString()})`);
    this.saveDatabase();
    return session;
  }

  // --- Follow-ups ---
  public getFollowUps(): CollectionFollowUp[] {
    return [...this.db.followUps];
  }

  public addFollowUp(data: Omit<CollectionFollowUp, 'id'>): CollectionFollowUp {
    const item: CollectionFollowUp = {
      ...data,
      id: `fol-${Date.now()}`,
    };
    this.db.followUps.unshift(item);
    this.saveDatabase();
    return item;
  }

  // --- Investors ---
  public getInvestors(): Investor[] {
    return [...this.db.investors];
  }

  public addInvestor(data: Omit<Investor, 'id' | 'investorCode' | 'createdAt' | 'totalDistributionsPaid'>): Investor {
    const user = this.getCurrentUser();
    if (user.role !== 'administrator') {
      throw new Error('Permission Denied: Only administrators can manage investor capital.');
    }
    const inv: Investor = {
      ...data,
      id: `inv-${Date.now()}`,
      investorCode: `GRP-INV-${String(this.db.investors.length + 1).padStart(3, '0')}`,
      totalDistributionsPaid: 0,
      createdAt: new Date().toISOString(),
    };
    this.db.investors.push(inv);
    this.logAudit('SETTINGS_CHANGED', 'Investor', inv.id, `Registered investor ${inv.fullName} with capital ₦${inv.totalCapitalInvested.toLocaleString()}`);
    this.saveDatabase();
    return inv;
  }

  public getDistributions(): InvestorDistribution[] {
    return [...this.db.distributions];
  }

  public recordDistribution(data: {
    investorId: string;
    periodLabel: string;
    netProfitBasis: number;
    paymentReference: string;
  }): InvestorDistribution {
    const inv = this.db.investors.find(i => i.id === data.investorId);
    if (!inv) throw new Error('Investor not found');

    const amount = Math.round((data.netProfitBasis * (inv.profitSharePercentage / 100)) * 100) / 100;
    const user = this.getCurrentUser();

    const dist: InvestorDistribution = {
      id: `dist-${Date.now()}`,
      distributionCode: `GRP-DIST-${Date.now()}`,
      investorId: inv.id,
      investorName: inv.fullName,
      periodLabel: data.periodLabel,
      netProfitBasis: data.netProfitBasis,
      sharePercentage: inv.profitSharePercentage,
      distributionAmount: amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentReference: data.paymentReference,
      paidBy: user.fullName,
      status: 'paid',
    };

    inv.totalDistributionsPaid += amount;
    this.db.distributions.unshift(dist);
    this.logAudit('SETTINGS_CHANGED', 'InvestorDistribution', dist.id, `Recorded distribution of ₦${amount.toLocaleString()} to ${inv.fullName}`);
    this.saveDatabase();
    return dist;
  }

  // --- Audit Events & Notifications ---
  public getAuditEvents(): AuditEvent[] {
    return [...this.db.auditEvents];
  }

  public getNotifications(): SystemNotification[] {
    return [...this.db.notifications];
  }

  public markNotificationAsRead(id: string) {
    const n = this.db.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.saveDatabase();
    }
  }

  // --- Dashboard Metrics ---
  public getDashboardMetrics() {
    const loans = this.db.loans;
    const repayments = this.db.repayments.filter(r => !r.isReversed);
    const expenses = this.db.expenses.filter(e => e.status === 'approved' || e.status === 'paid');

    const totalDisbursed = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalPrincipalRecovered = loans.reduce((sum, l) => sum + l.principalPaid, 0);
    const totalOutstandingPrincipal = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const totalOutstandingRepayment = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
    const totalInterestCollected = loans.reduce((sum, l) => sum + l.interestPaid, 0);
    const totalContractualInterest = loans.reduce((sum, l) => sum + l.contractualInterest, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRepayments = repayments.filter(r => r.collectionDate === todayStr);
    const totalCollectedToday = todayRepayments.reduce((sum, r) => sum + r.amount, 0);

    // This week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekRepayments = repayments.filter(r => new Date(r.collectionDate) >= sevenDaysAgo);
    const totalCollectedThisWeek = weekRepayments.reduce((sum, r) => sum + r.amount, 0);

    // Total expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // NET REALIZED LENDING INCOME:
    // Strictly Realized Interest Income minus Operational Expenses
    // (Does NOT count principal as income!)
    const netRealizedLendingIncome = totalInterestCollected - totalExpenses;

    const loansAwaitingApproval = this.db.applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
    const loansAwaitingDisbursement = this.db.applications.filter(a => a.status === 'approved').length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'fully_paid').length;
    const overdueLoans = loans.filter(l => l.status === 'overdue').length;

    // Portfolio at Risk (PAR 30)
    const overdue30Plus = loans.filter(l => l.daysOverdue >= 30);
    const par30Amount = overdue30Plus.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const par30Ratio = totalOutstandingPrincipal > 0 ? (par30Amount / totalOutstandingPrincipal) * 100 : 0;

    return {
      totalDisbursed,
      totalPrincipalRecovered,
      totalOutstandingPrincipal,
      totalOutstandingRepayment,
      totalInterestCollected,
      totalContractualInterest,
      totalCollectedToday,
      totalCollectedThisWeek,
      totalExpenses,
      netRealizedLendingIncome,
      loansAwaitingApproval,
      loansAwaitingDisbursement,
      activeLoans,
      completedLoans,
      overdueLoans,
      par30Ratio: Math.round(par30Ratio * 10) / 10,
    };
  }

  // --- Company Profile Management ---
  public getCompanyProfile(): CompanyProfile {
    return { ...this.db.companyProfile };
  }

  public updateCompanyProfile(updates: Partial<CompanyProfile>): CompanyProfile {
    const user = this.getCurrentUser();
    if (user.role !== 'administrator') {
      throw new Error('Unauthorized: Only administrators can update company location and profile.');
    }
    this.db.companyProfile = {
      ...this.db.companyProfile,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: `${user.fullName} (${user.role.replace('_', ' ')})`,
    };
    this.logAudit(
      'COMPANY_PROFILE_UPDATED',
      'CompanyProfile',
      'main-profile',
      `Updated company headquarters location and corporate details`,
      updates
    );
    this.saveDatabase();
    return { ...this.db.companyProfile };
  }

  // --- Branch Network Management ---
  public getBranches(): Branch[] {
    return [...this.db.branches];
  }

  public getActiveBranches(): Branch[] {
    return this.db.branches.filter(b => b.status === 'active');
  }

  public getBranchById(id: string): Branch | undefined {
    return this.db.branches.find(b => b.id === id);
  }

  public createBranch(data: Omit<Branch, 'id' | 'createdAt'>): Branch {
    const user = this.getCurrentUser();
    if (user.role !== 'administrator') {
      throw new Error('Unauthorized: Only administrators can add new branches.');
    }

    const newBranch: Branch = {
      ...data,
      id: `br-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.db.branches.push(newBranch);
    this.logAudit(
      'BRANCH_CREATED',
      'Branch',
      newBranch.id,
      `Created new branch: ${newBranch.name} (${newBranch.marketLocation})`,
      { code: newBranch.code, address: newBranch.address }
    );
    this.saveDatabase();
    return newBranch;
  }

  public updateBranch(id: string, updates: Partial<Branch>): Branch {
    const user = this.getCurrentUser();
    if (user.role !== 'administrator') {
      throw new Error('Unauthorized: Only administrators can edit branches.');
    }

    const idx = this.db.branches.findIndex(b => b.id === id);
    if (idx === -1) {
      throw new Error('Branch not found');
    }

    this.db.branches[idx] = {
      ...this.db.branches[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.logAudit(
      'BRANCH_UPDATED',
      'Branch',
      id,
      `Updated branch details: ${this.db.branches[idx].name}`,
      updates
    );
    this.saveDatabase();
    return { ...this.db.branches[idx] };
  }

  public deleteBranch(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'administrator') {
      throw new Error('Unauthorized: Only administrators can delete branches.');
    }

    const target = this.db.branches.find(b => b.id === id);
    if (!target) {
      throw new Error('Branch not found');
    }

    // Verify if loans or borrowers are tied to this branch
    const borrowersCount = this.db.borrowers.filter(b => b.branch === target.name).length;
    const loansCount = this.db.loans.filter(l => l.branch === target.name).length;

    if (borrowersCount > 0 || loansCount > 0) {
      return {
        success: false,
        message: `Cannot delete branch "${target.name}". It is associated with ${borrowersCount} active borrower(s) and ${loansCount} loan record(s). Deactivate the branch instead.`,
      };
    }

    this.db.branches = this.db.branches.filter(b => b.id !== id);
    this.logAudit(
      'BRANCH_DELETED',
      'Branch',
      id,
      `Deleted branch: ${target.name} (${target.code})`
    );
    this.saveDatabase();
    return {
      success: true,
      message: `Branch "${target.name}" has been permanently removed.`,
    };
  }

  // --- System Mode & Production Operations ---
  public getSystemMode(): 'demo' | 'production' {
    return this.db.systemMode || 'demo';
  }

  public getProductionConfig() {
    return this.db.productionConfig;
  }

  /**
   * Initializes Clean Live Production Mode:
   * - Sets systemMode to 'production'
   * - Configures Super Administrator (e.g. obayomikayode56@gmail.com)
   * - Wipes fictional demo borrowers, test loans, dummy repayments, and sample expenses
   * - Preserves official company profile (Grateful Relief Program Limited, RC: 1894220)
   * - Preserves active branches & standard Nigerian loan products
   * - Resets audit trail with initial production authorization event
   */
  public initializeLiveProduction(config: {
    superAdminEmail: string;
    superAdminName: string;
    superAdminPhone: string;
    branchName?: string;
  }): UserProfile {
    const email = config.superAdminEmail.trim().toLowerCase();
    const fullName = config.superAdminName.trim() || 'Super Administrator';
    const phone = config.superAdminPhone.trim() || '+234 803 555 1020';
    const branch = config.branchName || (this.db.branches[0]?.name ?? 'Lagos Island (Balogun Market)');

    const superAdmin: UserProfile = {
      id: 'usr-admin-01',
      email,
      fullName,
      role: 'administrator',
      phone,
      branch,
      approvalLimit: 10000000, // ₦10,000,000
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const initTimestamp = new Date().toISOString();

    this.db.systemMode = 'production';
    this.db.productionConfig = {
      initializedAt: initTimestamp,
      initializedBy: `${fullName} (${email})`,
      superAdminEmail: email,
      superAdminName: fullName,
      superAdminPhone: phone,
    };

    this.db.users = [superAdmin];
    this.db.currentUserId = superAdmin.id;

    // Clean operational records to ensure ₦0.00 pristine ledger
    this.db.borrowers = [];
    this.db.applications = [];
    this.db.loans = [];
    this.db.schedules = {};
    this.db.repayments = [];
    this.db.expenses = [];
    this.db.reconciliations = [];
    this.db.investors = [];
    this.db.distributions = [];
    this.db.followUps = [];

    // Clear and set welcoming notifications
    this.db.notifications = [
      {
        id: `notif-live-${Date.now()}`,
        title: '🟢 Live Production Mode Initialized',
        message: `Welcome, ${fullName}. Clean financial ledger established at ₦0.00. You can now register real staff members and onboard market borrowers.`,
        type: 'success',
        timestamp: initTimestamp,
        read: false,
        linkTab: 'staff',
      },
      {
        id: `notif-live-guide-${Date.now()}`,
        title: 'Step 1: Onboard Real Staff',
        message: 'Head over to Staff Management to create accounts for your Loan Officers and Branch Managers.',
        type: 'info',
        timestamp: initTimestamp,
        read: false,
        linkTab: 'staff',
      },
    ];

    // Establish genesis audit trail record
    this.db.auditEvents = [
      {
        id: `aud-${Date.now()}-genesis`,
        eventType: 'SYSTEM_PRODUCTION_INITIALIZED',
        entityType: 'System',
        entityId: 'live-production-init',
        performedBy: superAdmin.id,
        performedByName: superAdmin.fullName,
        userRole: 'administrator',
        description: `Live Production Mode initialized by Super Admin ${fullName} (${email}). Fictional demo records cleared. Clean ₦0.00 ledger established.`,
        details: {
          superAdminEmail: email,
          superAdminName: fullName,
          branch,
          timestamp: initTimestamp,
        },
        timestamp: initTimestamp,
      },
    ];

    // Reset idempotency cache
    this.idempotencyKeys.clear();
    localStorage.removeItem(IDEMPOTENCY_CACHE_KEY);

    this.saveDatabase();
    return superAdmin;
  }

  /**
   * Import / Restore Full Database from JSON
   */
  public importData(jsonString: string): { success: boolean; message: string; recordCounts?: Record<string, number> } {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate required core tables
      if (
        !parsed ||
        !Array.isArray(parsed.users) ||
        !Array.isArray(parsed.borrowers) ||
        !Array.isArray(parsed.loans) ||
        !Array.isArray(parsed.branches) ||
        !parsed.companyProfile
      ) {
        return {
          success: false,
          message: 'Invalid backup file. Missing required schema tables (users, borrowers, loans, branches, companyProfile).',
        };
      }

      // Ensure fallbacks for optional tables
      this.db = {
        systemMode: parsed.systemMode || 'production',
        productionConfig: parsed.productionConfig,
        users: parsed.users,
        currentUserId: parsed.currentUserId || parsed.users[0]?.id || 'usr-admin-01',
        companyProfile: parsed.companyProfile,
        branches: parsed.branches,
        borrowers: parsed.borrowers,
        products: parsed.products || INITIAL_PRODUCTS,
        applications: parsed.applications || [],
        loans: parsed.loans || [],
        schedules: parsed.schedules || {},
        repayments: parsed.repayments || [],
        expenses: parsed.expenses || [],
        reconciliations: parsed.reconciliations || [],
        investors: parsed.investors || [],
        distributions: parsed.distributions || [],
        followUps: parsed.followUps || [],
        auditEvents: parsed.auditEvents || [],
        notifications: parsed.notifications || [],
      };

      this.logAudit(
        'DATABASE_RESTORED',
        'Database',
        'backup-restore',
        `Restored database from external JSON backup file (${this.db.borrowers.length} borrowers, ${this.db.loans.length} loans, ${this.db.users.length} staff).`
      );

      this.saveDatabase();

      return {
        success: true,
        message: 'Database backup restored and verified successfully!',
        recordCounts: {
          staff: this.db.users.length,
          borrowers: this.db.borrowers.length,
          loans: this.db.loans.length,
          branches: this.db.branches.length,
          repayments: this.db.repayments.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to import JSON backup: ${err?.message || 'Syntax error'}`,
      };
    }
  }

  // --- Reset to Demo Data ---
  public resetToDemoData() {
    this.db = createInitialDatabase();
    this.idempotencyKeys.clear();
    localStorage.removeItem(IDEMPOTENCY_CACHE_KEY);
    this.saveDatabase();
  }

  public exportData(): string {
    this.logAudit(
      'DATABASE_EXPORTED',
      'Database',
      'json-export',
      `Exported complete database backup containing ${this.db.borrowers.length} borrowers and ${this.db.loans.length} loans.`
    );
    return JSON.stringify(this.db, null, 2);
  }
}

export const dbService = new DatabaseService();
