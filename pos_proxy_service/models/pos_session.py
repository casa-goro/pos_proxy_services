# -*- coding: utf-8 -*-
from odoo import models, fields, api


class PosSession(models.Model):

    _inherit = 'pos.session'

    invoice_contingency = fields.Boolean(tracking=True,)

    @api.model
    def _load_pos_data_fields(self, config_id):
        return super()._load_pos_data_fields(config_id) + ["invoice_contingency"]

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


