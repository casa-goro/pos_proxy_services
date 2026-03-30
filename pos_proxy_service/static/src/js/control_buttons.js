/** @odoo-module */
import { ControlButtons } from "@point_of_sale/app/screens/product_screen/control_buttons/control_buttons";

import { patch } from "@web/core/utils/patch";

patch(ControlButtons.prototype, {
    async clickFiscalXClose(){
        return await this.pos.print_pos_fiscal_close('x');
    },
    async clickFiscalZClose(){
        return await this.pos.print_pos_fiscal_close('z');
    },
})
