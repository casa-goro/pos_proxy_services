/** @odoo-module */

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";

/**
 * Client action disparada por `pos.order.action_reimprimir_ticket_fiscal`.
 *
 * El fetch al proxy fiscal (IP local a la PC del punto de venta) tiene que
 * correr en el navegador de quien aprieta el botón — el servidor de Odoo no
 * puede alcanzar esa IP. Por eso esto es una client action y no una llamada
 * server-to-server.
 */
async function reprintFiscalTicket(env, action) {
    const { order_id, proxy_url, ticket } = action.params;
    const url = proxy_url + "/print_pos_ticket?vals=" + encodeURIComponent(JSON.stringify(ticket));

    try {
        const response = await fetch(url, {
            method: "GET",
            signal: AbortSignal.timeout(100000),
        });
        await response.json();
    } catch (error) {
        env.services.notification.add(
            _t(
                "Comunicación fallida con la impresora fiscal. Verificá que estés conectado a la" +
                    " red del punto de venta."
            ),
            { type: "danger" }
        );
        return { type: "ir.actions.act_window_close" };
    }

    await env.services.orm.write("pos.order", [order_id], { fiscal_ticket_printed: true });
    env.services.notification.add(_t("Ticket fiscal reimpreso."), { type: "success" });
    return { type: "ir.actions.act_window_close" };
}

registry.category("actions").add("pos_proxy_service_reprint_fiscal_ticket", reprintFiscalTicket);
