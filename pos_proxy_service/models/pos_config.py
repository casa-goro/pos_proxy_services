import hashlib
import hmac
import secrets
import time
from urllib.parse import quote

from odoo import api, fields, tools, models, _
from odoo.exceptions import UserError


class PosConfig(models.Model):
    _inherit = 'pos.config'

    use_fiscal_printer = fields.Boolean('Impresora Fiscal')
    proxy_fiscal_printer = fields.Char('Ip Impresora Fiscal', default='http://127.0.0.1:5005')
    # Clave compartida con el proxy de la caja (clave_firma en genesis-proxy.ini).
    # Con clave, los pedidos que emiten algo (ticket y cierres X/Z) van firmados
    # con HMAC-SHA256 para que una página ajena abierta en la caja, o un equipo
    # de la red, no pueda emitir comprobantes ni hacer un cierre Z. Sin clave se
    # manda como antes (proxies Hasar/Epson que no la conocen).
    fiscal_proxy_key = fields.Char('Clave de firma del proxy fiscal', copy=False)
    # Las opciones 'g', 'o' y 'hasar715' son las que ya usa la instalación del
    # cliente en 16.0. La migración a 19 las había dejado fuera, y el -u borró
    # las tres de ir.model.fields.selection dejando 68 pos.config con un valor
    # que el campo ya no ofrecía: la vista pide version_printer como required,
    # así que guardar la configuración de una caja obligaba a elegir otro modelo
    # y pisar el dato. Solo 'hasar250' y 'epsont900fa' cambian el precio que se
    # manda a imprimir; el resto usa el cálculo por defecto.
    version_printer = fields.Selection([
        ('g', 'Generica'),
        ('o', 'Otras'),
        ('hasar715', 'Hasar 715'),
        ('hasar250', 'Hasar 250'),
        ('epsont900fa', 'Epson T900FA'),
    ], default='epsont900fa')

    def action_generate_fiscal_proxy_key(self):
        for config in self:
            config.fiscal_proxy_key = secrets.token_hex(32)

    def _fiscal_proxy_url(self, path, params):
        """URL del proxy fiscal para `path`, firmada si la caja tiene clave.

        Mismo formato que `fiscalProxyUrl` en PosStore.js y que verifica
        Seguridad.cs del proxy: firma = HMAC-SHA256(clave, path + "?" + consulta),
        con la consulta tal como viaja e incluyendo ts (segundos Unix).
        """
        self.ensure_one()
        query = "&".join("%s=%s" % (k, quote(str(v), safe="")) for k, v in params.items())
        if self.fiscal_proxy_key:
            query += ("&" if query else "") + "ts=%d" % int(time.time())
            firma = hmac.new(self.fiscal_proxy_key.encode(), (path + "?" + query).encode(), hashlib.sha256).hexdigest()
            query += "&firma=" + firma
        return (self.proxy_fiscal_printer or "").rstrip("/") + path + ("?" + query if query else "")
