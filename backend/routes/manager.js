// backend/routes/manager.js
// All routes require: auth + rbac('manager')
// Schema fixes: CONCAT names, employee_id in team_members, manager_id/employee_id in queries

const express = require('express');
const db = require('../db');
const router = express.Router();

// ── GET /api/manager/projects ────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const [[myTeam]] = await db.query(
      'SELECT team_id FROM teams WHERE manager_id=? AND tenant_id=?',
      [req.user.user_id, req.user.tenant_id]
    );

    let query = `SELECT p.*,
                   t.team_name,
                   COUNT(tk.task_id) AS total_tasks,
                   SUM(tk.status='completed') AS completed_tasks,
                   SUM(tk.status='in_progress') AS inprogress_tasks,
                   SUM(tk.status='pending') AS pending_tasks
                 FROM projects p
                 LEFT JOIN teams t ON p.team_id = t.team_id
                 LEFT JOIN tasks tk ON p.project_id = tk.project_id
                 WHERE p.tenant_id=?`;
    const params = [req.user.tenant_id];

    // If manager has a team, only show their projects
    if (myTeam) {
      query += ' AND p.team_id = ?';
      params.push(myTeam.team_id);
    }

    query += ' GROUP BY p.project_id ORDER BY p.created_at DESC';

    const [projects] = await db.query(query, params);
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch projects.' });
  }
});

// ── GET /api/manager/tasks ───────────────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  const { project_id, status, priority } = req.query;
  let sql = `SELECT t.*,
               CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_name,
               p.name AS project_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.project_id
             LEFT JOIN users u ON t.assigned_to = u.user_id
             WHERE p.tenant_id=? AND t.assigned_by=?`;
  const params = [req.user.tenant_id, req.user.user_id];

  if (project_id) { sql += ' AND t.project_id=?'; params.push(project_id); }
  if (status) { sql += ' AND t.status=?'; params.push(status); }
  if (priority) { sql += ' AND t.priority=?'; params.push(priority); }
  sql += ' ORDER BY t.created_at DESC';

  try {
    const [tasks] = await db.query(sql, params);
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks.' });
  }
});

// ── GET /api/manager/tasks/unassigned ────────────────────────────────────────
router.get('/tasks/unassigned', async (req, res) => {
  try {
    const [tasks] = await db.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       WHERE p.tenant_id=? AND t.assigned_to IS NULL AND t.assigned_by=?`,
      [req.user.tenant_id, req.user.user_id]
    );
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch unassigned tasks.' });
  }
});

// ── POST /api/manager/tasks ──────────────────────────────────────────────────
router.post('/tasks', async (req, res) => {
  const { project_id, title, description, priority, due_date } = req.body;
  if (!project_id || !title) {
    return res.status(400).json({ success: false, error: 'project_id and title are required.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO tasks (project_id, assigned_by, name, description, priority, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [project_id, req.user.user_id, title, description || null, priority || 'medium', due_date || null]
    );
    res.status(201).json({ success: true, message: 'Task created.', data: { task_id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create task.' });
  }
});

// ── PUT /api/manager/tasks/:id/assign ────────────────────────────────────────
router.put('/tasks/:id/assign', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, error: 'user_id is required.' });
  try {
    await db.query(
      `UPDATE tasks SET assigned_to=?, status='in_progress'
       WHERE task_id=? AND assigned_by=?`,
      [user_id, req.params.id, req.user.user_id]
    );
    res.json({ success: true, message: 'Task assigned.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to assign task.' });
  }
});

// ── PUT /api/manager/tasks/:id ───────────────────────────────────────────────
router.put('/tasks/:id', async (req, res) => {
  const { title, description, priority, due_date, status } = req.body;
  try {
    await db.query(
      `UPDATE tasks SET name=?, description=?, priority=?, deadline=?, status=?
       WHERE task_id=? AND assigned_by=?`,
      [title, description, priority, due_date, status, req.params.id, req.user.user_id]
    );
    res.json({ success: true, message: 'Task updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update task.' });
  }
});

// ── DELETE /api/manager/tasks/:id ────────────────────────────────────────────
router.delete('/tasks/:id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM tasks WHERE task_id=? AND assigned_by=?',
      [req.params.id, req.user.user_id]
    );
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to delete task.' });
  }
});

// ── GET /api/manager/team ────────────────────────────────────────────────────
router.get('/team', async (req, res) => {
  try {
    const [[team]] = await db.query(
      `SELECT t.team_id, t.team_name, t.team_name AS name,
          CONCAT(u.first_name,' ',u.last_name) AS manager_name,
          u.email AS manager_email
      FROM teams t
      JOIN users u ON t.manager_id = u.user_id
      WHERE t.manager_id=? AND t.tenant_id=?`,
      [req.user.user_id, req.user.tenant_id]
    );
    if (!team) return res.json({ success: true, data: null });

    const [members] = await db.query(
      `SELECT u.user_id,
              CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email,
              COUNT(t.task_id) AS total_tasks,
              SUM(t.status='completed') AS completed_tasks,
              SUM(t.status='in_progress') AS inprogress_tasks
       FROM team_members tm
       JOIN users u ON tm.employee_id = u.user_id
       LEFT JOIN tasks t ON t.assigned_to = u.user_id
       WHERE tm.team_id=?
       GROUP BY u.user_id`,
      [team.team_id]
    );
    res.json({ success: true, data: { ...team, members } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch team.' });
  }
});

// ── GET /api/manager/team/employee/:id/tasks ─────────────────────────────────
router.get('/team/employee/:id/tasks', async (req, res) => {
  try {
    const [tasks] = await db.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       WHERE t.assigned_to=? AND p.tenant_id=?
       ORDER BY t.created_at DESC`,
      [req.params.id, req.user.tenant_id]
    );
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch employee tasks.' });
  }
});

// ── PUT /api/manager/team/rename ─────────────────────────────────────────────
router.put('/team/rename', async (req, res) => {
  const { team_name } = req.body;
  if (!team_name) return res.status(400).json({ success: false, error: 'team_name is required.' });
  try {
    await db.query(
      'UPDATE teams SET team_name=? WHERE manager_id=? AND tenant_id=?',
      [team_name, req.user.user_id, req.user.tenant_id]
    );
    res.json({ success: true, message: 'Team renamed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to rename team.' });
  }
});

// ── GET /api/manager/queries ─────────────────────────────────────────────────
router.get('/queries', async (req, res) => {
  try {
    const [queries] = await db.query(
      `SELECT q.*,
              CONCAT(u.first_name,' ',u.last_name) AS from_name,
              u.email AS from_email
       FROM queries q
       JOIN users u ON q.employee_id = u.user_id
       WHERE q.manager_id=?
       ORDER BY q.created_at DESC`,
      [req.user.user_id]
    );
    res.json({ success: true, data: queries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch queries.' });
  }
});

// ── PUT /api/manager/queries/:id/reply ───────────────────────────────────────
router.put('/queries/:id/reply', async (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ success: false, error: 'Reply text is required.' });
  try {
    await db.query(
      `UPDATE queries SET reply=?, is_answered=1
       WHERE id=? AND manager_id=?`,
      [reply, req.params.id, req.user.user_id]
    );
    res.json({ success: true, message: 'Query replied.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to reply to query.' });
  }
});

// ── GET /api/manager/insights ────────────────────────────────────────────────
router.get('/insights', async (req, res) => {
  try {
    const [[team]] = await db.query(
      'SELECT team_id FROM teams WHERE manager_id=? AND tenant_id=?',
      [req.user.user_id, req.user.tenant_id]
    );
    if (!team) return res.json({ success: true, data: [] });

    const [stats] = await db.query(
      `SELECT CONCAT(u.first_name,' ',u.last_name) AS name,
              COUNT(t.task_id) AS total_tasks,
              SUM(t.status='completed') AS completed,
              SUM(t.status='in_progress') AS in_progress,
              SUM(t.status='pending') AS pending,
              ROUND(SUM(t.status='completed') / NULLIF(COUNT(t.task_id),0) * 100, 1) AS completion_pct
       FROM team_members tm
       JOIN users u ON tm.employee_id = u.user_id
       LEFT JOIN tasks t ON t.assigned_to = u.user_id
       WHERE tm.team_id=?
       GROUP BY u.user_id ORDER BY completed DESC`,
      [team.team_id]
    );
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch insights.' });
  }
});

module.exports = router;