import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset, MaintenanceTask, MaintenanceLog } from '../types';
import { formatDate, formatInterval } from './dates';
import { CATEGORY_LABELS } from './constants';

interface ServiceHistoryData {
  asset: Asset;
  tasks: MaintenanceTask[];
  logs: MaintenanceLog[];
}

function generateHTML(data: ServiceHistoryData): string {
  const { asset, tasks, logs } = data;

  // Group logs by task
  const logsByTask: Record<string, MaintenanceLog[]> = {};
  logs.forEach((log) => {
    if (!logsByTask[log.taskId]) {
      logsByTask[log.taskId] = [];
    }
    logsByTask[log.taskId].push(log);
  });

  // Sort logs by date (newest first)
  Object.keys(logsByTask).forEach((taskId) => {
    logsByTask[taskId].sort((a, b) => b.completedAt - a.completedAt);
  });

  const assetInfo = [
    asset.year ? `${asset.year}` : '',
    asset.make || '',
    asset.model || '',
  ]
    .filter(Boolean)
    .join(' ');

  const tasksHTML = tasks
    .map((task) => {
      const taskLogs = logsByTask[task.id] || [];
      const logsHTML =
        taskLogs.length > 0
          ? taskLogs
              .map(
                (log) => `
                <tr>
                  <td>${formatDate(log.completedAt)}</td>
                  <td>${log.mileage ? log.mileage.toLocaleString() + ' mi' : '-'}</td>
                  <td>${log.hours ? log.hours.toLocaleString() + ' hrs' : '-'}</td>
                  <td>${log.cost ? '$' + log.cost.toFixed(2) : '-'}</td>
                  <td>${log.notes || '-'}</td>
                </tr>
              `
              )
              .join('')
          : '<tr><td colspan="5" class="no-records">No service records</td></tr>';

      return `
        <div class="task-section">
          <div class="task-header">
            <h3>${task.name}</h3>
            <span class="interval">${formatInterval(task.interval)}</span>
          </div>
          ${task.filterPartNumber ? `<p class="task-detail"><strong>Filter Part #:</strong> ${task.filterPartNumber}</p>` : ''}
          ${task.fluidType ? `<p class="task-detail"><strong>Fluid Type:</strong> ${task.fluidType}</p>` : ''}
          ${task.fluidCapacity ? `<p class="task-detail"><strong>Capacity:</strong> ${task.fluidCapacity}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Odometer</th>
                <th>Hours</th>
                <th>Cost</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${logsHTML}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  // Calculate totals
  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const serviceCount = logs.length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Service History - ${asset.name}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #212529;
          padding: 40px;
          font-size: 12px;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #FE7E02;
        }
        .header h1 {
          font-size: 24px;
          color: #212529;
          margin-bottom: 5px;
        }
        .header .subtitle {
          font-size: 14px;
          color: #6C757D;
        }
        .header .asset-info {
          font-size: 16px;
          color: #FE7E02;
          margin-top: 10px;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          padding: 15px;
          background: #F8F9FA;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .value {
          font-size: 20px;
          font-weight: bold;
          color: #FE7E02;
        }
        .summary-item .label {
          font-size: 11px;
          color: #6C757D;
          text-transform: uppercase;
        }
        .task-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #FE7E02;
          color: white;
          padding: 10px 15px;
          border-radius: 6px 6px 0 0;
        }
        .task-header h3 {
          font-size: 14px;
          margin: 0;
        }
        .interval {
          font-size: 11px;
          background: rgba(255,255,255,0.2);
          padding: 3px 8px;
          border-radius: 10px;
        }
        .task-detail {
          font-size: 11px;
          color: #6C757D;
          padding: 5px 15px;
          background: #F8F9FA;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #DEE2E6;
        }
        th {
          background: #F8F9FA;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          color: #6C757D;
        }
        td {
          font-size: 12px;
        }
        .no-records {
          text-align: center;
          color: #6C757D;
          font-style: italic;
          padding: 20px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #ADB5BD;
          border-top: 1px solid #DEE2E6;
          padding-top: 15px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .task-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${asset.name}</h1>
        <div class="subtitle">${CATEGORY_LABELS[asset.category]}</div>
        ${assetInfo ? `<div class="asset-info">${assetInfo}</div>` : ''}
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${tasks.length}</div>
          <div class="label">Maintenance Tasks</div>
        </div>
        <div class="summary-item">
          <div class="value">${serviceCount}</div>
          <div class="label">Service Records</div>
        </div>
        <div class="summary-item">
          <div class="value">$${totalCost.toFixed(2)}</div>
          <div class="label">Total Spent</div>
        </div>
      </div>

      ${tasksHTML}

      <div class="footer">
        Generated by DueSoon on ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;
}

export async function generateServiceHistoryPDF(
  data: ServiceHistoryData
): Promise<void> {
  try {
    const html = generateHTML(data);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Service History - ${data.asset.name}`,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
