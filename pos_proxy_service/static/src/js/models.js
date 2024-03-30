odoo.define('pos_proxy_service.models', function (require) {
    "use strict";

var { PosGlobalState, Order } = require('point_of_sale.models');
var { Gui } = require('point_of_sale.Gui');
var utils = require('web.utils');
const Registries = require('point_of_sale.Registries');

var round_pr = utils.round_precision;

const PosL10nArPosGlobalState = (PosGlobalState) => class PosL10nArPosGlobalState extends PosGlobalState {
    async _processData(loadedData) {
        await super._processData(...arguments);
    }
    useFiscalPrinter(){
        return this.config.use_fiscal_printer;
    }
    async after_load_server_data(){
        if (this.useFiscalPrinter())
            await this.state_printer();
       await super.after_load_server_data();
    }
    async state_printer(){
        var self = this;
        var url = this.config.proxy_fiscal_printer + '/state_printer';
        var print_fiscal_proxy = $.ajax({
            type: "GET",
            url: url,
            timeout:100000
        });

        print_fiscal_proxy.done(function(res){
          console.info('state_printer res new: ', res);
          self.message_error_printer_fiscal(res['response'])
        }).fail(function(xhr, textStatus, errorThrown){
          self.message_error_printer_fiscal('Comunicación fallida con la impresora fiscal')
        });
        // return def;
    }
    async print_pos_fiscal_close(type){
        var self = this;
        var url = this.config.proxy_fiscal_printer + '/print_pos_fiscal_close';
        console.info('print_pos_fiscal_close url: ', url);
        var data =  {'type' : type};
        var print_fiscal_proxy = $.ajax({
            type: "GET",
            url: url,
            data : data,
            timeout:100000
        });

        print_fiscal_proxy.done(function(res){
          console.info('print_pos_fiscal_close res: ', res);
          self.message_error_printer_fiscal(res['response'])
        }).fail(function(xhr, textStatus, errorThrown){
          self.message_error_printer_fiscal('Comunicación fallida con el Proxy')
        });

    }
    async print_pos_ticket(){
        var self = this;
        var url = this.config.proxy_fiscal_printer + '/print_pos_ticket';
        console.info('print_pos_ticket url: ', url);
        var data =  {'vals' : JSON.stringify(this.get_values_ticket())};
        var print_fiscal_proxy = $.ajax({
            type: "GET",
            url: url,
            data : data,
            timeout:100000
        });

        print_fiscal_proxy.done(function(res){
          console.info('print_pos_ticket res new: ', res);
          self.message_error_printer_fiscal(res['response'])
        }).fail(function(xhr, textStatus, errorThrown){
          self.message_error_printer_fiscal('Comunicación fallida con el Proxy')
      	});
    }
    get_values_ticket(){
        var order = this.get_order();
        var type = this.get_afip_document_code();
        var name = order.get_name();
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
    }
    get_responsibility_type_code(afip_responsibility_type_id){
        let res = this.l10n_ar_afip_responsibility_type.filter((responsibility_type) => responsibility_type.id == afip_responsibility_type_id[0]);
        return res ? res[0].code : false;
    }
    get_afip_document_code(){
        let partner = this.get_order().get_partner();
        let type = 83;
        if(partner){
            let company_responsibility_type_code = this.get_responsibility_type_code(this.company.l10n_ar_afip_responsibility_type_id)
            if (company_responsibility_type_code == '6'){
                return 111;
            }
            if (partner.l10n_ar_afip_responsibility_type_id){
                let partner_responsibility_type_code = this.get_responsibility_type_code(partner.l10n_ar_afip_responsibility_type_id)

                if(partner_responsibility_type_code == '1') type = 81; //Factura A
                else if(partner_responsibility_type_code == '6') type = 111;//Factura C
                else if(partner_responsibility_type_code == '5' || partner_responsibility_type_code == '4') type = 82;//Factura B
            }
        }
        return type;
    }
    get_values_client(){
        var partner = this.get_order().get_partner();
        //console.info('get_values_ticket: ', client);
        if (partner){
            var id_responsabilidad_iva = 'E';
            if (partner.l10n_ar_afip_responsibility_type_id){
                let partner_responsibility_type_code = this.get_responsibility_type_code(partner.l10n_ar_afip_responsibility_type_id)

                if(partner_responsibility_type_code == '1') id_responsabilidad_iva = 'I'; 
                else if(partner_responsibility_type_code == '6') id_responsabilidad_iva = 'M';
                else if(partner_responsibility_type_code == '5') id_responsabilidad_iva = 'F';
                else if(partner_responsibility_type_code == '4') id_responsabilidad_iva = 'E';
            }
            /*id_tipo_documento = {
                'D' : 'DNI' , 
                'L' : 'CUIL' , 
                'T' : 'CUIT' , 
                'C' : 'Cédula de Identidad' ,
                'P' : 'Pasaporte' , 
                'V' : 'Libreta Cívica' , 
                'E' : 'Libreta de Enrolamiento '
            } */
            let id_tipo_documento = 'T';
            if (partner.l10n_latam_identification_type_id){

                if(partner.l10n_latam_identification_type_id[1] == 'CUIT') id_tipo_documento = 'T';
                if(partner.l10n_latam_identification_type_id[1] == 'DNI') id_tipo_documento = 'D';
                if(partner.l10n_latam_identification_type_id[1] == 'CUIL') id_tipo_documento = 'L';
                if(partner.l10n_latam_identification_type_id[1] == 'Pasaporte') id_tipo_documento = 'P';
                //if(partner.l10n_latam_identification_type_id[1] == 'PAS') id_tipo_documento = 'P';
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
    }
    get_values_items(){
        let order_lines = this.get_order().get_orderlines();
        let items = [];
        let type = this.get_afip_document_code();
        for (let i = 0; i < order_lines.length; i++) {
             let line = order_lines[i];
             let taxes = line.get_taxes();
             let iva = 0; //Tasa de iva ninguno
             let code_intern = '';
             let unit_measure = 0;//Sin unidad de medida
             for (var k = 0; k < taxes.length; k++){
                 if (taxes[k]){
                     iva = taxes[k].amount;
                     break;
                 }
             }
             let uom = line.get_unit()
             if (uom) unit_measure = uom.l10n_ar_afip_code;
             if(line.product.barcode) code_intern = line.product.barcode;
             else if(line.product.default_code) code_intern = line.product.default_code; 
             if(code_intern == '') code_intern = '11111';

             let price = line.get_unit_price() * (1.0 - (line.get_discount() / 100.0));
             if (this.config.version_printer == 'hasar250'){
                 price = line.get_all_prices().priceWithTax;
             }
             else if(this.config.version_printer == 'epsont900fa' && type == 83){
                 console.info('is epson and is ticket');
                 price = line.get_all_prices().priceWithTax / line.quantity;
             }
             else if(this.config.version_printer == 'epsont900fa' && type != 83){
                 console.info('is epson and is not ticket');
                 price = line.get_all_prices().priceWithoutTax / line.quantity;

             }
             let  product_discount_general = false;

             if ('module_pos_discount' in this.config &&  this.config.module_pos_discount){
                 console.info('discount_product_id: ', this.config.discount_product_id, ' - line.product: ', line.product);
                 if(this.config.discount_product_id &&  this.config.discount_product_id[0] == line.product.id && price < 0){
                     product_discount_general = true;
                 }
             }

            let item_vals = {
                 'description' : line.product.display_name,
                 'description_extra1' : '',
                 'qty' : line.quantity,
                 'price' : price,
                 'iva' : iva,
                 'unit_measure' : unit_measure,
                 'code_intern' : code_intern,
                 'product_discount_general' : product_discount_general
             };
             items.push(item_vals);
         }
         return items;
     }
     get_values_paymentlines(){
        var paymentlines = this.get_order().get_paymentlines();
        console.info('get_values_paymentlines: ', paymentlines);
        var pagos = [];
        for (var i = 0; i < paymentlines.length; i++){
            var pay = paymentlines[i];
            let payment_afip = 99;//Otras Formas de pago

            if (pay.payment_method && pay.payment_method.payment_afip) payment_afip = pay.payment_method.payment_afip;
            let payment_method = pay.payment_method;
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

    }
    get_values_discount(){
        var order_lines = this.get_order().get_orderlines();
        var rounding = this.currency.rounding;
        var sum_amount_discount = 0;

        for (var i = 0; i < order_lines.length; i++){
            var line = order_lines[i];
            var base_price = line.get_base_price()
            var price_line_bruto = round_pr(line.get_unit_price() * line.get_quantity(), rounding);
            var discount = price_line_bruto - base_price;
            //console.info('discount: ', discount);
            sum_amount_discount += discount;
        }
        if (sum_amount_discount == 0) return [];
        var vals = [
            {'descripcion' : 'Descuentos', 'monto' : sum_amount_discount, 'tasa_iva' : '', 'codigo_interno' : '', 'codigo_condicion_iva' : ''}
        ];
        return vals;
    }
    message_error_printer_fiscal(error){
        if (error != true){
            Gui.showPopup('ErrorPopup',{
                'title': 'Error Impresora Fiscal',
                'body':  error,
            });
        }
    }

}
Registries.Model.extend(PosGlobalState, PosL10nArPosGlobalState);

});
