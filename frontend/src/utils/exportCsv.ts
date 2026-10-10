import { Task } from '../types';

/**
 * Escapes values for standard RFC 4180 CSV output
 */
const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Exports AI Predicted Tasks directly as a downloadable CSV in browser
 */
export const exportPredictedTasksToCsv = (tasks: Task[], customFilename?: string) => {
  if (!tasks || tasks.length === 0) {
    throw new Error('No predicted tasks available to export.');
  }

  const headers = [
    'Task ID',
    'Task Title',
    'AI Predicted Priority',
    'AI Priority Reasoning',
    'User Importance',
    'Status',
    'Estimated Duration',
    'Deadline',
    'Is Overdue',
    'Description',
    'Created Date',
    'Last Updated',
  ];

  const now = new Date();

  const rows = tasks.map((task) => {
    const isOverdue =
      task.status !== 'completed' && task.deadline && new Date(task.deadline) < now;

    const formattedDeadline = task.deadline
      ? new Date(task.deadline).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    const formattedCreated = task.createdAt
      ? new Date(task.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    const formattedUpdated = task.updatedAt
      ? new Date(task.updatedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    return [
      escapeCsvCell(task._id || task.id),
      escapeCsvCell(task.title),
      escapeCsvCell((task.priority || 'medium').toUpperCase()),
      escapeCsvCell(task.priorityReason || 'Evaluated by OfficeCompanion AI Engine'),
      escapeCsvCell((task.importance || 'medium').toUpperCase()),
      escapeCsvCell((task.status || 'pending').replace('_', ' ').toUpperCase()),
      escapeCsvCell(task.estimatedTime || '45 mins'),
      escapeCsvCell(formattedDeadline),
      escapeCsvCell(isOverdue ? 'YES' : 'NO'),
      escapeCsvCell(task.description || ''),
      escapeCsvCell(formattedCreated),
      escapeCsvCell(formattedUpdated),
    ].join(',');
  });

  // UTF-8 BOM + Content
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = customFilename || `OfficeCompanion_AI_Predicted_Tasks_${timestamp}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
