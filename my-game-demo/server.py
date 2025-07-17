from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

@socketio.on('drag')
def handle_drag(data):
    emit('position', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
