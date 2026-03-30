# -*- coding: utf-8 -*-

import logging

from odoo import http
from odoo.http import request
import json

_logger = logging.getLogger(__name__)


class TestPrinterController(http.Controller):

    @http.route('/test_printer/print_pos_ticket', type='http', auth='user', methods=['GET'], csrf=False)
    def print_pos_ticket(self, vals, **kwargs):
        """
        Test route to simulate a print_pos_ticket call.
        Logs all received GET parameters to the Odoo log.
        """
        
        _logger.info("=== test_printer/print_pos_ticket called ===")
        message = ""
        try:
            vals_dict = json.loads(vals)
            for key, value in vals_dict.items():
                message += "%s = %s\n" % (key, value)
        except (json.JSONDecodeError, AttributeError) as e:
            _logger.error("Error parsing vals JSON: %s", e)
            _logger.info("  [raw vals] %s", vals)
        
        _logger.info(message)
        _logger.info("=== end of params ===")

        return request.make_response(
            '{"status": "ok", "message": "Parameters logged successfully"}',
            headers=[('Content-Type', 'application/json')]
        )

    @http.route('/test_printer/state_printer', type='http', auth='user', methods=['GET'], csrf=False)
    def state_printer(self, **kwargs):
        """
        Test route to simulate a state_printer call.
        Logs the call and returns an OK JSON response.
        """
        _logger.info("=== test_printer/state_printer called ===")

        return request.make_response(
            '{"status": "ok", "response": true}',
            headers=[('Content-Type', 'application/json')]
        )

    @http.route('/test_printer/print_pos_fiscal_close', type='http', auth='user', methods=['GET'], csrf=False)
    def print_pos_fiscal_close(self, **kwargs):
        """
        Test route to simulate a print_pos_fiscal_close call.
        Logs the call and returns an OK JSON response.
        """
        _logger.info("=== test_printer/print_pos_fiscal_close called ===")

        return request.make_response(
            '{"status": "ok", "response": true}',
            headers=[('Content-Type', 'application/json')]
        )

