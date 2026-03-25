import base64
import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

# Maximum file size: 5 MB
MAX_FILE_SIZE = 5 * 1024 * 1024


class CreditApplicationController(http.Controller):

    @http.route('/solicitud-credito', type='http', auth='public', website=True)
    def credit_form(self, **kw):
        """Render the public credit application form."""
        return request.render('credit_application.credit_form_page', {})

    @http.route('/solicitud-credito/submit', type='http', auth='public',
                website=True, methods=['POST'], csrf=True)
    def credit_form_submit(self, **post):
        """Process the submitted credit application form."""
        client_type = post.get('client_type', 'company')

        # ── Build application values ────────────────────────────────────
        vals = {
            'client_type': client_type,
            'accept_terms': post.get('accept_terms') == 'on',
            'state': 'review',
        }

        if client_type == 'company':
            vals.update({
                'company_name': post.get('company_name', ''),
                'cuit': post.get('cuit', ''),
                'email_corp': post.get('email_corp', ''),
                'compras_name': post.get('compras_name', ''),
                'compras_mail': post.get('compras_mail', ''),
                'compras_phone': post.get('compras_phone', ''),
                'pagos_name': post.get('pagos_name', ''),
                'pagos_mail': post.get('pagos_mail', ''),
                'pagos_phone': post.get('pagos_phone', ''),
                'cbu_alias': post.get('cbu_alias', ''),
            })
        else:
            vals.update({
                'full_name': post.get('full_name', ''),
                'dni_cuit': post.get('dni_cuit', ''),
                'email_contact': post.get('email_contact', ''),
                'phone': post.get('phone', ''),
                'cbu_alias_personal': post.get('cbu_alias_personal', ''),
            })

        # ── Create record (sudo for public access) ──────────────────────
        application = request.env['credit.application'].sudo().create(vals)

        # ── Process uploaded documents ──────────────────────────────────
        doc_type_map = {
            'company': [
                ('doc_constancia_cuit', 'constancia_cuit'),
                ('doc_cm01', 'cm01'),
                ('doc_exencion_iibb', 'exencion_iibb'),
                ('doc_nota_autorizacion', 'nota_autorizacion'),
            ],
            'personal': [
                ('doc_dni_frente', 'dni_frente'),
                ('doc_dni_dorso', 'dni_dorso'),
                ('doc_constancia_cuit_personal', 'constancia_cuit'),
                ('doc_servicio_domicilio', 'servicio_domicilio'),
            ],
        }

        for field_name, doc_type in doc_type_map.get(client_type, []):
            uploaded = post.get(field_name)
            if uploaded and hasattr(uploaded, 'read'):
                file_data = uploaded.read()
                if len(file_data) > MAX_FILE_SIZE:
                    _logger.warning(
                        'File %s exceeds 5 MB limit, skipping.', uploaded.filename
                    )
                    continue
                request.env['credit.application.document'].sudo().create({
                    'application_id': application.id,
                    'doc_type': doc_type,
                    'file': base64.b64encode(file_data),
                    'filename': uploaded.filename,
                })

        return request.render('credit_application.credit_form_success', {})
