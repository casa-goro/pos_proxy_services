/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { ConfirmationDialog, AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";

import { Navbar } from "@point_of_sale/app/components/navbar/navbar";
patch(Navbar.prototype, {

    setup() {
        super.setup(...arguments);
        this.pos = usePos();
    }, 
    async setContingencyMode(){
        let confirmText = this.pos.session.invoice_contingency ? _t('End contingecy') : _t('Set contingecy');
        let reason = _t('If you enter the contingency mode, invoices will never be created.');
        
        this.dialog.add(ConfirmationDialog, {
            title: _t('Change contingency mode'),
            body: reason,
            confirmLabel: confirmText,
            confirm: async () => {
                const contingency_state = await this.pos.data.call('pos.session','pos_toogle_contingency_mode',[odoo.pos_session_id],{});
                this.pos.session.invoice_contingency = contingency_state;
            },
        });
    },
});
