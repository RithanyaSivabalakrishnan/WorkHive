DROP DATABASE IF EXISTS saas_pm;
CREATE DATABASE saas_pm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE saas_pm;

-- ══════════════════════════════════════════════
--  1. TENANTS
-- ══════════════════════════════════════════════
CREATE TABLE tenants (
  tenant_id  INT          AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  plan       ENUM('free','pro','ultra','enterprise') NOT NULL DEFAULT 'free',
  config     JSON,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  2. ROLES
--  Defines permissions per role (LM = Line Manager)
-- ══════════════════════════════════════════════
CREATE TABLE roles (
  role_id     INT          AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,   -- admin | manager | employee
  permissions JSON         NOT NULL           -- e.g. ["create_project","assign_task"]
) ENGINE=InnoDB;

-- Seed default roles immediately
INSERT INTO roles (name, permissions) VALUES
('admin',    '["create_project","delete_project","manage_users","manage_teams","view_billing","view_insights"]'),
('manager',  '["create_task","assign_task","view_team","reply_query","view_insights"]'),
('employee', '["view_tasks","update_task_status","raise_query","view_team"]');


-- ══════════════════════════════════════════════
--  3. USERS
-- ══════════════════════════════════════════════
CREATE TABLE users (
  user_id       INT           AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT           NOT NULL,
  role_id       INT           NOT NULL,
  first_name    VARCHAR(80)   NOT NULL,
  last_name     VARCHAR(80)   NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (role_id)   REFERENCES roles(role_id)     ON DELETE RESTRICT,
  INDEX idx_users_tenant (tenant_id),
  INDEX idx_users_role   (role_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  4. SUBSCRIPTIONS
--  One active subscription per tenant
-- ══════════════════════════════════════════════
CREATE TABLE subscriptions (
  id                   INT           AUTO_INCREMENT PRIMARY KEY,
  tenant_id            INT           NOT NULL,
  plan_type            VARCHAR(50)   NOT NULL DEFAULT 'free',
  subscription_plan    VARCHAR(100),
  subscription_status  ENUM('active','cancelled','past_due','trialing') NOT NULL DEFAULT 'active',
  current_period_start DATE,
  current_period_end   DATE,
  is_active            TINYINT(1)    NOT NULL DEFAULT 1,
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  INDEX idx_subscriptions_tenant (tenant_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  5. BILLING_SUMMARY
--  Monthly billing records issued to tenants
-- ══════════════════════════════════════════════
CREATE TABLE billing_summary (
  id              INT            AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT            NOT NULL,
  billing_period  VARCHAR(20)    NOT NULL,   -- e.g. "2026-03"
  base_charge     DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  usage_charge    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  storage_gb      DECIMAL(8,2)   NOT NULL DEFAULT 0.00,
  api_calls_used  INT            NOT NULL DEFAULT 0,
  total_due       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  status          ENUM('pending','paid','overdue') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  INDEX idx_billing_tenant (tenant_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  6. TEAMS
-- ══════════════════════════════════════════════
CREATE TABLE teams (
  team_id    INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id  INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  manager_id INT          NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id)  REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(user_id)     ON DELETE RESTRICT,
  INDEX idx_teams_tenant  (tenant_id),
  INDEX idx_teams_manager (manager_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  7. TEAM MEMBERS (junction)
-- ══════════════════════════════════════════════
CREATE TABLE team_members (
  team_id     INT       NOT NULL,
  employee_id INT       NOT NULL,
  joined_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (team_id, employee_id),
  FOREIGN KEY (team_id)     REFERENCES teams(team_id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_team_members_emp (employee_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  8. PROJECTS
-- ══════════════════════════════════════════════
CREATE TABLE projects (
  project_id    INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT          NOT NULL,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  type          VARCHAR(80),
  priority      ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status        ENUM('active','on_hold','completed','cancelled') NOT NULL DEFAULT 'active',
  progress      TINYINT      NOT NULL DEFAULT 0,   -- 0-100 percentage
  start_date    DATE,
  end_date      DATE,
  est_end_date  DATE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  INDEX idx_projects_tenant   (tenant_id),
  INDEX idx_projects_status   (status)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  9. TASKS
-- ══════════════════════════════════════════════
CREATE TABLE tasks (
  task_id        INT          AUTO_INCREMENT PRIMARY KEY,
  project_id     INT          NOT NULL,
  assigned_by    INT          NOT NULL,
  assigned_to    INT,
  name           VARCHAR(200) NOT NULL,
  description    TEXT,
  status         ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  priority       ENUM('low','medium','high','critical')    NOT NULL DEFAULT 'medium',
  deadline       DATE,
  completion_pct TINYINT      NOT NULL DEFAULT 0,
  completed_at   TIMESTAMP    NULL DEFAULT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id)  REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(user_id)       ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id)       ON DELETE SET NULL,
  INDEX idx_tasks_project     (project_id),
  INDEX idx_tasks_assigned_to (assigned_to),
  INDEX idx_tasks_status      (status)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  10. PROJECT_FILES
--  Files uploaded to a project
-- ══════════════════════════════════════════════
CREATE TABLE project_files (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  project_id   INT           NOT NULL,
  uploaded_by  INT           NOT NULL,
  file_name    VARCHAR(255)  NOT NULL,
  file_path    VARCHAR(500)  NOT NULL,
  file_size    BIGINT        NOT NULL DEFAULT 0,   -- bytes
  uploaded_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id)  REFERENCES projects(project_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id)       ON DELETE RESTRICT,
  INDEX idx_project_files_proj (project_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  11. TASK_FILES
--  Files uploaded to a task
-- ══════════════════════════════════════════════
CREATE TABLE task_files (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  task_id      INT           NOT NULL,
  uploaded_by  INT           NOT NULL,
  file_name    VARCHAR(255)  NOT NULL,
  file_path    VARCHAR(500)  NOT NULL,
  file_size    BIGINT        NOT NULL DEFAULT 0,
  uploaded_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id)     REFERENCES tasks(task_id)  ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id)  ON DELETE RESTRICT,
  INDEX idx_task_files_task (task_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  12. QUERIES
-- ══════════════════════════════════════════════
CREATE TABLE queries (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT           NOT NULL,
  employee_id   INT           NOT NULL,
  manager_id    INT           NOT NULL,
  subject       VARCHAR(200)  NOT NULL,
  message       TEXT          NOT NULL,
  reply         TEXT,
  is_answered   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id)   REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(user_id)     ON DELETE CASCADE,
  FOREIGN KEY (manager_id)  REFERENCES users(user_id)     ON DELETE CASCADE,
  INDEX idx_queries_employee (employee_id),
  INDEX idx_queries_manager  (manager_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  13. NOTIFICATIONS
-- ══════════════════════════════════════════════
CREATE TABLE notifications (
  id         INT           AUTO_INCREMENT PRIMARY KEY,
  user_id    INT           NOT NULL,
  type       VARCHAR(80)   NOT NULL,     -- task_assigned | query_replied | project_created
  title      VARCHAR(200)  NOT NULL,
  message    TEXT          NOT NULL,
  data       JSON,                       -- extra context (e.g. task_id, project_id)
  is_read    TINYINT(1)    NOT NULL DEFAULT 0,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_notifications_user   (user_id),
  INDEX idx_notifications_unread (user_id, is_read)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  14. ACTIVITY_LOGS
-- ══════════════════════════════════════════════
CREATE TABLE activity_logs (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  tenant_id   INT           NOT NULL,
  action      VARCHAR(80)   NOT NULL,
  entity_type VARCHAR(50)   NOT NULL,
  entity_id   INT           NOT NULL,
  actor_id    INT,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  INDEX idx_logs_tenant (tenant_id),
  INDEX idx_logs_entity (entity_type, entity_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  15. USER_PERFORMANCE_METRICS
-- ══════════════════════════════════════════════
CREATE TABLE user_performance_metrics (
  id                   INT           AUTO_INCREMENT PRIMARY KEY,
  user_id              INT           NOT NULL,
  period               VARCHAR(20)   NOT NULL,   -- e.g. "2026-03"
  tasks_completed      INT           NOT NULL DEFAULT 0,
  avg_completion_days  DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  performance_score    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY uq_perf_user_period (user_id, period),
  INDEX idx_perf_user (user_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  16. TENANT_METRICS
-- ══════════════════════════════════════════════
CREATE TABLE tenant_metrics (
  id             INT     AUTO_INCREMENT PRIMARY KEY,
  tenant_id      INT     NOT NULL,
  period         VARCHAR(20) NOT NULL,
  total_tasks    INT     NOT NULL DEFAULT 0,
  total_projects INT     NOT NULL DEFAULT 0,
  active_users   INT     NOT NULL DEFAULT 0,
  tasks_completed INT    NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE KEY uq_metrics_tenant_period (tenant_id, period)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  17. MONTHLY_REPORTS
-- ══════════════════════════════════════════════
CREATE TABLE monthly_reports (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  tenant_id         INT           NOT NULL,
  month             VARCHAR(20)   NOT NULL,   -- e.g. "2026-03"
  total_tasks       INT           NOT NULL DEFAULT 0,
  active_projects   INT           NOT NULL DEFAULT 0,
  completion_rate   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  total_productivity DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  UNIQUE KEY uq_report_tenant_month (tenant_id, month),
  INDEX idx_reports_tenant (tenant_id)
) ENGINE=InnoDB;


-- ══════════════════════════════════════════════
--  18. ANALYTICS_SUMMARY (ETL target)
-- ══════════════════════════════════════════════
CREATE TABLE analytics_summary (
  tenant_id         INT  NOT NULL PRIMARY KEY,
  total_projects    INT  NOT NULL DEFAULT 0,
  active_projects   INT  NOT NULL DEFAULT 0,
  total_tasks       INT  NOT NULL DEFAULT 0,
  completed_tasks   INT  NOT NULL DEFAULT 0,
  pending_tasks     INT  NOT NULL DEFAULT 0,
  inprogress_tasks  INT  NOT NULL DEFAULT 0,
  total_teams       INT  NOT NULL DEFAULT 0,
  total_employees   INT  NOT NULL DEFAULT 0,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_messages (
  message_id   INT           AUTO_INCREMENT PRIMARY KEY,
  team_id      INT           NOT NULL,
  sender_id    INT           NOT NULL,
  message      TEXT          NOT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id)   REFERENCES teams(team_id)   ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id)   ON DELETE CASCADE,
  INDEX idx_msgs_team (team_id),
  INDEX idx_msgs_created (created_at)
) ENGINE=InnoDB;

-- Verify all tables
SHOW TABLES;