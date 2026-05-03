import apiClient from '../api/client'; // <-- Única importación de apiClient
import { 
  pickFirst, 
  getItemsFromResponse, 
  getEvento, 
  getModulo, 
  getIp, 
  getSeveridad, 
  getResultado, 
  getResultadoLabel, 
  formatDate 
} from './auditoria.utils';

export const exportAuditReport = async ({ pages, includeIncidents, token, limit, userRole, blacklistCount }) => {
  const pageRequests = Array.from({ length: pages }, (_, i) =>
    apiClient.get('/auditoria', {
      params: { page: i + 1, limit },
      headers: { Authorization: `Bearer ${token}` }
    })
  );

  const baseRequests = [
    apiClient.get('/auditoria/stats', {
      headers: { Authorization: `Bearer ${token}` }
    }),
    ...pageRequests
  ];

  if (includeIncidents) {
    baseRequests.push(
      apiClient.get('/auditoria/incidentes/criticos', {
        params: { page: 1, limit: 100 },
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  const responses = await Promise.all(baseRequests);
  const statsRes = responses[0];
  const logResponses = responses.slice(1, 1 + pages);
  const criticosRes = includeIncidents ? responses[responses.length - 1] : null;

  const exportStats = statsRes?.data || {};
  const mergedLogs = logResponses.flatMap(r => getItemsFromResponse(r?.data));
  const uniqueMap = new Map();
  mergedLogs.forEach(item => uniqueMap.set(item.id_auditoria ?? `${item.timestamp_evento}-${getEvento(item)}`, item));
  const exportLogs = Array.from(uniqueMap.values());

  const exportCriticos = includeIncidents ? getItemsFromResponse(criticosRes?.data || []) : [];

  const rows = exportLogs.map((log) => `
    <tr>
      <td>${formatDate(log.timestamp_evento)}</td>
      <td>${pickFirst(log.id_usuario, log.usuario, 'Sistema')}</td>
      <td>${getIp(log)}</td>
      <td>${getEvento(log)}</td>
      <td>${getModulo(log)}</td>
      <td>${getSeveridad(log)}</td>
      <td>${getResultadoLabel(getResultado(log))}</td>
    </tr>
  `).join('');

  const incidentRows = exportCriticos.map((inc) => `
    <tr>
      <td>${inc.id_auditoria}</td>
      <td>${getEvento(inc)}</td>
      <td>${getModulo(inc)}</td>
      <td>${getSeveridad(inc)}</td>
      <td>${getResultadoLabel(getResultado(inc))}</td>
      <td>${getIp(inc)}</td>
      <td>${formatDate(inc.timestamp_evento)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte Forense de Auditoría</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1A1510; margin: 0; padding: 24px; background: #fff; }
          .header { border-bottom: 2px solid #1B4F8A; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 700; color: #1B4F8A; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #5A5048; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
          .card { border: 1px solid #DAD4CC; border-radius: 10px; padding: 12px; background: #FDFAF5; }
          .card .label { font-size: 11px; color: #5A5048; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
          .card .value { font-size: 22px; font-weight: 700; }
          h2 { margin: 24px 0 12px; font-size: 16px; color: #1A1510; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #DAD4CC; padding: 8px 10px; font-size: 11px; text-align: left; vertical-align: top; }
          th { background: #F5F2EC; text-transform: uppercase; color: #5A5048; }
          .note { margin-top: 24px; padding: 12px 14px; border-left: 4px solid #D97706; background: #FFF8E8; font-size: 11px; color: #5A5048; }
          .page-break { page-break-before: always; }
          @MedSys print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Reporte Forense de Auditoría</div>
          <div class="subtitle">MedSys ECE Chiapas · Generado: ${formatDate(new Date().toISOString())}</div>
          <div class="subtitle">Rol exportador: ${userRole || 'NO_IDENTIFICADO'} · Páginas exportadas: ${pages} · Registros incluidos: ${exportLogs.length}</div>
          <div class="subtitle">Trazabilidad legal, bitácora de accesos e incidentes para documentación institucional</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="label">Eventos hoy</div>
            <div class="value">${Number(exportStats?.eventos_hoy || 0)}</div>
          </div>
          <div class="card">
            <div class="label">Incidentes críticos activos</div>
            <div class="value">${Number(exportStats?.criticos || 0)}</div>
          </div>
          <div class="card">
            <div class="label">Total histórico</div>
            <div class="value">${Number(exportStats?.total || 0)}</div>
          </div>
          <div class="card">
            <div class="label">Tokens bloqueados</div>
            <div class="value">${blacklistCount}</div>
          </div>
        </div>

        <h2>Bitácora de accesos y eventos</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Usuario</th>
              <th>IP</th>
              <th>Evento</th>
              <th>Módulo</th>
              <th>Severidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7">Sin registros disponibles</td></tr>`}
          </tbody>
        </table>

        ${includeIncidents ? `
          <div class="page-break"></div>
          <h2>Incidentes críticos activos</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Evento</th>
                <th>Módulo</th>
                <th>Severidad</th>
                <th>Estado</th>
                <th>IP</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${incidentRows || `<tr><td colspan="7">Sin incidentes críticos activos</td></tr>`}
            </tbody>
          </table>
        ` : ''}

        <div class="note">
          Documento generado para soporte institucional. La exportación PDF del módulo de auditoría es un requisito funcional del sistema; los registros se presentan en modo solo lectura para preservar la trazabilidad y la integridad forense.
        </div>

        <script>
          window.onload = function () { window.print(); };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    throw new Error('El navegador bloqueó la ventana de impresión. Permite popups para exportar el PDF.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};