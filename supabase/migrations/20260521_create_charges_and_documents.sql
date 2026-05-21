-- Migration: Create charges and charge_documents, add accounting_status to violations
-- Ensure required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Migration: Create charges and charge_documents, add accounting_status to violations

-- Add accounting_status to violations
ALTER TABLE IF EXISTS violations
ADD COLUMN IF NOT EXISTS accounting_status VARCHAR(16) NOT NULL DEFAULT 'pending';

-- Create charges table
CREATE TABLE IF NOT EXISTS charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id uuid REFERENCES violations(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE CASCADE,
  charge_type varchar NOT NULL,
  description text NOT NULL,
  amount numeric,
  document_url varchar,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  status varchar DEFAULT 'draft'
);

-- Create charge_documents table
CREATE TABLE IF NOT EXISTS charge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id uuid REFERENCES charges(id) ON DELETE CASCADE,
  file_name varchar NOT NULL,
  file_url varchar NOT NULL,
  file_type varchar,
  uploaded_at timestamptz DEFAULT now()
);
