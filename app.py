from flask import Flask, request, jsonify, send_from_directory, session, Response, stream_with_context
from pathlib import Path
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
import threading
import queue
import json
import os
import smtplib
from email.message import EmailMessage

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'dev-secret-change-for-prod'

DB_PATH = Path('users.db')

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    created = False
    if not DB_PATH.exists():
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE users (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                quizzes_completed INTEGER DEFAULT 0
            )
        ''')
        cur.execute('''
            CREATE TABLE attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                quiz_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        cur.execute('''
            CREATE TABLE quizzes (
                quiz_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        cur.execute('''
            CREATE TABLE questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quiz_id TEXT NOT NULL,
                prompt TEXT NOT NULL,
                choices TEXT NOT NULL,
                correct_index INTEGER NOT NULL
            )
        ''')
        cur.execute('''
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                read INTEGER DEFAULT 0
            )
        ''')
        # create demo user
        cur.execute('INSERT INTO users(username, password_hash, created_at, quizzes_completed) VALUES (?,?,?,?)', (
            'student', generate_password_hash('password'), datetime.now(timezone.utc).isoformat(), 0
        ))
        # seed a few sample quizzes
        now = datetime.now(timezone.utc).isoformat()
        sample_quizzes = [
            ('sample-1', 'Business Ethics Quiz', now),
            ('sample-2', 'Corporate Finance II', now),
            ('sample-3', 'Database Systems Final', now),
        ]
        cur.executemany('INSERT INTO quizzes(quiz_id, title, created_at) VALUES (?,?,?)', sample_quizzes)
        # seed sample questions (choices stored as JSON text)
        sample_questions = [
            ('sample-1', 'Which HTML tag defines a link?', '["<a>", "<div>", "<p>"]', 0),
            ('sample-1', 'Which attribute sets the link destination?', '["href", "src", "alt"]', 0),
            ('sample-2', 'What is the formula for Net Present Value?', '["Sum of discounted cash flows", "Future value minus present value", "Average cash flow"]', 0),
            ('sample-3', 'Which SQL clause filters rows?', '["WHERE", "GROUP BY", "ORDER BY"]', 0),
        ]
        cur.executemany('INSERT INTO questions(quiz_id, prompt, choices, correct_index) VALUES (?,?,?,?)', sample_questions)
        # seed a global notification about new quizzes
        cur.execute('INSERT INTO notifications(username, type, message, created_at) VALUES (?,?,?,?)', (None, 'new_quiz', 'New quizzes available: Business Ethics Quiz, Corporate Finance II, Database Systems Final', now))
        # broadcast initial notification
        # (do not send email on seed global)
        broadcast_event({'type': 'notification', 'notification': {'username': None, 'type': 'new_quiz', 'message': 'New quizzes available', 'created_at': now}})
        conn.commit()
        conn.close()
        created = True
    # run simple migrations for existing DBs: ensure users has email and email_notify
    conn = get_db()
    cur = conn.cursor()
    cur.execute("PRAGMA table_info('users')")
    cols = [r['name'] for r in cur.fetchall()]
    if 'email' not in cols:
        try:
            cur.execute('ALTER TABLE users ADD COLUMN email TEXT')
        except Exception:
            pass
    if 'email_notify' not in cols:
        try:
            cur.execute('ALTER TABLE users ADD COLUMN email_notify INTEGER DEFAULT 0')
        except Exception:
            pass
    conn.commit()
    conn.close()
    return created

init_db()

# Simple SSE broadcaster for real-time events
subscribers = []  # list of queue.Queue

def broadcast_event(data: dict):
    for q in list(subscribers):
        try:
            q.put_nowait(data)
        except Exception:
            pass

def send_email(to_address: str, subject: str, body: str):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587')) if os.environ.get('SMTP_PORT') else None
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    from_addr = os.environ.get('FROM_EMAIL') or smtp_user
    if not smtp_host or not smtp_user or not smtp_pass or not from_addr:
        return False
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = from_addr
        msg['To'] = to_address
        msg.set_content(body)
        if smtp_port:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(smtp_host, timeout=10)
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print('send_email error', e)
        return False

def send_notification(username, ntype, message, send_email_flag=True):
    conn = get_db()
    cur = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cur.execute('INSERT INTO notifications(username, type, message, created_at) VALUES (?,?,?,?)', (username, ntype, message, now))
    conn.commit()
    # broadcast via SSE
    notif = {'username': username, 'type': ntype, 'message': message, 'created_at': now}
    broadcast_event({'type': 'notification', 'notification': notif})
    # optionally send email if user has email and opted in
    if send_email_flag and username:
        cur.execute('SELECT email, email_notify FROM users WHERE username = ?', (username,))
        row = cur.fetchone()
        if row and row['email'] and row['email_notify']:
            try:
                send_email(row['email'], f'UCC Quiz Lab: {ntype}', message)
            except Exception as e:
                print('email send failed', e)
    conn.close()


@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or request.form
    username = (data.get('username') or '').strip()
    password = data.get('password')
    email = (data.get('email') or '').strip() or None
    email_notify = int(bool(data.get('email_notify') or data.get('emailNotify') or data.get('notify') ))
    if not username or not password:
        return jsonify({'ok': False, 'message': 'Missing fields'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT username FROM users WHERE username = ?', (username,))
    if cur.fetchone():
        conn.close()
        return jsonify({'ok': False, 'message': 'User exists'}), 409
    cur.execute('INSERT INTO users(username, password_hash, created_at, email, email_notify) VALUES (?,?,?,?,?)', (
        username, generate_password_hash(password), datetime.now(timezone.utc).isoformat(), email, email_notify
    ))
    conn.commit()
    conn.close()
    session['user'] = username
    return jsonify({'ok': True, 'redirect': '/index.html'})


@app.route('/api/submit-score', methods=['POST'])
def api_submit_score():
    if 'user' not in session:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    data = request.get_json() or request.form
    quiz_id = data.get('quiz_id')
    try:
        score = int(data.get('score'))
    except Exception:
        return jsonify({'ok': False, 'message': 'Invalid score'}), 400
    if not quiz_id:
        return jsonify({'ok': False, 'message': 'Missing quiz id'}), 400
    username = session['user']
    conn = get_db()
    cur = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cur.execute('INSERT INTO attempts(username, quiz_id, score, created_at) VALUES (?,?,?,?)', (username, quiz_id, score, now))
    cur.execute('UPDATE users SET quizzes_completed = quizzes_completed + 1 WHERE username = ?', (username,))
    # create a notification for this user's new grade
    # use helper to insert, broadcast and optionally email
    conn.commit()
    conn.close()
    send_notification(username, 'grade', f'New result for {quiz_id}: {score}%')
    # broadcast a leaderboard update event
    broadcast_event({'type': 'leaderboard_update', 'payload': {'username': username, 'quiz_id': quiz_id, 'score': score}})
    return jsonify({'ok': True, 'message': 'Score recorded'})


@app.route('/api/leaderboard', methods=['GET'])
def api_leaderboard():
    conn = get_db()
    cur = conn.cursor()
    try:
        page = max(1, int(request.args.get('page', 1)))
    except Exception:
        page = 1
    try:
        per_page = max(1, int(request.args.get('per_page', 10)))
    except Exception:
        per_page = 10
    offset = (page - 1) * per_page
    cur.execute('SELECT COUNT(DISTINCT username) as cnt FROM attempts')
    total = cur.fetchone()['cnt'] or 0
    cur.execute('''
        SELECT username, COUNT(*) as attempts, AVG(score) as avg_score, MAX(score) as best_score, SUM(score) as total_score
        FROM attempts
        GROUP BY username
        ORDER BY total_score DESC
        LIMIT ? OFFSET ?
    ''', (per_page, offset))
    rows = cur.fetchall()
    conn.close()
    data = []
    for r in rows:
        data.append({'username': r['username'], 'attempts': r['attempts'], 'avg_score': round(r['avg_score'] or 0,1), 'best_score': r['best_score'], 'total_score': r['total_score']})
    return jsonify({'ok': True, 'leaders': data, 'total': total})


@app.route('/api/user-stats', methods=['GET'])
def api_user_stats():
    if 'user' not in session:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    username = session['user']
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT AVG(score) as avg_score, COUNT(*) as attempts FROM attempts WHERE username = ?', (username,))
    stat = cur.fetchone()
    cur.execute('SELECT quiz_id, score, created_at FROM attempts WHERE username = ? ORDER BY created_at DESC LIMIT 5', (username,))
    recent = cur.fetchall()
    conn.close()
    return jsonify({'ok': True, 'stats': {'avg_score': round(stat['avg_score'] or 0,1), 'attempts': stat['attempts']}, 'recent': [{'quiz_id': r['quiz_id'], 'score': r['score'], 'created_at': r['created_at']} for r in recent]})


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or request.form
    username = (data.get('username') or '').strip()
    password = data.get('password')
    if not username or not password:
        return jsonify({'ok': False, 'message': 'Missing credentials'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    conn.close()
    if row and check_password_hash(row['password_hash'], password):
        session['user'] = username
        return jsonify({'ok': True, 'redirect': '/index.html'})
    return jsonify({'ok': False, 'message': 'Invalid username or password'}), 401


@app.route('/api/catalog', methods=['GET'])
def api_catalog():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT quiz_id, title, created_at FROM quizzes ORDER BY created_at DESC')
    rows = cur.fetchall()
    conn.close()
    quizzes = [{'quiz_id': r['quiz_id'], 'title': r['title'], 'created_at': r['created_at']} for r in rows]
    return jsonify({'ok': True, 'total_quizzes': len(quizzes), 'quizzes': quizzes})


@app.route('/api/notifications', methods=['GET'])
def api_notifications():
    if 'user' not in session:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    username = session['user']
    conn = get_db()
    cur = conn.cursor()
    # fetch unread notifications for this user or global ones
    cur.execute('''
        SELECT id, username, type, message, created_at, read
        FROM notifications
        WHERE (username IS NULL) OR (username = ?)
        ORDER BY created_at DESC
        LIMIT 50
    ''', (username,))
    rows = cur.fetchall()
    conn.close()
    notifs = []
    unread = 0
    for r in rows:
        item = { 'id': r['id'], 'username': r['username'], 'type': r['type'], 'message': r['message'], 'created_at': r['created_at'], 'read': bool(r['read']) }
        if not item['read']:
            unread += 1
        notifs.append(item)
    return jsonify({'ok': True, 'unread': unread, 'notifications': notifs})


@app.route('/api/notifications/mark-read', methods=['POST'])
def api_notifications_mark_read():
    if 'user' not in session:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    data = request.get_json() or {}
    ids = data.get('ids') or []
    if not isinstance(ids, list):
        return jsonify({'ok': False, 'message': 'Invalid ids'}), 400
    username = session['user']
    conn = get_db()
    cur = conn.cursor()
    # mark notifications as read only if they belong to the user or are global
    cur.executemany('UPDATE notifications SET read = 1 WHERE id = ? AND (username IS NULL OR username = ?)', [(nid, username) for nid in ids])
    conn.commit()
    conn.close()
    return jsonify({'ok': True})


@app.route('/api/set-email', methods=['POST'])
def api_set_email():
    if 'user' not in session:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    data = request.get_json() or request.form
    email = (data.get('email') or '').strip() or None
    notify = int(bool(data.get('email_notify') or data.get('emailNotify') or data.get('notify')))
    conn = get_db()
    cur = conn.cursor()
    cur.execute('UPDATE users SET email = ?, email_notify = ? WHERE username = ?', (email, notify, session['user']))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})


@app.route('/stream')
def stream():
    def gen(q):
        try:
            while True:
                item = q.get()
                yield f"data: {json.dumps(item)}\n\n"
        finally:
            try:
                subscribers.remove(q)
            except Exception:
                pass
    q = queue.Queue()
    subscribers.append(q)
    return Response(stream_with_context(gen(q)), mimetype='text/event-stream')


@app.route('/api/quiz/<quiz_id>', methods=['GET'])
def api_quiz(quiz_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT quiz_id, title FROM quizzes WHERE quiz_id = ?', (quiz_id,))
    q = cur.fetchone()
    if not q:
        conn.close()
        return jsonify({'ok': False, 'message': 'Quiz not found'}), 404
    cur.execute('SELECT id, prompt, choices, correct_index FROM questions WHERE quiz_id = ? ORDER BY id ASC', (quiz_id,))
    rows = cur.fetchall()
    questions = []
    import json
    for r in rows:
        try:
            choices = json.loads(r['choices'])
        except Exception:
            choices = []
        questions.append({'id': r['id'], 'prompt': r['prompt'], 'choices': choices, 'correct_index': r['correct_index']})
    conn.close()
    return jsonify({'ok': True, 'quiz': {'quiz_id': q['quiz_id'], 'title': q['title']}, 'questions': questions})


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user', None)
    return jsonify({'ok': True})


def login_required():
    return 'user' in session


@app.route('/api/me', methods=['GET'])
def api_me():
    username = session.get('user')
    if not username:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT username, created_at, quizzes_completed FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    # also fetch total quizzes available
    cur.execute('SELECT COUNT(*) as cnt FROM quizzes')
    qrow = cur.fetchone()
    total_quizzes = qrow['cnt'] if qrow and 'cnt' in qrow.keys() else 0
    conn.close()
    if not row:
        return jsonify({'ok': False, 'message': 'User not found'}), 404
    return jsonify({'ok': True, 'user': {'username': row['username'], 'created_at': row['created_at'], 'quizzes_completed': row['quizzes_completed'], 'total_quizzes': total_quizzes}})


@app.route('/api/change-password', methods=['POST'])
def api_change_password():
    if 'user' not in session:
        return jsonify({'ok': False, 'message': 'Not logged in'}), 401
    data = request.get_json() or request.form
    old = data.get('old_password')
    new = data.get('new_password')
    if not old or not new:
        return jsonify({'ok': False, 'message': 'Missing fields'}), 400
    username = session['user']
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT password_hash FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    if not row or not check_password_hash(row['password_hash'], old):
        conn.close()
        return jsonify({'ok': False, 'message': 'Incorrect password'}), 403
    cur.execute('UPDATE users SET password_hash = ? WHERE username = ?', (generate_password_hash(new), username))
    conn.commit()
    # create a security notification via helper
    conn.commit()
    conn.close()
    send_notification(username, 'security', 'Your account password was changed')
    return jsonify({'ok': True, 'message': 'Password changed'})


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_proxy(path):
    p = Path(path)
    if p.exists():
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
