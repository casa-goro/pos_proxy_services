/** @odoo-module */

import { PosStore } from "@point_of_sale/app/services/pos_store";
import { ErrorDialog } from "@web/core/errors/error_dialogs";
import { patch } from "@web/core/utils/patch";

patch(PosStore.prototype, {

    // async setup() {
    //     await super.setup(...arguments);
    //     this.pos = usePos();
    // }, 

    useFiscalPrinter(){
        return this.config.use_fiscal_printer;
    },

    async afterProcessServerData(){
        if (this.useFiscalPrinter())
            await this.state_printer();
        await super.afterProcessServerData(...arguments);
    },

    async state_printer(){
        const url = this.config.proxy_fiscal_printer + '/state_printer';
        
        try {
            const response = await fetch(url, {
                method: "GET",
                signal: AbortSignal.timeout(100000)
            });
            const res = await response.json();
            console.info('state_printer res new: ', res);
        } catch (error) {
            this.message_error_printer_fiscal('Comunicación fallida con la impresora fiscal');
        }
    },

    async print_pos_fiscal_close(type){
        const url = this.config.proxy_fiscal_printer + '/print_pos_fiscal_close';
        console.info('print_pos_fiscal_close url: ', url);
        
        try {
            const response = await fetch(url + '?type=' + type, {
                method: "GET",
                signal: AbortSignal.timeout(100000)
            });
            const res = await response.json();
            console.info('print_pos_fiscal_close res: ', res);
            this.message_error_printer_fiscal(res['response']);
        } catch (error) {
            this.message_error_printer_fiscal('Comunicación fallida con el Proxy');
        }
    },

    async print_pos_ticket(pos_session){
        var order = this.getOrder();
        if (pos_session.invoice_contingency || order.isToInvoice()){
            console.log('MODO CONTINGENCIA: No imprimo ticket');
            return;
        }
        const url = this.config.proxy_fiscal_printer + '/print_pos_ticket';
        console.info('print_pos_ticket url: ', url);
        const data = JSON.stringify(this.get_values_ticket());
        
        try {
            const response = await fetch(url + '?vals=' + encodeURIComponent(data), {
                method: "GET",
                signal: AbortSignal.timeout(100000)
            });
            const res = await response.json();
            console.info('print_pos_ticket res new: ', res);
        } catch (error) {
            this.message_error_printer_fiscal('Comunicación fallida con el Proxy');
        }
    },

    get_values_ticket(){
        var order = this.getOrder();
        var type = this.get_afip_document_code();
        var name = order.name;
        var cliente = this.get_values_client();
        var items = this.get_values_items();
        var pagos = this.get_values_paymentlines();
        var descuentos = this.get_values_discount();
        var jsonTemplate = {
            'name': name,
            'type': type,
            'cliente' :cliente,
            'items' :items,
            'pagos':pagos,
            'descuentos': descuentos,
            'ajustes': []
        };
        console.info('jsonTemplate: ', jsonTemplate);
        return jsonTemplate;
    },

    get_afip_document_code(){
        let partner = this.getOrder().partner_id;
        let type = 83;
        if(partner){
            if (partner.l10n_latam_identification_type_id?.name == 'Sigd'){
                return 83;
            }
            if (this.company.l10n_ar_afip_responsibility_type_id?.code == '6'){
                return 111;
            }
            if (partner.l10n_ar_afip_responsibility_type_id){
                let partner_responsibility_type_code = partner.l10n_ar_afip_responsibility_type_id.code

                if(partner_responsibility_type_code == '1') type = 81; //Factura A0
                else if(partner_responsibility_type_code == '6') type = 111;//Factura C
                else if(partner_responsibility_type_code == '5' || partner_responsibility_type_code == '4') type = 82;//Factura B
            }
        }
        return type;
    },

    get_values_client(){
        var partner = this.getOrder().partner_id;
        if (partner){
            var id_responsabilidad_iva = 'E';
            if (partner.l10n_ar_afip_responsibility_type_id){
                let partner_responsibility_type_code = partner.l10n_ar_afip_responsibility_type_id.code

                if(partner_responsibility_type_code == '1') id_responsabilidad_iva = 'I';
                else if(partner_responsibility_type_code == '6') id_responsabilidad_iva = 'M';
                else if(partner_responsibility_type_code == '5') id_responsabilidad_iva = 'F';
                else if(partner_responsibility_type_code == '4') id_responsabilidad_iva = 'E';
            }
            let id_tipo_documento = 'T';
            if (partner.l10n_latam_identification_type_id){
                if(partner.l10n_latam_identification_type_id.name == 'CUIT') id_tipo_documento = 'T';
                if(partner.l10n_latam_identification_type_id.name == 'DNI') id_tipo_documento = 'D';
                if(partner.l10n_latam_identification_type_id.name == 'CUIL') id_tipo_documento = 'L';
                if(partner.l10n_latam_identification_type_id.name == 'Pasaporte') id_tipo_documento = 'P';
            }
            let street = '';
            let city = '';
            let vat = '';
            if(partner.street) street = partner.street;
            if(partner.city) city = partner.city;
            if(partner.vat) vat = partner.vat;
            return {
                'nombre_o_razon_social1' : partner.name,
                'nombre_o_razon_social2' : '',
                'domicilio1' : street,
                'domicilio2' : city,
                'domicilio3' : '',
                'id_tipo_documento' : id_tipo_documento,
                'numero_documento' : vat,
                'id_responsabilidad_iva' : id_responsabilidad_iva,
                'documento_asociado1' : '',
                'documento_asociado2' : '',
                'documento_asociado3' : '',
                'cheque_reintegro_turista' : ''
            };
        }
        return {};
    },

    get_values_items(){
        let order_lines = this.getOrder().lines;
        let items = [];
        let type = this.get_afip_document_code();
        for (let i = 0; i < order_lines.length; i++) {
             let line = order_lines[i];
             let taxes = line.tax_ids;
             let iva = 0; //Tasa de iva ninguno
             let code_intern = '';
             let unit_measure = 0;//Sin unidad de medida
             for (var k = 0; k < taxes.length; k++){
                 if (taxes[k]){
                     iva = taxes[k].amount;
                     break;
                 }
             }
             let uom = line.product_id.uom_id
             if (uom) unit_measure = uom.l10n_ar_afip_code;
             if(line.product_id.barcode) code_intern = line.product_id.barcode;
             else if(line.product_id.default_code) code_intern = line.product_id.default_code;
             if(code_intern == '') code_intern = '11111';

             let price = line.price_unit * (1.0 - (line.discount / 100.0));
             if (this.config.version_printer == 'hasar250'){
                 price = line.price_subtotal_incl;
             }
             else if(this.config.version_printer == 'epsont900fa' && (type == 83 || type == 82)){
                 console.info('is epson and is ticket');
                 price = line.price_subtotal_incl / line.qty;
             }
             else if(this.config.version_printer == 'epsont900fa' && (type != 83 || type != 82)){
                 console.info('is epson and is not ticket');
                 price = line.price_subtotal / line.qty;
             }
             let  product_discount_general = false;

            //  if ('module_pos_discount' in this.config &&  this.config.module_pos_discount){
            //      console.info('discount_product_id: ', this.config.discount_product_id, ' - line.product: ', line.product_id);
            //      if(this.config.discount_product_id &&  this.config.discount_product_id[0] == line.product_id.id && price < 0){
            //          product_discount_general = true;
            //      }
            //  }

            let item_vals = {
                 'description' : line.full_product_name,
                 'description_extra1' : '',
                 'qty' : line.qty,
                 'price' : price,
                 'iva' : iva,
                 'unit_measure' : unit_measure,
                 'code_intern' : code_intern,
                 'product_discount_general' : product_discount_general
             };
             items.push(item_vals);
         }
         return items;
     },

     get_values_paymentlines(){
        var paymentlines = this.getOrder().payment_ids;
        console.info('get_values_paymentlines: ', paymentlines);
        var pagos = [];
        for (var i = 0; i < paymentlines.length; i++){
            var pay = paymentlines[i];
            let payment_afip = 99;//Otras Formas de pago

            if (pay.payment_method_id && pay.payment_method_id.payment_afip) payment_afip = pay.payment_method_id.payment_afip;
            let payment_method = pay.payment_method_id;
            let name = '';
            if(payment_method){
                name = payment_method.name;
            }

            var pay_vals = {
                'codigo_forma_pago' : payment_afip,
                'cantidad_cuotas': '',
                'monto' : pay.amount,
                'descripcion_cupones' : '',
                'descripcion' : name,
                'descripcion_extra1' : '',
                'descripcion_extra2' : ''
            }
            pagos.push(pay_vals);
        }
        return pagos;
    },

    get_values_discount(){
        var order_lines = this.getOrder().lines;
        var rounding = this.currency.rounding;
        var sum_amount_discount = 0;

        for (var i = 0; i < order_lines.length; i++){
            var line = order_lines[i];
            var base_price = line.price_subtotal
            var price_line_bruto = Math.round((line.price_unit * line.qty) * Math.pow(10, this.currency.decimal_places)) / Math.pow(10, this.currency.decimal_places);
            var discount = price_line_bruto - base_price;
            sum_amount_discount += discount;
        }
        if (sum_amount_discount == 0) return [];
        var vals = [
            {'descripcion' : 'Descuentos', 'monto' : sum_amount_discount, 'tasa_iva' : '', 'codigo_interno' : '', 'codigo_condicion_iva' : ''}
        ];
        return vals;
    },

    message_error_printer_fiscal(error){
        if (error !== true){
            this.dialog.add(ErrorDialog, {
                traceback:  error,
            });
        }
    }
});
