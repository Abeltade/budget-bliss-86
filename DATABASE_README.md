# BudgetMaster Database Schema

This document outlines the core data structure for the BudgetMaster personal finance application, designed to support **zero-based budgeting**, detailed transaction tracking, and goal-based savings.

## Core Philosophy: Zero-Based Budgeting

The application follows a zero-based budgeting approach where:
- **All income must be allocated** to expenses, savings, or goals
- The target is to reach a **net balance of $0.00** in budget allocation
- Every dollar has a purpose before the month begins
- **Starting balances are $0.00** - users must manually input their financial data

## Database Tables

### 1. profiles
Stores user profile information.

**Columns:**
- `id` (uuid, PK) - References auth.users
- `full_name` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can view, insert, and update their own profile
- Cannot delete profiles

---

### 2. accounts
Financial accounts for managing money (checking, savings, credit cards, etc.).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK) - Links to profiles
- `name` (text, required) - Account name (e.g., "Main Checking")
- `type` (account_type enum) - checking, savings, credit, cash, investment
- `balance` (numeric, default: 0.00) - Current account balance
- `currency` (text, default: 'USD')
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can manage (SELECT, INSERT, UPDATE, DELETE) their own accounts

**Notes:**
- Balance starts at $0.00 by default
- Users manually input initial balances
- Multiple accounts per user supported

---

### 3. budget_categories
Custom categories for organizing income and expenses.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text, required) - Category name
- `type` (text, required) - 'income' or 'expense'
- `icon` (text, nullable) - Emoji icon for display
- `color` (text, nullable) - Hex color code
- `parent_id` (uuid, nullable, FK) - For hierarchical categories
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can manage their own categories

**Default Starter Categories:**
Income:
- Salary 💰
- Freelance Income 💼

Expense:
- Groceries 🛒
- Rent 🏠
- Entertainment 🎬
- Utilities ⚡

**Notes:**
- Categories must be designated as either 'income' or 'expense'
- Hierarchical structure supported via parent_id
- Users can add, edit, and delete custom categories

---

### 4. budget_limits
Monthly budget allocations for categories (zero-based budgeting).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `category_id` (uuid, FK) - Links to budget_categories
- `amount` (numeric, required) - Budgeted amount for this category/month
- `month` (date, required) - Budget period (YYYY-MM-DD)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can manage their own budget limits

**Notes:**
- Each category can have different limits per month
- Essential for zero-based budgeting - allocates every dollar of income
- Target: Sum of all category limits = Total income for the month

---

### 5. transactions
Individual financial transactions (income, expenses, transfers).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `type` (transaction_type enum) - 'income', 'expense', or 'transfer'
- `amount` (numeric, required)
- `description` (text, nullable) - Transaction description/payee
- `category_id` (uuid, nullable, FK) - Links to budget_categories
- `account_id` (uuid, FK) - Source account
- `destination_account_id` (uuid, nullable, FK) - For transfers only
- `transaction_date` (date, required)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can manage their own transactions

**Transaction Types:**
1. **Income** - Money coming in (salary, freelance, etc.)
2. **Expense** - Money going out (rent, groceries, etc.)
3. **Transfer** - Moving money between accounts

**Notes:**
- Category must match transaction type (income categories for income, expense categories for expenses)
- Transfers use `destination_account_id` to specify target account
- All transactions start with manual user entry

---

### 6. savings_goals
Long-term savings targets with progress tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `name` (text, required) - Goal name (e.g., "Emergency Fund")
- `description` (text, nullable)
- `target_amount` (numeric, required) - Target amount to save
- `current_amount` (numeric, default: 0.00) - Amount saved so far
- `target_date` (date, required) - Goal deadline
- `priority` (goal_priority enum) - low, medium, high
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can manage their own savings goals

**Notes:**
- Progress calculated as: (current_amount / target_amount) * 100
- Required monthly contribution calculated based on remaining months to target_date
- Goals start at $0.00 and grow through contributions

---

### 7. goal_contributions
Track specific contributions toward savings goals.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `goal_id` (uuid, FK) - Links to savings_goals
- `transaction_id` (uuid, nullable, unique, FK) - Links to transactions
- `amount` (numeric, required)
- `contribution_date` (date, required)
- `notes` (text, nullable)
- `created_at` (timestamp)

**RLS Policies:**
- Users can manage their own contributions

**Notes:**
- Can be linked directly to a transaction
- When contributing via transaction, automatically updates goal's `current_amount`
- Supports manual contribution tracking

---

## Database Views

### daily_summary
Aggregates transactions by day for quick daily summaries.

**Columns:**
- `user_id`
- `transaction_date`
- `daily_income` - Sum of income for the day
- `daily_expenses` - Sum of expenses for the day
- `daily_net` - Net balance (income - expenses)

---

### weekly_summary
Aggregates transactions by week for weekly overview.

**Columns:**
- `user_id`
- `week_start` - Start date of the week
- `weekly_income`
- `weekly_expenses`
- `weekly_net`

---

### monthly_summary
Aggregates transactions by month for monthly budgeting.

**Columns:**
- `user_id`
- `month_start` - Start date of the month
- `monthly_income`
- `monthly_expenses`
- `monthly_net`

---

## Enums

### account_type
- `checking`
- `savings`
- `credit`
- `cash`
- `investment`

### transaction_type
- `income`
- `expense`
- `transfer`

### goal_priority
- `low`
- `medium`
- `high`

---

## Zero-Based Budgeting Workflow

1. **Setup Phase (Month Start):**
   - User inputs expected income for the month
   - User allocates 100% of income across categories using `budget_limits`
   - Goal: Total allocated = Total expected income

2. **Transaction Tracking:**
   - Every transaction is recorded with type, category, and amount
   - Transfers move money between accounts without affecting budget
   - Contributions to savings goals are tracked via `goal_contributions`

3. **Daily/Weekly/Monthly Views:**
   - **Daily View:** Shows today's income, expenses, and net balance
   - **Weekly View:** Rolling 7-day summary with navigation
   - **Monthly View:** Primary budgeting screen showing allocated vs spent per category

4. **Target Achievement:**
   - Unallocated income should reach $0.00
   - Every dollar has a purpose (spending, savings, or debt)
   - Overspending in one category requires reallocation from another

---

## Key Features

✅ **Zero-based budgeting** - All income allocated before spending
✅ **Three time perspectives** - Daily, Weekly, and Monthly views
✅ **Custom categories** - User-defined income and expense categories
✅ **Multiple accounts** - Track checking, savings, credit cards, etc.
✅ **Savings goals** - Set targets with automatic progress tracking
✅ **Transfer tracking** - Move money between accounts
✅ **Goal contributions** - Link transactions to savings goals

---

## Security

All tables use **Row Level Security (RLS)** policies to ensure:
- Users can only access their own data
- No cross-user data leakage
- Automatic user_id enforcement on all operations

---

## Getting Started

1. **Create Account:** Sign up and authenticate
2. **Add Profile Details:** Complete your profile (optional)
3. **Set Up Accounts:** Add your financial accounts (checking, savings, etc.) with initial balances
4. **Create Categories:** Define custom income and expense categories
5. **Set Budget:** Allocate your monthly income across categories (zero-based)
6. **Track Transactions:** Record all income, expenses, and transfers
7. **Create Goals:** Set up savings targets with deadlines
8. **Monitor Progress:** Use Daily, Weekly, and Monthly views to stay on track

---

**Remember:** The core philosophy is "Under budget, make everything $0.00" - every dollar must have a purpose!
