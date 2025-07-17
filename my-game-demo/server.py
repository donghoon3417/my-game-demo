import os
from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__, template_folder='public', static_folder='public')
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Render는 환경변수 PORT 사용
    socketio.run(app, host='0.0.0.0', port=port)
