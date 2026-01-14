import { MaintenanceInterval, MaintenanceTask } from '../types';

export function calculateNextDueDate(
  lastCompleted: number,
  interval: MaintenanceInterval
): number | undefined {
  if (interval.type === 'miles' || interval.type === 'hours') {
    return undefined; // These are usage-based, not time-based
  }

  const date = new Date(lastCompleted);

  switch (interval.type) {
    case 'days':
      date.setDate(date.getDate() + interval.value);
      break;
    case 'months':
      date.setMonth(date.getMonth() + interval.value);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + interval.value);
      break;
  }

  return date.getTime();
}

export function getDaysUntilDue(dueDate: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  // Use Math.round to handle timezone edge cases more accurately
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatInterval(interval: MaintenanceInterval): string {
  const { type, value } = interval;
  const plural = value !== 1;

  switch (type) {
    case 'days':
      return `Every ${value} day${plural ? 's' : ''}`;
    case 'months':
      return `Every ${value} month${plural ? 's' : ''}`;
    case 'years':
      return `Every ${value} year${plural ? 's' : ''}`;
    case 'miles':
      return `Every ${value.toLocaleString()} miles`;
    case 'hours':
      return `Every ${value.toLocaleString()} hours`;
  }
}

export function getTaskStatus(
  task: MaintenanceTask
): 'overdue' | 'due-soon' | 'upcoming' | 'unknown' {
  if (!task.nextDue) {
    return 'unknown';
  }

  const daysUntil = getDaysUntilDue(task.nextDue);

  if (daysUntil < 0) {
    return 'overdue';
  } else if (daysUntil <= task.reminderDaysBefore) {
    return 'due-soon';
  }
  return 'upcoming';
}

export function sortTasksByUrgency(tasks: MaintenanceTask[]): MaintenanceTask[] {
  return [...tasks].sort((a, b) => {
    // Tasks without due dates go last
    if (!a.nextDue && !b.nextDue) return 0;
    if (!a.nextDue) return 1;
    if (!b.nextDue) return -1;

    return a.nextDue - b.nextDue;
  });
}
