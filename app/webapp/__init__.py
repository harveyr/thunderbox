from flask import Flask

from .pages import routes as page_routes
from .endpoints import routes as endpoint_routes

HOST = '0.0.0.0'
PORT = 8004
KEY = 'SECRET KEY'

app = Flask(__name__, static_folder='static')
app.config.update(DEBUG=True, SECRET_KEY=KEY)
app.register_blueprint(page_routes.blueprint)
app.register_blueprint(endpoint_routes.blueprint, url_prefix="/api")
