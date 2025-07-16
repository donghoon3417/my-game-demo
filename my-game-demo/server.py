import os
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

# 좌표를 0~1 비율로 관리
position = {'x': 0.1, 'y': 0.1, 'direction': 'left'}

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
    
    # 👉 dragging 값도 포함해서 전달
    emit('position', {
        'x': position['x'],
        'y': position['y'],
        'direction': position['direction'],
        'dragging': data.get('dragging', False)  # 없으면 False 처리
    }, broadcast=True, include_self=False)


@socketio.on('move')
def handle_move(data):
    global position
    direction = data.get('direction')
    step = data.get('step', 0.01)  # 0~1 기준 비율로 이동 (ex: 0.01 = 1%)

    position['direction'] = direction

    if direction == 'left':
        position['x'] -= step
    elif direction == 'right':
        position['x'] += step
    elif direction == 'up':
        position['y'] -= step
    elif direction == 'down':
        position['y'] += step

    # 범위 제한 (0~1)
    position['x'] = max(0, min(position['x'], 1))
    position['y'] = max(0, min(position['y'], 1))

    emit('position', position, broadcast=True, include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
