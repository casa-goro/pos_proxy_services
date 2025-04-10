# -*- coding: utf-8 -*-
from odoo import models, fields


class PosSession(models.Model):

    _inherit = 'pos.session'

    invoice_contingency = fields.Boolean(tracking=True,)

    def _loader_params_pos_payment_method(self):
        params = super()._loader_params_pos_payment_method()
        if self.company_id.country_code == 'AR':
            params['search_params']['fields'] += ['payment_afip']
        return params

    def _loader_params_pos_session(self):
        params = super()._loader_params_pos_session()
        params['search_params']['fields'].append('invoice_contingency')
        return params

    def pos_toogle_contingency_mode(self):
        self.ensure_one()
        if self.invoice_contingency:
            self.action_unset_invoice_contingency()
        else:
            self.action_set_invoice_contingency()
        return self.invoice_contingency

    def action_set_invoice_contingency(self):
        self.invoice_contingency = True

    def action_unset_invoice_contingency(self):
        self.invoice_contingency = False


