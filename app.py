from flask import Flask, request, Response
from config import configure_all
from flask_cors import CORS

app = Flask(__name__)

cors = CORS(app)

@app.before_request
def basic_authentication():
    if request.method.lower() == 'options':
        return Response()

configure_all(app)

if __name__ == "__main__":
    app.run(debug=True)