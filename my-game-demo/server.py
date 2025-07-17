from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__,
            template_folder='public',  # HTML 파일 경로 지정
            static_folder='public')    # JS/CSS/이미지 경로 지정
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')  # public/index.html 사용

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
