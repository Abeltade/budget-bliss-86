-- Add type to budget_categories to distinguish income vs expense categories
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense'));

-- Add transfer support to transactions
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense', 'transfer'));

-- Add destination account for transfers
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS destination_account_id UUID REFERENCES accounts(id);

-- Link transactions directly to goal contributions
ALTER TABLE goal_contributions 
DROP CONSTRAINT IF EXISTS goal_contributions_transaction_id_key;

ALTER TABLE goal_contributions
ADD CONSTRAINT goal_contributions_transaction_id_key UNIQUE (transaction_id);

-- Create view for daily summary
CREATE OR REPLACE VIEW daily_summary AS
SELECT 
  user_id,
  transaction_date,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as daily_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as daily_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as daily_net
FROM transactions
GROUP BY user_id, transaction_date;

-- Create view for weekly summary
CREATE OR REPLACE VIEW weekly_summary AS
SELECT 
  user_id,
  DATE_TRUNC('week', transaction_date) as week_start,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as weekly_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as weekly_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as weekly_net
FROM transactions
GROUP BY user_id, DATE_TRUNC('week', transaction_date);

-- Create view for monthly summary
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', transaction_date) as month_start,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthly_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthly_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as monthly_net
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date);

-- Insert default starter categories with types
INSERT INTO budget_categories (name, type, color, icon, user_id)
SELECT 'Salary', 'income', '#10b981', '💰', id FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, type, color, icon, user_id)
SELECT 'Freelance Income', 'income', '#10b981', '💼', id FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, type, color, icon, user_id)
SELECT 'Groceries', 'expense', '#ef4444', '🛒', id FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, type, color, icon, user_id)
SELECT 'Rent', 'expense', '#ef4444', '🏠', id FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, type, color, icon, user_id)
SELECT 'Entertainment', 'expense', '#ef4444', '🎬', id FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO budget_categories (name, type, color, icon, user_id)
SELECT 'Utilities', 'expense', '#ef4444', '⚡', id FROM auth.users
ON CONFLICT DO NOTHING;