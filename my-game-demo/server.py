import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='public')
socketio = SocketIO(app, cors_allowed_origins="*")

# 캐릭터 위치 초기화
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
    character_name = data.get('characterName', '루카')  # 기본값

    if not message:
        return jsonify({'reply': '메시지를 입력해주세요.'}), 400

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return jsonify({'reply': '서버 설정 오류: API 키 없음'}), 500

    # 캐릭터별 성격 설정
    character_profiles = {
        "루카": {
            "personality": "당신은 상냥하고 귀엽고 말끝에 '~다옹', '~냐옹' 같은 말을 붙이는 고양이 같은 AI입니다.",
            "lang": "한국어"
        },
        "에이미": {
            "personality": "당신은 활발하고 장난기 많은 어린아이처럼 말하는 AI입니다. 간단하고 재미있는 말투를 써주세요.",
            "lang": "한국어"
        },
        "Zara": {
            "personality": "You are a calm and wise character who speaks only in English with helpful, concise advice.",
            "lang": "English"
        }
    }

    # 지정된 캐릭터가 없으면 기본
    profile = character_profiles.get(character_name, {
        "personality": "친절하고 정중한 AI입니다.",
        "lang": "한국어"
    })

    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://yourapp.com',
        }

        payload = {
            "model": "mistralai/mistral-7b-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": f"당신은 이름이 '{character_name}'인 캐릭터입니다. {profile['personality']} 반드시 {profile['lang']}로만 대답하세요."
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "temperature": 0.7
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()

        result = response.json()
        reply = result.get("choices", [{}])[0].get("message", {}).get("content", '').strip()

        if not reply:
            return jsonify({'reply': 'AI 응답 오류: 내용이 비었습니다.'}), 502

        return jsonify({'reply': reply})

    except requests.exceptions.Timeout:
        return jsonify({'reply': 'AI 응답 시간이 초과되었습니다.'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'reply': 'OpenRouter 연결 실패'}), 502
    except Exception as e:
        return jsonify({'reply': '예기치 못한 서버 오류'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
