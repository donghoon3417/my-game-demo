import os
from flask import Flask, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit
import openai

# OpenAI API 키 읽기 (Render 환경변수에서)
openai.api_key = os.environ.get('OPENAI_API_KEY')

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

# 캐릭터 위치 상태 (비율 기준 0~1)
position = {
    'x': 0.1,
    'y': 0.1,
    'direction': 'left',
    'anim': './images/anim1.gif',
    'dragging': False
}

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('public', path)

# ✅ 채팅 처리 라우트 (OpenAI GPT 연동)
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({'reply': '(메시지가 비어있습니다)'})

    try:
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=[
                {"role": "system", "content": "너는 친절한 게임 캐릭터야. 짧고 귀엽게 대답해."},
                {"role": "user", "content": message}
            ],
            max_tokens=100,
            temperature=0.8
        )
        reply = response.choices[0].message.content.strip()
        return jsonify({'reply': reply})
    except Exception as e:
        print("❌ OpenAI 오류:", e)
        return jsonify({'reply': '(AI 응답 중 오류 발생)'})

# ✅ 드래그 이벤트 처리
@socketio.on('drag')
def handle_drag(data):
    global position
    position['x'] = data['x']
    position['y'] = data['y']
    position['direction'] = data.get('direction', position['direction'])
    position['anim'] = data.get('anim', position['anim'])
    position['dragging'] = data.get('dragging', False)
    emit('position', position, broadcast=True, include_self=False)

# ✅ 키보드 이동 처리
@socketio.on('move')
def handle_move(data):
    global position
    direction = data.get('direction')
    step = data.get('step', 0.01)

    if direction:
        position['direction'] = direction

        if direction == 'left':
            position['x'] -= step
        elif direction == 'right':
            position['x'] += step
        elif direction == 'up':
            position['y'] -= step
        elif direction == 'down':
            position['y'] += step

        # 좌표 범위 제한
        position['x'] = max(0, min(position['x'], 1))
        position['y'] = max(0, min(position['y'], 1))

    emit('position', position, broadcast=True, include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
