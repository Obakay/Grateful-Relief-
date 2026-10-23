-- =========================================================================
-- GRATEFUL RELIEF PROGRAM LIMITED - LOAN MANAGEMENT SYSTEM SCHEMA
-- Database: PostgreSQL 15+ / Supabase PostgreSQL
-- Currency: NGN (₦) | Stored as exact NUMERIC(14,2)
-- Timezone: Africa/Lagos
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing if re-running
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS loan_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS installment_status CASCADE;

CREATE TYPE user_role AS ENUM ('administrator', 'loan_officer', 'auditor');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'cancelled');
CREATE TYPE loan_status AS ENUM ('active', 'fully_paid', 'overdue', 'defaulted', 'written_off');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'pos');
CREATE TYPE installment_status AS ENUM ('upcoming', 'due', 'paid', 'partially_paid', 'overdue');

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'loan_officer',
    phone TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'Lagos Island (Balogun Market)',
    approval_limit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

-- 2. BORROWERS
CREATE TABLE IF NOT EXISTS borrowers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrower_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    nin VARCHAR(32) NOT NULL, -- Stored securely, masked on frontend
    bvn VARCHAR(32),
    residential_address TEXT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    market_stall_number VARCHAR(50),
    next_of_kin_name VARCHAR(255) NOT NULL,
    next_of_kin_phone VARCHAR(20) NOT NULL,
    next_of_kin_relationship VARCHAR(50) NOT NULL,
    assigned_officer_id UUID REFERENCES profiles(id),
    branch VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    credit_score_rating VARCHAR(50) DEFAULT 'A - Low Risk',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

CREATE INDEX idx_borrowers_phone ON borrowers(phone);
CREATE INDEX idx_borrowers_code ON borrowers(borrower_code);
CREATE INDEX idx_borrowers_officer ON borrowers(assigned_officer_id);

-- 3. LOAN PRODUCTS
CREATE TABLE IF NOT EXISTS loan_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_principal NUMERIC(14, 2) NOT NULL CHECK (min_principal > 0),
    max_principal NUMERIC(14, 2) NOT NULL CHECK (max_principal >= min_principal),
    default_principal NUMERIC(14, 2) NOT NULL,
    interest_rate_percent NUMERIC(5, 2) NOT NULL CHECK (interest_rate_percent >= 0),
    interest_method VARCHAR(32) NOT NULL DEFAULT 'flat',
    duration_units INTEGER NOT NULL CHECK (duration_units > 0),
    repayment_frequency VARCHAR(32) NOT NULL DEFAULT 'daily',
    exclude_weekends BOOLEAN NOT NULL DEFAULT true,
    grace_period_days INTEGER NOT NULL DEFAULT 1,
    late_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 1.5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

-- 4. LOAN APPLICATIONS
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_code VARCHAR(32) NOT NULL UNIQUE,
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES loan_products(id) ON DELETE RESTRICT,
    requested_principal NUMERIC(14, 2) NOT NULL CHECK (requested_principal > 0),
    approved_principal NUMERIC(14, 2) CHECK (approved_principal > 0),
    interest_rate_percent NUMERIC(5, 2) NOT NULL,
    duration_units INTEGER NOT NULL,
    proposed_disbursement_date DATE NOT NULL,
    repayment_start_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'submitted',
    submitted_by UUID NOT NULL REFERENCES profiles(id),
    reviewed_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now()),
    -- Maker-checker database constraint:
    CONSTRAINT chk_maker_checker CHECK (submitted_by <> approved_by)
);

-- 5. LOANS (DISBURSED)
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_code VARCHAR(32) NOT NULL UNIQUE,
    application_id UUID NOT NULL UNIQUE REFERENCES loan_applications(id) ON DELETE RESTRICT,
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES loan_products(id) ON DELETE RESTRICT,
    principal_amount NUMERIC(14, 2) NOT NULL CHECK (principal_amount > 0),
    contractual_interest NUMERIC(14, 2) NOT NULL CHECK (contractual_interest >= 0),
    total_scheduled_repayment NUMERIC(14, 2) NOT NULL,
    interest_rate_percent NUMERIC(5, 2) NOT NULL,
    duration_units INTEGER NOT NULL,
    daily_scheduled_repayment NUMERIC(14, 2) NOT NULL,
    disbursement_date DATE NOT NULL,
    repayment_start_date DATE NOT NULL,
    repayment_end_date DATE NOT NULL,
    disbursement_method payment_method NOT NULL DEFAULT 'bank_transfer',
    disbursement_reference VARCHAR(128) NOT NULL,
    disbursed_by UUID NOT NULL REFERENCES profiles(id),
    approved_by UUID NOT NULL REFERENCES profiles(id),
    assigned_officer_id UUID NOT NULL REFERENCES profiles(id),
    branch VARCHAR(100) NOT NULL,
    status loan_status NOT NULL DEFAULT 'active',
    total_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    principal_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    interest_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(14, 2) NOT NULL,
    outstanding_principal NUMERIC(14, 2) NOT NULL,
    outstanding_interest NUMERIC(14, 2) NOT NULL,
    installments_total INTEGER NOT NULL,
    installments_paid_count INTEGER NOT NULL DEFAULT 0,
    last_payment_date DATE,
    days_overdue INTEGER NOT NULL DEFAULT 0,
    overdue_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_officer ON loans(assigned_officer_id);

-- 6. REPAYMENT SCHEDULES
CREATE TABLE IF NOT EXISTS repayment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    opening_balance NUMERIC(14, 2) NOT NULL,
    scheduled_principal NUMERIC(14, 2) NOT NULL,
    scheduled_interest NUMERIC(14, 2) NOT NULL,
    scheduled_total NUMERIC(14, 2) NOT NULL,
    actual_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    remaining_due NUMERIC(14, 2) NOT NULL,
    status installment_status NOT NULL DEFAULT 'upcoming',
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now()),
    UNIQUE(loan_id, installment_number)
);

CREATE INDEX idx_schedules_loan_due ON repayment_schedules(loan_id, due_date);

-- 7. REPAYMENTS (COLLECTIONS)
CREATE TABLE IF NOT EXISTS repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(32) NOT NULL UNIQUE,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    principal_allocated NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    interest_allocated NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    excess_allocated NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    transaction_reference VARCHAR(128) NOT NULL UNIQUE,
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collection_time TIME NOT NULL DEFAULT CURRENT_TIME,
    collected_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    reversal_reason TEXT,
    reversed_by UUID REFERENCES profiles(id),
    reversed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

CREATE INDEX idx_repayments_loan ON repayments(loan_id);
CREATE INDEX idx_repayments_date ON repayments(collection_date);
CREATE INDEX idx_repayments_collector ON repayments(collected_by);

-- 8. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_code VARCHAR(32) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method NOT NULL DEFAULT 'cash',
    recipient_vendor VARCHAR(255) NOT NULL,
    reference_number VARCHAR(128) NOT NULL,
    submitted_by UUID NOT NULL REFERENCES profiles(id),
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES profiles(id),
    approved_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    receipt_url TEXT,
    branch VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

-- 9. DAILY RECONCILIATIONS
CREATE TABLE IF NOT EXISTS reconciliation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_code VARCHAR(32) NOT NULL UNIQUE,
    reconciliation_date DATE NOT NULL,
    officer_id UUID NOT NULL REFERENCES profiles(id),
    branch VARCHAR(100) NOT NULL,
    expected_collections NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    actual_cash_submitted NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    actual_bank_transfer_confirmed NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_collected NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    variance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discrepancy_reason TEXT,
    reconciled_by UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(32) NOT NULL DEFAULT 'reconciled',
    signed_off_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now()),
    notes TEXT
);

-- 10. INVESTORS & DISTRIBUTIONS
CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    total_capital_invested NUMERIC(14, 2) NOT NULL CHECK (total_capital_invested > 0),
    current_capital_balance NUMERIC(14, 2) NOT NULL,
    profit_share_percentage NUMERIC(5, 2) NOT NULL CHECK (profit_share_percentage >= 0 AND profit_share_percentage <= 100),
    agreement_start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    withdrawal_notice_days INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    total_distributions_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

-- 11. AUDIT EVENTS
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    performed_by UUID NOT NULL REFERENCES profiles(id),
    performed_by_name VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,
    description TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Africa/Lagos'::text, now())
);

CREATE INDEX idx_audit_created_at ON audit_events(created_at DESC);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Administrators can do all operations
CREATE POLICY admin_all_borrowers ON borrowers FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator')
);

-- Loan officers can view and register borrowers
CREATE POLICY officer_borrowers ON borrowers FOR SELECT TO authenticated USING (
    assigned_officer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('administrator', 'auditor'))
);

CREATE POLICY officer_insert_borrowers ON borrowers FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('loan_officer', 'administrator'))
);

-- Loans: Read by all authenticated staff, insert/update restricted
CREATE POLICY loans_read_all ON loans FOR SELECT TO authenticated USING (true);

-- Audit log: Read only by administrators and auditors, NEVER writable by clients directly
CREATE POLICY audit_read ON audit_events FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('administrator', 'auditor'))
);

-- =========================================================================
-- ATOMIC STORED FUNCTION: fn_record_repayment
-- =========================================================================
CREATE OR REPLACE FUNCTION fn_record_repayment(
    p_loan_id UUID,
    p_amount NUMERIC(14,2),
    p_payment_method payment_method,
    p_transaction_reference TEXT,
    p_idempotency_key TEXT,
    p_collected_by UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_loan RECORD;
    v_receipt_number TEXT;
    v_repayment_id UUID;
    v_interest_ratio NUMERIC;
    v_interest_alloc NUMERIC(14,2);
    v_principal_alloc NUMERIC(14,2);
    v_new_total_paid NUMERIC(14,2);
    v_new_outstanding NUMERIC(14,2);
BEGIN
    -- 1. Lock loan row for update to prevent concurrent race condition
    SELECT * INTO v_loan FROM loans WHERE id = p_loan_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan record not found';
    END IF;

    IF v_loan.status = 'fully_paid' THEN
        RAISE EXCEPTION 'This loan is already fully paid';
    END IF;

    -- 2. Check duplicate idempotency key
    IF EXISTS (SELECT 1 FROM repayments WHERE idempotency_key = p_idempotency_key) THEN
        RAISE EXCEPTION 'Duplicate transaction detected: Idempotency token already executed';
    END IF;

    -- 3. Calculate allocation
    v_interest_ratio := v_loan.contractual_interest / v_loan.total_scheduled_repayment;
    v_interest_alloc := ROUND(p_amount * v_interest_ratio, 2);
    v_principal_alloc := p_amount - v_interest_alloc;

    v_new_total_paid := v_loan.total_paid + p_amount;
    v_new_outstanding := GREATEST(0, v_loan.total_scheduled_repayment - v_new_total_paid);

    -- 4. Generate receipt number
    v_receipt_number := 'GRP-RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM()*9000 + 1000)::TEXT, 4, '0');

    -- 5. Insert repayment record
    INSERT INTO repayments (
        receipt_number,
        idempotency_key,
        loan_id,
        borrower_id,
        amount,
        principal_allocated,
        interest_allocated,
        payment_method,
        transaction_reference,
        collection_date,
        collected_by,
        notes
    ) VALUES (
        v_receipt_number,
        p_idempotency_key,
        v_loan.id,
        v_loan.borrower_id,
        p_amount,
        v_principal_alloc,
        v_interest_alloc,
        p_payment_method,
        p_transaction_reference,
        CURRENT_DATE,
        p_collected_by,
        p_notes
    ) RETURNING id INTO v_repayment_id;

    -- 6. Update loan balances
    UPDATE loans SET
        total_paid = v_new_total_paid,
        principal_paid = principal_paid + v_principal_alloc,
        interest_paid = interest_paid + v_interest_alloc,
        outstanding_balance = v_new_outstanding,
        outstanding_principal = GREATEST(0, principal_amount - (principal_paid + v_principal_alloc)),
        outstanding_interest = GREATEST(0, contractual_interest - (interest_paid + v_interest_alloc)),
        status = CASE WHEN v_new_outstanding = 0 THEN 'fully_paid'::loan_status ELSE status END,
        last_payment_date = CURRENT_DATE
    WHERE id = p_loan_id;

    RETURN jsonb_build_object(
        'success', true,
        'receipt_number', v_receipt_number,
        'repayment_id', v_repayment_id,
        'amount', p_amount,
        'remaining_balance', v_new_outstanding
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
