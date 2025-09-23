// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 👈 이 부분이 빠져있었습니다.
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// --- 회원가입 API ---
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. 입력 값 확인
        if (!username || !password) {
            return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });
        }

        // 2. 비밀번호 암호화
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. 데이터베이스에 새로운 사용자 저장 (INSERT)
        const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        await db.query(sql, [username, hashedPassword]);

        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });

    } catch (error) {
        // 4. 아이디 중복 에러 처리
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
        }
        console.error(error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// --- 로그인 API ---
app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. 입력 값 확인
        if (!username || !password) {
            return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });
        }

        // 2. 데이터베이스에서 사용자 찾기 (SELECT)
        const sql = 'SELECT * FROM users WHERE username = ?';
        const [users] = await db.query(sql, [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const user = users[0];

        // 3. 비밀번호 비교
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        // 4. 로그인 성공: JWT 생성
        const payload = { id: user.id, username: user.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: '로그인 성공!',
            token: token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// 포트
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});