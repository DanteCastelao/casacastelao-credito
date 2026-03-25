/*
 * ═══════════════════════════════════════════════════════════════
 *  GOOGLE APPS SCRIPT – Receptor de Solicitud de Crédito
 *  Casa Castelao
 *
 *  INSTRUCCIONES:
 *  1. Andá a https://script.google.com → "Nuevo proyecto"
 *  2. Borrá todo el código de ejemplo y pegá TODO este archivo
 *  3. Cambiá DESTINATION_EMAIL por tu email real
 *  4. Click en "Implementar" → "Nueva implementación"
 *     - Tipo: "App web"
 *     - Ejecutar como: "Yo" (tu cuenta)
 *     - Acceso: "Cualquier persona"
 *  5. Autorizá los permisos que pida
 *  6. Copiá la URL de la implementación (termina en /exec)
 *  7. Pegá esa URL en el formulario HTML (variable SCRIPT_URL)
 * ═══════════════════════════════════════════════════════════════
 */

// ← Cambiá esto por tu email real
var DESTINATION_EMAIL = 'dantecastelaou@gmail.com';

// Nombre de la carpeta en Google Drive donde se guardan los archivos
var DRIVE_FOLDER_NAME = 'Solicitudes de Crédito - Casa Castelao';

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);

        // Crear o buscar carpeta principal
        var mainFolder = getOrCreateFolder(DRIVE_FOLDER_NAME);

        // Crear subcarpeta para esta solicitud
        var now = new Date();
        var dateStr = Utilities.formatDate(now, 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd HH:mm');
        var clientName = data.tipo === 'Empresa (Sociedad)'
            ? data.razon_social
            : data.nombre_completo;
        var subFolderName = dateStr + ' - ' + clientName;
        var subFolder = mainFolder.createFolder(subFolderName);

        // Guardar archivos en Drive
        var fileLinks = [];
        if (data.archivos && data.archivos.length > 0) {
            for (var i = 0; i < data.archivos.length; i++) {
                var archivo = data.archivos[i];
                var blob = Utilities.newBlob(
                    Utilities.base64Decode(archivo.data),
                    archivo.mimeType,
                    archivo.nombre
                );
                var file = subFolder.createFile(blob);
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                fileLinks.push({
                    nombre: archivo.etiqueta || archivo.nombre,
                    url: file.getUrl(),
                    fileName: archivo.nombre
                });
            }
        }

        // Compartir la carpeta también
        subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        // Armar y enviar el email
        var htmlBody = buildEmailHtml(data, fileLinks, subFolder.getUrl());

        GmailApp.sendEmail(DESTINATION_EMAIL,
            '📋 Nueva Solicitud de Crédito - ' + clientName,
            'Ver el email en formato HTML para todos los detalles.',
            {
                htmlBody: htmlBody,
                name: 'Formulario de Crédito - Casa Castelao'
            }
        );

        // Respuesta exitosa
        return ContentService
            .createTextOutput(JSON.stringify({ success: true, folder: subFolder.getUrl() }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: 'El script está funcionando.' }))
        .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(name) {
    var folders = DriveApp.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(name);
}

function buildEmailHtml(data, fileLinks, folderUrl) {
    var isCompany = data.tipo === 'Empresa (Sociedad)';

    var html = '<div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">';

    // Header
    html += '<div style="background:linear-gradient(135deg,#1a237e,#3949ab);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">';
    html += '<h1 style="color:#fff;margin:0;font-size:22px;">📋 Nueva Solicitud de Crédito</h1>';
    html += '<p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">Recibida el ' + Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy \'a las\' HH:mm \'hs\'') + '</p>';
    html += '</div>';

    // Body
    html += '<div style="background:#f8f9fa;padding:24px;border:1px solid #e0e0e0;border-top:none;">';

    // Tipo de cliente
    html += '<div style="background:#e8eaf6;padding:12px 16px;border-radius:8px;margin-bottom:20px;">';
    html += '<strong style="color:#1a237e;">Tipo:</strong> ' + data.tipo;
    html += '</div>';

    // Datos principales
    html += '<h2 style="color:#1a237e;font-size:16px;margin:0 0 12px;border-bottom:2px solid #1a237e;padding-bottom:6px;">Datos del Solicitante</h2>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">';

    if (isCompany) {
        html += emailRow('Razón Social', data.razon_social);
        html += emailRow('CUIT', data.cuit);
        html += emailRow('Email Corporativo', data.email_corp);
        html += emailRow('CBU / Alias', data.cbu_alias);

        html += '</table>';

        // Sector Compras
        html += '<h3 style="color:#3949ab;font-size:14px;margin:16px 0 8px;">Sector Compras</h3>';
        html += '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">';
        html += emailRow('Nombre', data.compras_nombre);
        html += emailRow('Mail', data.compras_mail);
        html += emailRow('Teléfono', data.compras_telefono);
        html += '</table>';

        // Sector Pagos
        html += '<h3 style="color:#3949ab;font-size:14px;margin:16px 0 8px;">Sector Pagos</h3>';
        html += '<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">';
        html += emailRow('Nombre', data.pagos_nombre);
        html += emailRow('Mail', data.pagos_mail);
        html += emailRow('Teléfono', data.pagos_telefono);

    } else {
        html += emailRow('Nombre Completo', data.nombre_completo);
        html += emailRow('DNI / CUIT', data.dni_cuit);
        html += emailRow('Email Contacto', data.email_contacto);
        html += emailRow('Teléfono', data.telefono);
        html += emailRow('CBU / Alias', data.cbu_alias);
    }

    html += '</table>';

    // Archivos
    if (fileLinks.length > 0) {
        html += '<h2 style="color:#1a237e;font-size:16px;margin:20px 0 12px;border-bottom:2px solid #1a237e;padding-bottom:6px;">📎 Documentación Adjunta</h2>';

        for (var i = 0; i < fileLinks.length; i++) {
            html += '<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">';
            html += '<strong>' + fileLinks[i].nombre + '</strong><br>';
            html += '<a href="' + fileLinks[i].url + '" style="color:#1a237e;font-size:13px;">📥 Ver / Descargar: ' + fileLinks[i].fileName + '</a>';
            html += '</div>';
        }

        html += '<div style="margin-top:12px;">';
        html += '<a href="' + folderUrl + '" style="display:inline-block;background:#1a237e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">📁 Abrir carpeta completa en Drive</a>';
        html += '</div>';
    }

    // Footer
    html += '</div>';
    html += '<div style="background:#1a237e;padding:14px 24px;border-radius:0 0 12px 12px;text-align:center;">';
    html += '<p style="color:rgba(255,255,255,.7);margin:0;font-size:12px;">Formulario de Crédito — Casa Castelao</p>';
    html += '</div></div>';

    return html;
}

function emailRow(label, value) {
    return '<tr>'
        + '<td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;font-weight:600;color:#37474f;width:35%;font-size:13px;">' + label + '</td>'
        + '<td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;color:#263238;font-size:13px;">' + (value || '-') + '</td>'
        + '</tr>';
}
