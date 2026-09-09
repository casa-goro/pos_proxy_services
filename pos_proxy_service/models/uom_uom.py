from odoo import api, models


class UomUom(models.Model):
    _inherit = "uom.uom"

    @api.model
    def _load_pos_data_fields(self, config):
        # El codigo ARCA de la unidad de medida viaja en cada item del ticket
        # fiscal y el POS arma el ticket en el cliente. Si el campo no se carga
        # con la sesion, `unit_measure` sale vacio y la impresora rechaza la
        # linea.
        return super()._load_pos_data_fields(config) + ["l10n_ar_afip_code"]
