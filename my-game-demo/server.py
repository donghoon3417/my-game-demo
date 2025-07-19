import os
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import openai

# 환경 변수에서 OpenAI API 키 가져오기
openai.api_key = os.environ.get("OPENAI_API_KEY")

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

# 캐릭터 위치 상태
position = {
    'x': 0.1,
    'y': 0.1,
    'direction': 'left',
    'anim': './images/anim1.gif',
    'dragging': False
}

# 기본 페이지 제공
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

# 정적 파일 제공
@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('public', path)

# SocketIO: 드래그 처리
@socketio.on('drag')
def handle_drag(data):
    global position
    position['x'] = data['x']
    position['y'] = data['y']
    position['direction'] = data.get('direction', position['direction'])
    position['anim'] = data.get('anim', position['anim'])
    position['dragging'] = data.get('dragging', False)
    emit('position', position, broadcast=True, include_self=False)

# SocketIO: 이동 처리
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

# OpenAI 챗 응답 처리
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({'reply': '메시지를 입력해주세요.'}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "너는 친절한 게임 속 캐릭터야."},
                {"role": "user", "content": message}
            ],
            max_tokens=100,
            temperature=0.8
        )
        reply = response['choices'][0]['message']['content'].strip()
        return jsonify({'reply': reply})
    except Exception as e:
        print(f"[ERROR] OpenAI 응답 실패: {e}")
        return jsonify({'reply': 'AI 응답 실패: 서버 오류가 발생했습니다.'}), 500

# 서버 실행
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
