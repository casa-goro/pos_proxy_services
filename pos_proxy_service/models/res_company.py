# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, api


class ResCompany(models.Model):
    _inherit = 'res.company'

    @api.model
    def _load_pos_data_fields(self, config):
        """El ticket fiscal necesita la responsabilidad AFIP de la compañía para
        decidir el tipo de comprobante. No se puede leer de company.partner_id en
        el POS: desde la 19 solo se carga un subconjunto de res.partner (ver
        res.partner._load_pos_data_domain) y el partner de la compañía no está
        garantizado, con lo que la relación queda undefined en el cliente."""
        fields = super()._load_pos_data_fields(config)
        if self.env.company.country_id.code == 'AR':
            fields.append('l10n_ar_afip_responsibility_type_id')
        return fields
