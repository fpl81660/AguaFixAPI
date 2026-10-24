import { CreateReportDto } from '../dtos/create-report.dto.js';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const generateReportTemplate = (
  dto: CreateReportDto,
  photoUrl: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; }
        .container { background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; }
        h1 { color: #d9534f; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f8f8; }
        .severity-high { color: #d9534f; font-weight: bold; }
        .severity-medium { color: #f0ad4e; font-weight: bold; }
        .severity-low { color: #5cb85c; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>¡Nuevo Reporte de Fuga de Agua!</h1>
        <p>Se ha recibido un nuevo reporte que requiere atención de la cuadrilla de mantenimiento.</p>
        
        <table>
          <tr>
            <th>Dirección:</th>
            <td>${escapeHtml(dto.address)}</td>
          </tr>
          <tr>
            <th>Descripción:</th>
            <td>${escapeHtml(dto.description)}</td>
          </tr>
          <tr>
            <th>Severidad:</th>
            <td class="severity-${escapeHtml(dto.severity)}">${escapeHtml(dto.severity.toUpperCase())}</td>
          </tr>
          <tr>
            <th>Teléfono de Contacto:</th>
            <td>${escapeHtml(dto.reporterPhone)}</td>
          </tr>
        </table>
        <p>Foto de la fuga:</p>
        <img src="${escapeHtml(photoUrl)}" alt="Foto de la fuga reportada" width="560" style="display: block; max-width: 100%; height: auto; border-radius: 8px;">
        
        <p>Por favor atender a la brevedad posible.</p>
      </div>
    </body>
    </html>
  `;
};
