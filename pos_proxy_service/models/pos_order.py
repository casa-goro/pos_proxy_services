from odoo import _, fields, models
from odoo.exceptions import UserError


class PosOrder(models.Model):
    _inherit = "pos.order"

    fiscal_ticket_printed = fields.Boolean(string="Ticket fiscal impreso")

    def action_reimprimir_ticket_fiscal(self):
        """Dispara desde el backend la reimpresión del ticket fiscal.

        El proxy de impresión fiscal (`pos.config.proxy_fiscal_printer`) es una
        IP local a la PC del punto de venta: solo responde si quien aprieta el
        botón está en esa red. Por eso el fetch al proxy corre en el navegador
        (client action), no en el servidor de Odoo.
        """
        self.ensure_one()
        config = self.session_id.config_id
        if not config.use_fiscal_printer:
            raise UserError(_("Este punto de venta no tiene configurada la impresora fiscal."))
        return {
            "type": "ir.actions.client",
            "tag": "pos_proxy_service_reprint_fiscal_ticket",
            "params": {
                "order_id": self.id,
                "proxy_url": config.proxy_fiscal_printer,
                "ticket": self._get_fiscal_ticket_values(),
            },
        }

    def _get_fiscal_ticket_values(self):
        """Réplica en Python de `get_values_ticket` (PosStore.js).

        Se mantiene deliberadamente duplicada del JS: el botón de reimpresión
        vive en el backend, sin sesión de POS activa, así que no puede
        reutilizar los modelos en memoria del frontend. Si se corrige el
        mapeo AFIP de un lado, hay que revisar el otro.
        """
        self.ensure_one()
        doc_type = self._get_fiscal_document_code()
        return {
            "name": self.name,
            "type": doc_type,
            "cliente": self._get_fiscal_client_values(),
            "items": self._get_fiscal_item_values(doc_type),
            "pagos": self._get_fiscal_payment_values(),
            "descuentos": self._get_fiscal_discount_values(),
            "ajustes": [],
        }

    def _get_fiscal_document_code(self):
        partner = self.partner_id
        doc_type = 83
        if not partner:
            return doc_type
        if partner.l10n_latam_identification_type_id.name == "Sigd":
            return 83
        if self.company_id.partner_id.l10n_ar_afip_responsibility_type_id.code == "6":
            return 111
        responsibility = partner.l10n_ar_afip_responsibility_type_id
        if responsibility:
            code = responsibility.code
            if code == "1":
                doc_type = 81
            elif code == "6":
                doc_type = 111
            elif code in ("5", "4"):
                doc_type = 82
        return doc_type

    def _get_fiscal_client_values(self):
        partner = self.partner_id
        if not partner:
            return {}
        id_responsabilidad_iva = "E"
        responsibility = partner.l10n_ar_afip_responsibility_type_id
        if responsibility:
            id_responsabilidad_iva = {
                "1": "I",
                "6": "M",
                "5": "F",
                "4": "E",
            }.get(responsibility.code, id_responsabilidad_iva)
        id_tipo_documento = "T"
        identification = partner.l10n_latam_identification_type_id
        if identification:
            id_tipo_documento = {
                "CUIT": "T",
                "DNI": "D",
                "CUIL": "L",
                "Pasaporte": "P",
            }.get(identification.name, id_tipo_documento)
        return {
            "nombre_o_razon_social1": partner.name,
            "nombre_o_razon_social2": "",
            "domicilio1": partner.street or "",
            "domicilio2": partner.city or "",
            "domicilio3": "",
            "id_tipo_documento": id_tipo_documento,
            "numero_documento": partner.vat or "",
            "id_responsabilidad_iva": id_responsabilidad_iva,
            "documento_asociado1": "",
            "documento_asociado2": "",
            "documento_asociado3": "",
            "cheque_reintegro_turista": "",
        }

    def _get_fiscal_item_values(self, doc_type):
        config = self.session_id.config_id
        items = []
        for line in self.lines:
            iva = 0
            for tax in line.tax_ids:
                iva = tax.amount
                break
            code_intern = line.product_id.barcode or line.product_id.default_code or "11111"
            unit_measure = line.product_id.uom_id.l10n_ar_afip_code or 0
            price = line.price_unit * (1.0 - (line.discount / 100.0))
            if config.version_printer == "hasar250":
                price = line.price_subtotal_incl
            elif config.version_printer == "epsont900fa":
                if doc_type in (83, 82):
                    price = line.price_subtotal_incl / line.qty
                else:
                    price = line.price_subtotal / line.qty
            items.append(
                {
                    "description": line.full_product_name,
                    "description_extra1": "",
                    "qty": line.qty,
                    "price": price,
                    "iva": iva,
                    "unit_measure": unit_measure,
                    "code_intern": code_intern,
                    "product_discount_general": False,
                }
            )
        return items

    def _get_fiscal_payment_values(self):
        pagos = []
        for pay in self.payment_ids:
            method = pay.payment_method_id
            pagos.append(
                {
                    "codigo_forma_pago": method.payment_afip if method and method.payment_afip else "99",
                    "cantidad_cuotas": "",
                    "monto": pay.amount,
                    "descripcion_cupones": "",
                    "descripcion": method.name if method else "",
                    "descripcion_extra1": "",
                    "descripcion_extra2": "",
                }
            )
        return pagos

    def _get_fiscal_discount_values(self):
        sum_amount_discount = 0.0
        for line in self.lines:
            price_line_bruto = self.currency_id.round(line.price_unit * line.qty)
            sum_amount_discount += price_line_bruto - line.price_subtotal
        if not sum_amount_discount:
            return []
        return [
            {
                "descripcion": "Descuentos",
                "monto": sum_amount_discount,
                "tasa_iva": "",
                "codigo_interno": "",
                "codigo_condicion_iva": "",
            }
        ]
