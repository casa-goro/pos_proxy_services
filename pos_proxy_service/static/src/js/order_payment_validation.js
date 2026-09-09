/** @odoo-module */

import OrderPaymentValidation from "@point_of_sale/app/utils/order_payment_validation";
import { patch } from "@web/core/utils/patch";

patch(OrderPaymentValidation.prototype, {
    /**
     * El ticket fiscal se imprime ANTES de sincronizar con el servidor: el
     * comprobante lo emite el controlador fiscal y tiene que salir aunque no
     * haya internet.
     *
     * Es el orden que tenia la 16 (patch sobre PaymentScreen._finalizeValidation).
     * La migracion a 19 lo habia movido a validateOrder, que corre despues de
     * arrancar la sincronizacion: en el camino FeedbackScreen el core dispara
     * finalizeValidation() sin await, asi que la impresion competia con el
     * sync_from_ui y se armaba el ticket con datos que todavia no estaban.
     *
     * @override
     */
    async finalizeValidation() {
        if (this.pos.useFiscalPrinter()) {
            await this.pos.print_pos_ticket();
        }
        return await super.finalizeValidation(...arguments);
    },
});
