import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

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

@socketio.on('drag')
def handle_drag(data):
    global position
    position['x'] = data['x']
    position['y'] = data['y']
    position['direction'] = data.get('direction', position['direction'])
    position['anim'] = data.get('anim', position['anim'])
    position['dragging'] = data.get('dragging', False)
    emit('position', position, broadcast=True, include_self=False)

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

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({'reply': '메시지를 입력해주세요.'}), 400

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("[환경변수 오류] OPENROUTER_API_KEY가 설정되지 않았습니다.")
        return jsonify({'reply': '서버 설정 오류: API 키 없음'}), 500

    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        payload = {
            "model": "openrouter/openai/gpt-4",  # 모델명 명시적으로 지정
            "messages": [
                {"role": "system", "content": "너는 친절한 게임 속 캐릭터야."},
                {"role": "user", "content": message}
            ]
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()

        result = response.json()
        reply = result.get('choices', [{}])[0].get('message', {}).get('content', '').strip()

        if not reply:
            print("[OpenRouter 응답 오류] 'content'가 없습니다:", result)
            return jsonify({'reply': 'AI 응답 오류: 내용이 비었습니다.'}), 502

        return jsonify({'reply': reply})

    except requests.exceptions.Timeout:
        print("[오류] OpenRouter 요청 시간 초과")
        return jsonify({'reply': 'AI 응답 시간이 초과되었습니다.'}), 504
    except requests.exceptions.RequestException as e:
        print(f"[OpenRouter 요청 오류] {e}")
        return jsonify({'reply': 'OpenRouter 연결 실패'}), 502
    except Exception as e:
        print(f"[알 수 없는 오류] {e}")
        return jsonify({'reply': '예기치 못한 서버 오류'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
