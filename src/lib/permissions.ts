// Admin-panel permission helpers.
// The real enforcement is on the backend (requireWrite middleware); this is
// only used to tailor the UI (hide write controls, gate the Admins page).
// Defaults to 'write' so legacy/full admins are unaffected.

export type AdminPermission = 'read' | 'write';

export const getAdminPermission = (): AdminPermission =>
  (localStorage.getItem('adminPermission') as AdminPermission) || 'write';

export const canWrite = (): boolean => getAdminPermission() === 'write';
