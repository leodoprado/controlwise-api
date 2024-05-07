from flask import Blueprint, request, jsonify
from flask_login import LoginManager, login_user, current_user, logout_user, login_required
import bcrypt
from database.models.user import User

user_route = Blueprint('user', __name__)

@user_route.route('/login', methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username and password:
        user = User.query.filter_by(username=username).first()
        if user and bcrypt.checkpw(str.encode(password), str.encode(user.password)):
            login_user(user)
            print(current_user.is_authenticated)
            return jsonify({"message": "Autenticação realizada com sucesso!"})
    
    return jsonify({"message": "Credenciais Inválidas!"}), 400

@user_route.route("/logout", methods=["GET"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout realizado com sucesso!"})

@user_route.route("/user", methods=["POST"])
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

@user_route.route("/user/<int:id_user>", methods=["GET"])
@login_required
def read_user(id_user):
    user = User.query.get(id_user)
    if user:
        return{"username": user.username, "perfil": user.role}
    
    return jsonify({"message": "Usuário não encontrado!"}), 404
    
@user_route.route("/user/<int:id_user>", methods=["PUT"])
@login_required
def update_user(id_user):
    data = request.json
    user = User.query.get(id_user)

    if id_user != current_user.id and current_user.rule == "user":
        return jsonify({"message": "Operação não permitida para o nível de usuário!"}), 403

    if user and data.get("password"):
        user.password = data.get("password")
        db.session.commit()
        return jsonify({"message": f"Senha do usuário '{id_user}-{user.username}' atualizada com sucesso!"})
    
    return jsonify({"message": "Usuário não encontrado!"}), 404

@user_route.route("/user/<int:id_user>", methods=["DELETE"])
@login_required
def delete_user(id_user):
    user = User.query.get(id_user)

    if current_user.role != "admin":
        return jsonify({"message": "Operação não permitida para o nível de Usuário!"}), 403


    if id_user == current_user.id:
        return jsonify({"message": "Usuário logado não pode Deletar a si mesmo!"}), 403

    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": f"Usuário '{id_user}-{user.username}' deletado com sucesso!"})
    
    return jsonify({"message": "Usuário não encontrado!"}), 404
