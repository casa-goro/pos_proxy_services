# -*- coding: utf-8 -*-
from odoo import models, api


class PosSession(models.Model):

    _inherit = 'pos.session'

    def _loader_params_pos_payment_method(self):
        params = super()._loader_params_pos_payment_method()
        if self.company_id.country_code == 'AR':
            params['search_params']['fields'] += ['payment_afip']
        return params
