// backend/middleware/planLimits.js
// Shared plan limit definitions

const PLAN_LIMITS = {
  free:       { users: 3,   projects: 5   },
  pro:        { users: 20,  projects: 50  },
  ultra:      { users: 100, projects: 200 },
  enterprise: { users: -1,  projects: -1  }, // -1 = unlimited
};

module.exports = PLAN_LIMITS;