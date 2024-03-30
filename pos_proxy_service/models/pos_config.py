
from odoo import api, fields, tools, models, _
from odoo.exceptions import UserError


class PosConfig(models.Model):
	_inherit = 'pos.config'

	use_fiscal_printer = fields.Boolean('Impresora Fiscal')
	proxy_fiscal_printer = fields.Char('Ip Impresora Fiscal', default='http://127.0.0.1:5005')
	version_printer = fields.Selection([
		('hasar250', 'Hasar 250'),
		('epsont900fa', 'Epson T900FA'),
	], default='epsont900fa')

