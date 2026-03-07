// /** @odoo-module */

// import { Component } from "@odoo/owl";
// import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
// import { usePos } from "@point_of_sale/app/hooks/pos_hook";
// import { SelectionPopup } from "@point_of_sale/app/utils/selection_popup/selection_popup";
// import { _t } from "@web/core/l10n/translation";

// export class CfTicketButtons extends Component {
//     static template = "pos_proxy_service.CfTicketButtons";

//     setup() {
//         this.pos = usePos();
//     }

//     async onClick() {
//         console.log('Cierre Fiscal Button clicked');
//         const listaCierres = [
//             {
//                 id: "1",
//                 label: _t("Cierre X"),
//                 item: "x",
//             },
//             {
//                 id: "2",
//                 label: _t("Cierre Z"),
//                 item: "z",
//             }
//         ];

//         const { confirmed, payload: seleccioncierre } = await this.pos.dialog.add(
//             SelectionPopup,
//             {
//                 title: _t('Selecione el cierre fiscal'),
//                 list: listaCierres,
//             }
//         );
        
//         if (confirmed) {
//             if (seleccioncierre === 'z'){
//                 const con = confirm(_t("¿Esta seguro de imprimir cierre Z?"));
//                 if (!con){
//                     return;
//                 }
//             }
//             this.pos.print_pos_fiscal_close(seleccioncierre);
//         }
//     }
// }

// ProductScreen.addControlButton({
//     component: CfTicketButtons,
//     condition: function() {
//         return this.pos.config.use_fiscal_printer;
//     },
// });
