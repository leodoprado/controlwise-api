from flask import Blueprint, request, jsonify
from flask_login import LoginManager, login_user, current_user, logout_user, login_required, login_manager
import bcrypt
from database.database import db
from database.models.user import User

user_route = Blueprint('user', __name__)

@user_route.route("/<int:id_user>", methods=["GET"])
#@login_required
def read_user(id_user):
    user = User.query.get(id_user)
    if user:
        return{"username": user.username, "perfil": user.role}
    
    return jsonify({"message": "Usuário não encontrado!"}), 404

@user_route.route("/", methods=["POST"])
def create_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username and password:
        hashed_password = bcrypt.hashpw(str.encode(password), bcrypt.gensalt())
        user = User(username=username, password=hashed_password, role='user')
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "Usuário cadastrado com sucesso!"})
    
    return jsonify({"message": "Dados Inválidos!"}), 400
