import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";

patch(PosOrder.prototype, {
    setup(vals) {
        super.setup(...arguments);
        if (this.config.use_fiscal_printer) {
            this.to_invoice = false;
        }
    },

    setToInvoice(to_invoice) {
        // Con impresora fiscal el comprobante lo emite la impresora, así que la
        // orden nunca tiene que generar además una factura desde Odoo.
        // Interceptar acá (y no solo en setup) cubre el caso de setPartner(),
        // que en el core fuerza la factura cuando el cliente es una compañía.
        super.setToInvoice(this.config.use_fiscal_printer ? false : to_invoice);
    },
});
