import os
import eventlet
eventlet.monkey_patch()  # ✅ 필수

from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__, template_folder='public', static_folder='public')
socketio = SocketIO(app, async_mode='eventlet')  # ✅ eventlet 명시

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)
