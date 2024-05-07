from flask import Flask
from config import configure_all

app = Flask(__name__)

configure_all(app)

if __name__ == "__main__":
    app.run(debug=True)