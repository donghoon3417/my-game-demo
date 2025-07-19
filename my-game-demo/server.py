import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit

# Flask 앱 및 Socket.IO 초기화
app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

# 캐릭터 상태 초기값
position = {
    'x': 0.1,
    'y': 0.1,
    'direction': 'left',
    'anim': './images/anim1.gif',
    'dragging': False
}

# 루트 페이지 라우팅
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

# 정적 파일 서빙
@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('public', path)

# 드래그 이벤트 처리
@socketio.on('drag')
def handle_drag(data):
    global position
    position['x'] = data['x']
    position['y'] = data['y']
    position['direction'] = data.get('direction', position['direction'])
    position['anim'] = data.get('anim', position['anim'])
    position['dragging'] = data.get('dragging', False)
    emit('position', position, broadcast=True, include_self=False)

# 이동 이벤트 처리
@socketio.on('move')
def handle_move(data):
    global position
    direction = data.get('direction')
    step = data.get('step', 0.01)

    if direction:
        position['direction'] = direction

        if direction in ['left', '←']:
            position['x'] -= step
        elif direction in ['right', '→']:
            position['x'] += step
        elif direction in ['up', '↑']:
            position['y'] -= step
        elif direction in ['down', '↓']:
            position['y'] += step

        position['x'] = max(0, min(position['x'], 1))
        position['y'] = max(0, min(position['y'], 1))

        emit('position', position, broadcast=True, include_self=False)

# OpenRouter 기반 챗 응답 처리
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({'reply': '메시지를 입력해주세요.'}), 400

    try:
        headers = {
            'Authorization': f'Bearer {os.environ.get("OPENROUTER_API_KEY")}',
            'Content-Type': 'application/json'
        }

        payload = {
            "model": "openai/gpt-4",  # 원하는 모델명으로 변경 가능
            "messages": [
                {"role": "system", "content": "너는 친절한 게임 속 캐릭터야."},
                {"role": "user", "content": message}
            ]
        }

        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()

        reply = response.json()['choices'][0]['message']['content'].strip()
        return jsonify({'reply': reply})

    except Exception as e:
        print(f"[OpenRouter 오류] {e}")
        return jsonify({'reply': 'AI 응답 실패: OpenRouter 요청 중 오류 발생'}), 500

# 서버 실행
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
