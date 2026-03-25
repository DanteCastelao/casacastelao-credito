{
    'name': 'Solicitud de Crédito y Alta Comercial',
    'version': '17.0.1.0.0',
    'category': 'Sales',
    'summary': 'Formulario público de solicitud de crédito y alta comercial para Casa Castelao',
    'description': """
        Módulo que permite a clientes potenciales completar un formulario público
        para solicitar crédito comercial (cheques diferidos / cuenta corriente).
        Incluye:
        - Formulario público con secciones condicionales (Empresa / Personal)
        - Carga de documentación digital
        - Aceptación de términos y condiciones
        - Vista de gestión backend para el equipo de créditos
    """,
    'author': 'Casa Castelao',
    'website': 'https://www.casacastelao.com.ar',
    'depends': ['base', 'website', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/credit_application_views.xml',
        'views/credit_form_template.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'credit_application/static/src/css/credit_form.css',
            'credit_application/static/src/js/credit_form.js',
        ],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
