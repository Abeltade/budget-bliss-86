-- Drop existing views
DROP VIEW IF EXISTS daily_summary;
DROP VIEW IF EXISTS weekly_summary;
DROP VIEW IF EXISTS monthly_summary;

-- Create views without SECURITY DEFINER and with proper RLS
CREATE VIEW daily_summary WITH (security_invoker=true) AS
SELECT 
  user_id,
  transaction_date,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as daily_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as daily_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as daily_net
FROM transactions
GROUP BY user_id, transaction_date;

CREATE VIEW weekly_summary WITH (security_invoker=true) AS
SELECT 
  user_id,
  DATE_TRUNC('week', transaction_date) as week_start,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as weekly_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as weekly_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as weekly_net
FROM transactions
GROUP BY user_id, DATE_TRUNC('week', transaction_date);

CREATE VIEW monthly_summary WITH (security_invoker=true) AS
SELECT 
  user_id,
  DATE_TRUNC('month', transaction_date) as month_start,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthly_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthly_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as monthly_net
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date);