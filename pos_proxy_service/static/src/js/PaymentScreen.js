/** @odoo-module */

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";

patch(PaymentScreen.prototype, {
    /**
     * @override
     */

    async validateOrder(isForceValidate = false) {

        await super.validateOrder(...arguments);
        if (this.pos.useFiscalPrinter()){
            await this.pos.print_pos_ticket(this.pos);
        }

    }

});
