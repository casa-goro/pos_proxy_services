
from odoo import api, fields, tools, models, _
from odoo.exceptions import UserError


class PosConfig(models.Model):
    _inherit = 'pos.config'

    use_fiscal_printer = fields.Boolean('Impresora Fiscal')
    proxy_fiscal_printer = fields.Char('Ip Impresora Fiscal', default='http://127.0.0.1:5005')
    # Las opciones 'g', 'o' y 'hasar715' son las que ya usa la instalación del
    # cliente en 16.0. La migración a 19 las había dejado fuera, y el -u borró
    # las tres de ir.model.fields.selection dejando 68 pos.config con un valor
    # que el campo ya no ofrecía: la vista pide version_printer como required,
    # así que guardar la configuración de una caja obligaba a elegir otro modelo
    # y pisar el dato. Solo 'hasar250' y 'epsont900fa' cambian el precio que se
    # manda a imprimir; el resto usa el cálculo por defecto.
    version_printer = fields.Selection([
        ('g', 'Generica'),
        ('o', 'Otras'),
        ('hasar715', 'Hasar 715'),
        ('hasar250', 'Hasar 250'),
        ('epsont900fa', 'Epson T900FA'),
    ], default='epsont900fa')

