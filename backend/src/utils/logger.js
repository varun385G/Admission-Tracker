const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user_id, action, entity_type, entity_id, details, ip_address }) => {
  try {
    await AuditLog.create({ user_id, action, entity_type, entity_id, details, ip_address });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

module.exports = { logAudit };
