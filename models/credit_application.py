from odoo import models, fields, api


class CreditApplication(models.Model):
    _name = 'credit.application'
    _description = 'Solicitud de Crédito y Alta Comercial'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    # ── Estado ───────────────────────────────────────────────────────────
    state = fields.Selection([
        ('draft', 'Borrador'),
        ('review', 'En Revisión'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ], string='Estado', default='draft', tracking=True)

    # ── 1. Tipo de Cliente ───────────────────────────────────────────────
    client_type = fields.Selection([
        ('company', 'Empresa (Sociedad)'),
        ('personal', 'Personal (Monotributista / Unipersonal)'),
    ], string='Tipo de Cliente', required=True, tracking=True)

    # ── 2a. Información – Empresa ────────────────────────────────────────
    company_name = fields.Char('Razón Social')
    cuit = fields.Char('CUIT')
    email_corp = fields.Char('Email Corporativo')
    compras_name = fields.Char('Compras – Nombre')
    compras_mail = fields.Char('Compras – Mail')
    compras_phone = fields.Char('Compras – Teléfono')
    pagos_name = fields.Char('Pagos – Nombre')
    pagos_mail = fields.Char('Pagos – Mail')
    pagos_phone = fields.Char('Pagos – Teléfono')
    cbu_alias = fields.Char('CBU / Alias')

    # ── 2b. Información – Personal ───────────────────────────────────────
    full_name = fields.Char('Nombre Completo')
    dni_cuit = fields.Char('DNI / CUIT')
    email_contact = fields.Char('Email de Contacto')
    phone = fields.Char('Teléfono Celular')
    cbu_alias_personal = fields.Char('CBU / Alias (Personal)')

    # ── 3. Documentación ─────────────────────────────────────────────────
    document_ids = fields.One2many(
        'credit.application.document', 'application_id',
        string='Documentos Adjuntos',
    )

    # ── 4. Términos ──────────────────────────────────────────────────────
    accept_terms = fields.Boolean('Acepta Términos y Condiciones')

    # ── Computed Name ────────────────────────────────────────────────────
    name = fields.Char('Referencia', compute='_compute_name', store=True)

    @api.depends('client_type', 'company_name', 'full_name', 'create_date')
    def _compute_name(self):
        for rec in self:
            label = rec.company_name or rec.full_name or 'Nueva Solicitud'
            rec.name = f"SOL-{rec.id or 'X'} · {label}"

    # ── Acciones de workflow ─────────────────────────────────────────────
    def action_set_review(self):
        self.write({'state': 'review'})

    def action_approve(self):
        self.write({'state': 'approved'})

    def action_reject(self):
        self.write({'state': 'rejected'})

    def action_reset_draft(self):
        self.write({'state': 'draft'})


class CreditApplicationDocument(models.Model):
    _name = 'credit.application.document'
    _description = 'Documento adjunto de solicitud de crédito'

    application_id = fields.Many2one(
        'credit.application', string='Solicitud',
        ondelete='cascade', required=True,
    )
    doc_type = fields.Selection([
        ('constancia_cuit', 'Constancia CUIT'),
        ('cm01', 'Formulario CM01'),
        ('exencion_iibb', 'Certificado Exención IIBB'),
        ('nota_autorizacion', 'Nota de Autorización'),
        ('dni_frente', 'DNI Frente'),
        ('dni_dorso', 'DNI Dorso'),
        ('servicio_domicilio', 'Servicio Luz/Gas/Agua'),
    ], string='Tipo de Documento', required=True)
    file = fields.Binary('Archivo', required=True, attachment=True)
    filename = fields.Char('Nombre del Archivo')
