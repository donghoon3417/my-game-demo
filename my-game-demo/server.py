from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app)

position = {'x': 100, 'y': 100}

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('public', path)

@socketio.on('move')
def handle_move(data):
    global position
    direction = data.get('direction')
    if direction == 'left':
        position['x'] -= 10
    elif direction == 'right':
        position['x'] += 10
    elif direction == 'up':
        position['y'] -= 10
    elif direction == 'down':
        position['y'] += 10
    emit('position', position, broadcast=True)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
