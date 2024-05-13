from routes.user import user_route
from database.database import db
from flask_login import LoginManager

def configure_all(app):
    configure_routes(app)
    configure_db(app)

def configure_routes(app):
    app.register_blueprint(user_route, url_prefix='/user')

def configure_db(app):
    app.config['SECRET_KEY'] = "your-secret-key"
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:senha123@localhost/controlwise'
    db.init_app(app)
    login_manager = LoginManager()
    login_manager.init_app(app)