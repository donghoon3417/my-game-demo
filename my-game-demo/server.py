import os
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

position = {'x': 100, 'y': 100, 'direction': 'left'}  # 초기 위치와 방향

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('public', path)

@socketio.on('drag')
def handle_drag(data):
    global position
    position['x'] = data['x']
    position['y'] = data['y']
    position['direction'] = data.get('direction', position['direction'])
    emit('position', position, broadcast=True, include_self=False)

@socketio.on('move')
def handle_move(data):
    global position
    direction = data.get('direction')
    step = data.get('step', 10)  # 기본 이동 거리: 10
    position['direction'] = direction  # 현재 방향 저장

    if direction == 'left':
        position['x'] -= step
    elif direction == 'right':
        position['x'] += step
    elif direction == 'up':
        position['y'] -= step
    elif direction == 'down':
        position['y'] += step

    emit('position', position, broadcast=True, include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
