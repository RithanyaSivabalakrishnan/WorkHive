-- ═══════════════════════════════════════════════════════════
--  SaaS PM — Rich Seed Data (All 18 Tables)
--  Run AFTER schema.sql
--  Covers: 3 Tenants, 18 Users, 4 Teams, 8 Projects,
--          24 Tasks, Files, Queries, Notifications,
--          Performance Metrics, Reports, Billing & more
-- ═══════════════════════════════════════════════════════════

USE saas_pm;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE monthly_reports;
TRUNCATE TABLE tenant_metrics;
TRUNCATE TABLE user_performance_metrics;
TRUNCATE TABLE analytics_summary;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE task_files;
TRUNCATE TABLE project_files;
TRUNCATE TABLE queries;
TRUNCATE TABLE tasks;
TRUNCATE TABLE projects;
TRUNCATE TABLE team_members;
TRUNCATE TABLE teams;
TRUNCATE TABLE billing_summary;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE users;
TRUNCATE TABLE tenants;

SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════
--  1. TENANTS (3 organisations)
-- ══════════════════════════════════════════
INSERT INTO tenants (tenant_id, name, plan, is_active) VALUES
(1, 'TechCorp India Pvt. Ltd.',   'pro',        1),
(2, 'Innovatech Solutions',        'ultra',      1),
(3, 'StartupNest Labs',            'free',       1);


-- ══════════════════════════════════════════
--  2. USERS (18 users across 3 tenants)
--  All passwords = "password123"
--  Hash: bcrypt rounds=12
-- ══════════════════════════════════════════
INSERT INTO users (user_id, tenant_id, role_id, first_name, last_name, email, password_hash, is_active) VALUES
-- TechCorp India (tenant 1) — 1 admin, 2 managers, 5 employees
(1,  1, 1, 'Arun',      'Kumar',       'arun@techcorp.com',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(2,  1, 2, 'Meena',     'Sharma',      'meena@techcorp.com',      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(3,  1, 2, 'Ravi',      'Krishnan',    'ravi@techcorp.com',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(4,  1, 3, 'Raj',       'Patel',       'raj@techcorp.com',        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(5,  1, 3, 'Priya',     'Nair',        'priya@techcorp.com',      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(6,  1, 3, 'Suresh',    'Babu',        'suresh@techcorp.com',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(7,  1, 3, 'Anitha',    'Reddy',       'anitha@techcorp.com',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(8,  1, 3, 'Deepak',    'Menon',       'deepak@techcorp.com',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),

-- Innovatech Solutions (tenant 2) — 1 admin, 2 managers, 4 employees
(9,  2, 1, 'Kavya',     'Iyer',        'kavya@innovatech.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(10, 2, 2, 'Sanjay',    'Verma',       'sanjay@innovatech.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(11, 2, 2, 'Lakshmi',   'Pillai',      'lakshmi@innovatech.com',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(12, 2, 3, 'Arjun',     'Singh',       'arjun@innovatech.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(13, 2, 3, 'Divya',     'Nambiar',     'divya@innovatech.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(14, 2, 3, 'Nikhil',    'Gupta',       'nikhil@innovatech.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(15, 2, 3, 'Pooja',     'Mishra',      'pooja@innovatech.com',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),

-- StartupNest Labs (tenant 3) — 1 admin, 1 manager, 1 employee
(16, 3, 1, 'Vikram',    'Desai',       'vikram@startupnest.com',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(17, 3, 2, 'Shreya',    'Joshi',       'shreya@startupnest.com',  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1),
(18, 3, 3, 'Kiran',     'Bhat',        'kiran@startupnest.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsuOf8gxGR.GP7.uIGKtVxEwrXKi', 1);


-- ══════════════════════════════════════════
--  3. SUBSCRIPTIONS
-- ══════════════════════════════════════════
INSERT INTO subscriptions (tenant_id, plan_type, subscription_plan, subscription_status, current_period_start, current_period_end, is_active) VALUES
(1, 'pro',        'Pro Monthly',        'active',    '2026-03-01', '2026-03-31', 1),
(2, 'ultra',      'Ultra Annual',       'active',    '2026-01-01', '2026-12-31', 1),
(3, 'free',       'Free Forever',       'active',    '2026-02-01', NULL,         1);


-- ══════════════════════════════════════════
--  4. BILLING SUMMARY (3 months per tenant)
-- ══════════════════════════════════════════
INSERT INTO billing_summary (tenant_id, billing_period, base_charge, usage_charge, storage_gb, api_calls_used, total_due, status) VALUES
(1, '2026-01', 299.00, 45.50,  12.3, 18400, 344.50, 'paid'),
(1, '2026-02', 299.00, 52.00,  14.1, 21200, 351.00, 'paid'),
(1, '2026-03', 299.00, 61.25,  15.8, 24500, 360.25, 'pending'),
(2, '2026-01', 999.00, 120.00, 45.2, 68000, 1119.00,'paid'),
(2, '2026-02', 999.00, 134.50, 48.6, 72300, 1133.50,'paid'),
(2, '2026-03', 999.00, 148.75, 51.0, 78900, 1147.75,'pending'),
(3, '2026-01', 0.00,   0.00,   1.2,  850,   0.00,   'paid'),
(3, '2026-02', 0.00,   0.00,   1.5,  1020,  0.00,   'paid'),
(3, '2026-03', 0.00,   0.00,   1.8,  1340,  0.00,   'pending');


-- ══════════════════════════════════════════
--  5. TEAMS (4 teams)
-- ══════════════════════════════════════════
INSERT INTO teams (team_id, tenant_id, name, manager_id) VALUES
(1, 1, 'Alpha Dev Team',       2),
(2, 1, 'Beta QA Team',         3),
(3, 2, 'Core Engineering',    10),
(4, 2, 'Product & Design',    11);


-- ══════════════════════════════════════════
--  6. TEAM MEMBERS
-- ══════════════════════════════════════════
INSERT INTO team_members (team_id, employee_id) VALUES
(1, 4), (1, 5), (1, 6),        -- Alpha Dev: Raj, Priya, Suresh
(2, 7), (2, 8),                -- Beta QA: Anitha, Deepak
(3, 12),(3, 13),(3, 14),       -- Core Eng: Arjun, Divya, Nikhil
(4, 15);                        -- Product: Pooja


-- ══════════════════════════════════════════
--  7. PROJECTS (8 projects across tenants)
-- ══════════════════════════════════════════
INSERT INTO projects (project_id, tenant_id, name, description, type, priority, status, progress, start_date, end_date, est_end_date) VALUES
-- TechCorp (tenant 1)
(1, 1, 'Customer Portal Redesign',
 'Full redesign of the customer-facing portal using Alpine.js and modern CSS.',
 'Web Development', 'high', 'active', 45, '2026-01-15', NULL, '2026-06-30'),

(2, 1, 'Internal Analytics Dashboard',
 'ETL pipeline and analytics dashboard for real-time manager insights.',
 'Data Engineering', 'critical', 'active', 70, '2026-01-01', NULL, '2026-05-15'),

(3, 1, 'Mobile App v2.0',
 'Rebuild mobile app with React Native, offline support, and push notifications.',
 'Mobile Development', 'high', 'on_hold', 20, '2026-02-01', NULL, '2026-09-30'),

(4, 1, 'API Gateway Migration',
 'Migrate legacy REST APIs to new microservices architecture.',
 'Backend', 'medium', 'completed', 100, '2025-10-01', '2026-01-31', '2026-01-31'),

-- Innovatech (tenant 2)
(5, 2, 'AI Recommendation Engine',
 'Build ML-based product recommendation engine for the e-commerce platform.',
 'Machine Learning', 'critical', 'active', 55, '2026-01-10', NULL, '2026-07-31'),

(6, 2, 'DevOps CI/CD Pipeline',
 'Automate build, test, and deploy pipeline using GitHub Actions and Docker.',
 'DevOps', 'high', 'active', 80, '2026-01-05', NULL, '2026-04-30'),

(7, 2, 'Customer Feedback Portal',
 'Multilingual feedback collection system with sentiment analysis.',
 'Web Development', 'medium', 'active', 35, '2026-02-15', NULL, '2026-08-15'),

-- StartupNest (tenant 3)
(8, 3, 'MVP Product Launch',
 'End-to-end product development and launch of the first MVP.',
 'Full Stack', 'critical', 'active', 30, '2026-03-01', NULL, '2026-06-01');


-- ══════════════════════════════════════════
--  8. TASKS (24 tasks)
-- ══════════════════════════════════════════
INSERT INTO tasks (task_id, project_id, assigned_by, assigned_to, name, description, status, priority, deadline, completion_pct) VALUES
-- Project 1: Customer Portal Redesign
(1,  1, 2, 4,  'Design Login Page UI',               'Figma mockup → Alpine.js implementation with validation.',          'completed',   'high',     '2026-02-10', 100),
(2,  1, 2, 5,  'Build Dashboard Layout',             'Responsive dashboard skeleton with sidebar and content area.',      'in_progress', 'high',     '2026-03-20', 60),
(3,  1, 2, 6,  'Integrate Auth API',                 'Connect frontend to /api/auth/login and /register endpoints.',      'in_progress', 'critical', '2026-03-25', 40),
(4,  1, 2, 4,  'Write Unit Tests for Login',         'Jest tests for login form validation and API calls.',               'pending',     'medium',   '2026-04-05', 0),

-- Project 2: Analytics Dashboard
(5,  2, 2, 5,  'Build ETL Triggers',                 'MySQL AFTER INSERT/UPDATE triggers for analytics_summary.',         'completed',   'critical', '2026-02-15', 100),
(6,  2, 2, 6,  'Create KPI Cards Component',         'Reusable KPI card with count, trend, and percentage change.',      'completed',   'high',     '2026-02-28', 100),
(7,  2, 2, 7,  'Integrate Chart.js Graphs',          'Line chart for task completion and bar chart for project status.',  'in_progress', 'high',     '2026-03-30', 75),
(8,  2, 3, 8,  'QA: Test All Dashboard Queries',     'Verify all SQL queries return correct tenant-scoped data.',         'in_progress', 'high',     '2026-03-28', 50),

-- Project 3: Mobile App v2.0
(9,  3, 2, 4,  'Setup React Native Project',         'Initialize RN project with Expo, navigation, and state management.','completed',  'medium',   '2026-02-20', 100),
(10, 3, 2, 5,  'Design Onboarding Screens',          'User onboarding flow with 4 screens and progress indicator.',       'pending',     'low',      '2026-05-01', 0),

-- Project 4: API Gateway Migration (completed)
(11, 4, 3, 7,  'Audit Legacy API Endpoints',         'Document all 48 legacy endpoints with request/response schemas.',  'completed',   'high',     '2025-11-01', 100),
(12, 4, 3, 8,  'Deploy Auth Microservice',           'JWT-based auth microservice on Docker.',                           'completed',   'critical', '2025-12-15', 100),

-- Project 5: AI Recommendation Engine
(13, 5, 10, 12, 'Data Pipeline Setup',               'Apache Airflow DAG for ingesting user behaviour data daily.',       'completed',   'critical', '2026-02-01', 100),
(14, 5, 10, 13, 'Train Collaborative Filter Model',  'Matrix factorisation model on 1M user interaction records.',        'in_progress', 'critical', '2026-04-15', 55),
(15, 5, 10, 14, 'A/B Test Framework',                'Design A/B test to compare recommendation algorithms.',             'pending',     'high',     '2026-05-01', 0),
(16, 5, 11, 15, 'Recommendation UI Components',      'Product carousel with personalised recommendation badges.',         'in_progress', 'medium',   '2026-04-30', 30),

-- Project 6: DevOps CI/CD
(17, 6, 10, 12, 'Write Dockerfiles',                 'Multi-stage Dockerfiles for all 6 microservices.',                  'completed',   'high',     '2026-02-10', 100),
(18, 6, 10, 13, 'Configure GitHub Actions',          'CI pipeline with lint, test, build, and push to ECR.',              'completed',   'critical', '2026-02-25', 100),
(19, 6, 10, 14, 'Setup Staging Environment',         'Kubernetes staging namespace with auto-deploy on merge to main.',   'in_progress', 'high',     '2026-03-31', 85),

-- Project 7: Customer Feedback Portal
(20, 7, 11, 15, 'Multilingual Form Builder',         'Dynamic form with 5 language support (EN, HI, TA, TE, ML).',        'in_progress', 'medium',   '2026-04-20', 40),
(21, 7, 11, 12, 'Sentiment Analysis Integration',    'Integrate Hugging Face sentiment API for feedback classification.',  'pending',     'high',     '2026-05-15', 0),

-- Project 8: MVP (StartupNest)
(22, 8, 17, 18, 'Setup Project Repository',          'GitHub monorepo with backend and frontend scaffolding.',            'completed',   'medium',   '2026-03-05', 100),
(23, 8, 17, 18, 'Build Landing Page',                'Responsive landing page with hero, features, and pricing sections.','in_progress', 'high',     '2026-03-25', 65),
(24, 8, 17, 18, 'Implement User Registration',       'Register endpoint, email verification, and JWT login.',             'pending',     'critical', '2026-04-01', 0);


-- ══════════════════════════════════════════
--  9. PROJECT FILES
-- ══════════════════════════════════════════
INSERT INTO project_files (project_id, uploaded_by, file_name, file_path, file_size) VALUES
(1, 1, 'portal-wireframes-v2.fig',       '/files/projects/1/portal-wireframes-v2.fig',    2457600),
(1, 2, 'design-system-guidelines.pdf',  '/files/projects/1/design-system-guidelines.pdf', 1024000),
(2, 2, 'analytics-requirements.docx',   '/files/projects/2/analytics-requirements.docx',  512000),
(2, 1, 'db-schema-diagram.png',         '/files/projects/2/db-schema-diagram.png',         349184),
(5, 9, 'ml-model-architecture.pdf',     '/files/projects/5/ml-model-architecture.pdf',    1536000),
(5, 10,'training-data-sample.csv',      '/files/projects/5/training-data-sample.csv',    10485760),
(6, 9, 'infrastructure-diagram.draw',   '/files/projects/6/infrastructure-diagram.draw',   204800),
(8, 16,'mvp-roadmap-v1.xlsx',           '/files/projects/8/mvp-roadmap-v1.xlsx',           307200);


-- ══════════════════════════════════════════
--  10. TASK FILES
-- ══════════════════════════════════════════
INSERT INTO task_files (task_id, uploaded_by, file_name, file_path, file_size) VALUES
(1,  4,  'login-ui-screenshot.png',       '/files/tasks/1/login-ui-screenshot.png',       204800),
(1,  4,  'login-test-results.txt',        '/files/tasks/1/login-test-results.txt',          10240),
(5,  5,  'trigger-test-log.sql',          '/files/tasks/5/trigger-test-log.sql',             5120),
(13, 12, 'airflow-dag-config.py',         '/files/tasks/13/airflow-dag-config.py',          15360),
(17, 12, 'Dockerfile.backend',            '/files/tasks/17/Dockerfile.backend',              4096),
(18, 13, 'github-actions-ci.yml',         '/files/tasks/18/github-actions-ci.yml',           8192),
(23, 18, 'landing-page-preview.png',      '/files/tasks/23/landing-page-preview.png',      512000);


-- ══════════════════════════════════════════
--  11. QUERIES (employee → manager)
-- ══════════════════════════════════════════
INSERT INTO queries (tenant_id, employee_id, manager_id, subject, message, reply, is_answered) VALUES
(1, 4,  2, 'Deadline extension for Login Unit Tests',
   'Hi Meena, the jest setup took longer than expected due to module conflicts. Can the deadline be extended by 5 days?',
   'Sure Raj, extended to April 10. Please share the blockers doc so I can help.',
   1),

(1, 5,  2, 'Missing design specs for Dashboard Layout',
   'The Figma file shared does not include mobile breakpoint specs. Where can I find them?',
   'Sorry Priya! I have added the mobile specs in the v3 Figma link shared in the project channel.',
   1),

(1, 7,  3, 'Chart.js version compatibility issue',
   'Chart.js v4 is breaking with our current Alpine.js setup. Should I downgrade to v3?',
   NULL,
   0),

(1, 8,  3, 'No access to staging database',
   'I cannot connect to the staging DB for QA testing. Can you check my permissions?',
   'Fixed! Your user was missing the SELECT grant. Should work now.',
   1),

(2, 12, 10,'Docker build failing on M1 Mac',
   'The Dockerfile for the auth service fails on ARM architecture. Getting platform mismatch error.',
   'Add --platform=linux/amd64 to the FROM line. Updated Dockerfile pushed to the repo.',
   1),

(2, 15, 11,'Unclear requirements for Tamil language form',
   'The feedback form spec does not define whether right-to-left support is needed for Tamil text input. Please clarify.',
   NULL,
   0),

(3, 18, 17,'Which hosting platform for MVP launch?',
   'Should we deploy on Vercel + PlanetScale or a traditional VPS? What is the budget?',
   'Going with Railway for backend and Vercel for frontend. Monthly budget is around ₹3000.',
   1);


-- ══════════════════════════════════════════
--  12. NOTIFICATIONS
-- ══════════════════════════════════════════
INSERT INTO notifications (user_id, type, title, message, data, is_read) VALUES
-- User 4 (Raj)
(4,  'task_assigned',  'New Task Assigned',        'You have been assigned: Design Login Page UI',          '{"task_id":1}',    1),
(4,  'task_assigned',  'New Task Assigned',        'You have been assigned: Write Unit Tests for Login',    '{"task_id":4}',    0),
(4,  'query_replied',  'Query Answered',           'Meena replied to your query about deadline extension',  '{"query_id":1}',   1),

-- User 5 (Priya)
(5,  'task_assigned',  'New Task Assigned',        'You have been assigned: Build Dashboard Layout',        '{"task_id":2}',    1),
(5,  'task_assigned',  'New Task Assigned',        'You have been assigned: Build ETL Triggers',            '{"task_id":5}',    1),
(5,  'query_replied',  'Query Answered',           'Meena replied to your Figma specs query',               '{"query_id":2}',   0),

-- User 2 (Meena - manager)
(2,  'query_raised',   'New Query from Raj',       'Raj raised a query about deadline extension',           '{"query_id":1}',   1),
(2,  'query_raised',   'New Query from Priya',     'Priya raised a query about Figma specs',                '{"query_id":2}',   1),
(2,  'task_completed', 'Task Completed',           'Raj completed: Design Login Page UI',                   '{"task_id":1}',    1),

-- User 6 (Suresh)
(6,  'task_assigned',  'New Task Assigned',        'You have been assigned: Integrate Auth API',            '{"task_id":3}',    1),
(6,  'project_update', 'Project Status Changed',  'Customer Portal Redesign progress updated to 45%',      '{"project_id":1}', 0),

-- User 12 (Arjun - Innovatech)
(12, 'task_assigned',  'New Task Assigned',        'You have been assigned: Data Pipeline Setup',           '{"task_id":13}',   1),
(12, 'task_assigned',  'New Task Assigned',        'You have been assigned: Write Dockerfiles',             '{"task_id":17}',   1),
(12, 'task_completed', 'Task Marked Complete',     'Data Pipeline Setup has been marked as completed',      '{"task_id":13}',   1),
(12, 'query_replied',  'Query Answered',           'Sanjay replied to your Docker M1 query',                '{"query_id":5}',   1),

-- User 9 (Kavya - Innovatech admin)
(9,  'project_created','New Project Created',      'AI Recommendation Engine project has been created',     '{"project_id":5}', 1),
(9,  'project_created','New Project Created',      'DevOps CI/CD Pipeline project has been created',        '{"project_id":6}', 1),

-- User 18 (Kiran - StartupNest)
(18, 'task_assigned',  'New Task Assigned',        'You have been assigned: Setup Project Repository',      '{"task_id":22}',   1),
(18, 'task_assigned',  'New Task Assigned',        'You have been assigned: Build Landing Page',            '{"task_id":23}',   1),
(18, 'query_replied',  'Query Answered',           'Shreya replied to your hosting platform query',         '{"query_id":7}',   1);


-- ══════════════════════════════════════════
--  13. ACTIVITY LOGS
-- ══════════════════════════════════════════
INSERT INTO activity_logs (tenant_id, action, entity_type, entity_id, actor_id) VALUES
(1, 'CREATE',   'project', 1,  1),
(1, 'CREATE',   'project', 2,  1),
(1, 'CREATE',   'project', 3,  1),
(1, 'CREATE',   'project', 4,  1),
(1, 'CREATE',   'task',    1,  2),
(1, 'ASSIGN',   'task',    1,  2),
(1, 'COMPLETE', 'task',    1,  4),
(1, 'CREATE',   'task',    2,  2),
(1, 'ASSIGN',   'task',    2,  2),
(1, 'COMPLETE', 'task',    5,  5),
(1, 'COMPLETE', 'task',    6,  6),
(1, 'COMPLETE', 'task',    9,  4),
(1, 'COMPLETE', 'task',    11, 7),
(1, 'COMPLETE', 'task',    12, 8),
(1, 'UPDATE',   'project', 1,  2),
(2, 'CREATE',   'project', 5,  9),
(2, 'CREATE',   'project', 6,  9),
(2, 'CREATE',   'project', 7,  9),
(2, 'COMPLETE', 'task',    13, 12),
(2, 'COMPLETE', 'task',    17, 12),
(2, 'COMPLETE', 'task',    18, 13),
(3, 'CREATE',   'project', 8,  16),
(3, 'ASSIGN',   'task',    22, 17),
(3, 'COMPLETE', 'task',    22, 18);


-- ══════════════════════════════════════════
--  14. USER PERFORMANCE METRICS (3 months)
-- ══════════════════════════════════════════
INSERT INTO user_performance_metrics (user_id, period, tasks_completed, avg_completion_days, performance_score) VALUES
-- Raj (user 4)
(4,  '2026-01', 3, 4.2, 88.5),
(4,  '2026-02', 2, 3.8, 91.0),
(4,  '2026-03', 1, 5.0, 84.0),
-- Priya (user 5)
(5,  '2026-01', 2, 5.5, 82.0),
(5,  '2026-02', 3, 4.1, 89.5),
(5,  '2026-03', 2, 3.9, 90.0),
-- Suresh (user 6)
(6,  '2026-01', 1, 6.0, 78.0),
(6,  '2026-02', 2, 5.2, 83.5),
(6,  '2026-03', 1, 4.8, 85.0),
-- Anitha (user 7)
(7,  '2026-01', 2, 4.5, 87.0),
(7,  '2026-02', 1, 5.0, 80.0),
(7,  '2026-03', 2, 3.5, 92.5),
-- Deepak (user 8)
(8,  '2026-01', 1, 7.0, 75.0),
(8,  '2026-02', 2, 5.5, 82.0),
(8,  '2026-03', 1, 6.0, 78.5),
-- Arjun (user 12)
(12, '2026-01', 2, 4.0, 90.0),
(12, '2026-02', 3, 3.5, 94.5),
(12, '2026-03', 2, 4.2, 88.0),
-- Divya (user 13)
(13, '2026-01', 1, 5.0, 82.5),
(13, '2026-02', 2, 4.3, 87.0),
(13, '2026-03', 1, 4.8, 83.5),
-- Nikhil (user 14)
(14, '2026-01', 2, 6.5, 77.0),
(14, '2026-02', 1, 7.0, 74.5),
(14, '2026-03', 2, 5.5, 81.0),
-- Kiran (user 18)
(18, '2026-03', 1, 3.0, 86.0);


-- ══════════════════════════════════════════
--  15. TENANT METRICS
-- ══════════════════════════════════════════
INSERT INTO tenant_metrics (tenant_id, period, total_tasks, total_projects, active_users, tasks_completed) VALUES
(1, '2026-01', 8,  4, 7, 5),
(1, '2026-02', 12, 4, 7, 7),
(1, '2026-03', 12, 4, 7, 3),
(2, '2026-01', 6,  3, 6, 3),
(2, '2026-02', 9,  3, 6, 5),
(2, '2026-03', 9,  3, 6, 4),
(3, '2026-03', 3,  1, 2, 1);


-- ══════════════════════════════════════════
--  16. MONTHLY REPORTS
-- ══════════════════════════════════════════
INSERT INTO monthly_reports (tenant_id, month, total_tasks, active_projects, completion_rate, total_productivity) VALUES
(1, '2026-01', 8,  3, 62.50, 78.40),
(1, '2026-02', 12, 4, 58.33, 82.15),
(1, '2026-03', 12, 3, 25.00, 76.80),
(2, '2026-01', 6,  3, 50.00, 83.25),
(2, '2026-02', 9,  3, 55.56, 86.40),
(2, '2026-03', 9,  3, 44.44, 84.70),
(3, '2026-03', 3,  1, 33.33, 71.50);


-- ══════════════════════════════════════════
--  17. ANALYTICS SUMMARY
-- ══════════════════════════════════════════
INSERT INTO analytics_summary (tenant_id, total_projects, active_projects, total_tasks, completed_tasks, pending_tasks, inprogress_tasks, total_teams, total_employees) VALUES
(1, 4, 3, 12, 7, 3, 2, 2, 5),
(2, 3, 3, 9,  5, 2, 2, 2, 4),
(3, 1, 1, 3,  1, 1, 1, 0, 1);

USE saas_pm;

UPDATE users
SET password_hash = '$2a$12$8v63RZJtiB53nqSQFyr6COzwIK/iHYU3VRh1tK5UJWu93105.wZ6.'
WHERE email IN (
  'arun@techcorp.com',
  'meena@techcorp.com',
  'ravi@techcorp.com',
  'raj@techcorp.com',
  'priya@techcorp.com',
  'suresh@techcorp.com',
  'anitha@techcorp.com',
  'deepak@techcorp.com',
  'kavya@innovatech.com',
  'sanjay@innovatech.com',
  'lakshmi@innovatech.com',
  'arjun@innovatech.com',
  'divya@innovatech.com',
  'nikhil@innovatech.com',
  'pooja@innovatech.com',
  'vikram@startupnest.com',
  'shreya@startupnest.com',
  'kiran@startupnest.com'
);

-- Confirm all 18 rows updated
SELECT email, LEFT(password_hash, 30) AS hash_preview
FROM users
ORDER BY tenant_id, role_id;

USE saas_pm;

-- Add the team_id column
ALTER TABLE projects
ADD COLUMN team_id INT NULL;

-- Add foreign key as a separate statement
ALTER TABLE projects
ADD CONSTRAINT fk_projects_team
FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL;

-- Assign teams to existing projects
UPDATE projects SET team_id = 1 WHERE project_id IN (1, 2, 3) AND tenant_id = 1;
UPDATE projects SET team_id = 2 WHERE project_id = 4 AND tenant_id = 1;
UPDATE projects SET team_id = 3 WHERE project_id IN (5, 6) AND tenant_id = 2;
UPDATE projects SET team_id = 4 WHERE project_id = 7 AND tenant_id = 2;

-- Confirm it worked
SELECT p.project_id, p.name, p.team_id, t.team_name
FROM projects p
LEFT JOIN teams t ON p.team_id = t.team_id
WHERE p.tenant_id = 1;

-- Add security fields to users table
ALTER TABLE users
  ADD COLUMN secondary_email   VARCHAR(150) NULL,
  ADD COLUMN phone             VARCHAR(20)  NULL,
  ADD COLUMN two_factor_enabled TINYINT(1)  NOT NULL DEFAULT 0,
  ADD COLUMN reset_token       VARCHAR(255) NULL,
  ADD COLUMN reset_token_expiry DATETIME    NULL;

ALTER TABLE users
  ADD COLUMN avatar_url       VARCHAR(500)  NULL,
  ADD COLUMN bio              TEXT          NULL,
  ADD COLUMN department       VARCHAR(100)  NULL,
  ADD COLUMN job_title        VARCHAR(100)  NULL,
  ADD COLUMN location         VARCHAR(150)  NULL,
  ADD COLUMN timezone         VARCHAR(80)   NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN date_of_birth    DATE          NULL,
  ADD COLUMN gender           ENUM('male','female','non_binary','prefer_not_to_say') NULL,
  ADD COLUMN linkedin_url     VARCHAR(300)  NULL,
  ADD COLUMN notification_email  TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN notification_sms    TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN theme_preference VARCHAR(10)   NOT NULL DEFAULT 'system';

ALTER TABLE tenants
  ADD COLUMN subscription_start DATE NULL,
  ADD COLUMN subscription_end   DATE NULL,
  ADD COLUMN subscription_status ENUM('active','expired','trial') NOT NULL DEFAULT 'trial';

-- Set existing tenants a 30-day trial from today
UPDATE tenants
SET subscription_start  = CURDATE(),
    subscription_end    = DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    subscription_status = 'trial'
WHERE subscription_end IS NULL;
