/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime string to a readable format with time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time (e.g. "2 hours ago")
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

/**
 * Get badge color class for application status
 */
export function getApplicationStatusBadge(status) {
  const map = {
    PENDING: 'badge-yellow',
    ACCEPTED: 'badge-green',
    REJECTED: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

/**
 * Get badge color class for project status
 */
export function getProjectStatusBadge(status) {
  const map = {
    NOT_STARTED: 'badge-gray',
    IN_PROGRESS: 'badge-blue',
    LATE: 'badge-red',
    COMPLETED: 'badge-green',
    VALIDATED: 'badge-purple',
  };
  return map[status] || 'badge-gray';
}

/**
 * Get badge color class for milestone status
 */
export function getMilestoneStatusBadge(status) {
  const map = {
    PENDING: 'badge-yellow',
    IN_PROGRESS: 'badge-blue',
    COMPLETED: 'badge-green',
  };
  return map[status] || 'badge-gray';
}

/**
 * Get badge color class for topic type
 */
export function getTopicTypeBadge(type) {
  return type === 'PFE' ? 'badge-blue' : 'badge-purple';
}

/**
 * Get badge color class for role
 */
export function getRoleBadge(role) {
  const map = {
    ADMIN: 'badge-red',
    STUDENT: 'badge-blue',
    SUPERVISOR: 'badge-green',
    COMPANY: 'badge-purple',
  };
  return map[role] || 'badge-gray';
}

/**
 * Format a status enum to readable text
 */
export function formatStatus(status) {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 80) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
