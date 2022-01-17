import logging
import urllib.request
import requests

from flask import jsonify
from . import app_state
from . import loader

logger = logging.getLogger(__package__)

def initiate_load(future_key):
    """
    Handler for the 'load' route.

    Data can only be loaded once, so this will fail if data has already been loaded.
    """
    if app_state.started():
        result = loader.submit_stored(future_key)
        return jsonify("load queued"), 200
        
    elif app_state.loading():
        return jsonify("request ignored: previously queued load pending"), 200

    elif app_state.loaded():
        return jsonify("request failed: config previously loaded"), 500
    
    else: #-- this should never happen
        return jsonify(f"unknown state '{ app_state.get_state() }'"), 500
    

def initiate_reload(future_key):
    """
    Handler for the 'reload' route.

    Only a subset of data can be reloaded.  The initial load of the
    first set of data should have been performed previously.
    """
    if app_state.loaded():
        loader.submit_stored(future_key, reload=True)
        return jsonify("load queued"), 200
        
    elif app_state.loading():
        return jsonify("request ignored: previously queued load pending"), 200 
    
    elif app_state.started():
        return jsonify("request ignored: initial load never performed"), 500
    
    else: #-- this should never happen
        return jsonify(f"unknown state '{ app_state.get_state() }'"), 500
