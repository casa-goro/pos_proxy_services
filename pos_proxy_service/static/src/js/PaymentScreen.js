odoo.define('pos_proxy_service.PaymentScreen', function (require) {
    "use strict";
        const PaymentScreen = require('point_of_sale.PaymentScreen');
        const Registries = require('point_of_sale.Registries');

        const PosProxyServicePaymentScreen = PaymentScreen =>
            class extends PaymentScreen {
                /**
                 * @override
                 */

                async _finalizeValidation() {
                    if (this.env.pos.useFiscalPrinter()){
                        await this.env.pos.print_pos_ticket();
                    }
                    await super._finalizeValidation();
                }
        };

    Registries.Component.extend(PaymentScreen, PosProxyServicePaymentScreen);

    return PaymentScreen;
});
