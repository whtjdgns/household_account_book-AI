// server.js

// 1. 필요한 라이브러리들을 모두 불러옵니다.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db'); // 데이터베이스 연결 모듈

// 2. Express 앱 생성 및 기본 설정
const app = express();
app.use(cors());
app.use(express.json()); // JSON 요청 본문을 파싱하기 위해 필요

// 3. Nodemailer 이메일 발송 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 4. 인증번호 임시 저장소
// (실제 서비스에서는 Redis나 DB에 저장하는 것이 더 안정적입니다.)
const verificationCodes = {};

// --- API 라우트 (API Endpoints) ---

// ## 회원가입 API ##
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({ message: '이름, 아이디, 비밀번호를 모두 입력해주세요.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)';
        await db.query(sql, [name, username, hashedPassword]);

        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
        }
        console.error(error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 로그인 API ##
app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });
        }

        const sql = 'SELECT id, username, name, password_hash FROM users WHERE username = ?';
        const [users] = await db.query(sql, [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const payload = { id: user.id, username: user.username, name: user.name };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: '로그인 성공!', token: token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 이메일 인증번호 발송 API ##
app.post('/api/email/send-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '[AI 가계부] 회원가입 인증번호 안내',
            html: `<p>회원가입을 위한 인증번호입니다: <strong>${code}</strong></p>`,
        });
        
        // 3분 후 인증번호 자동 삭제
        setTimeout(() => { delete verificationCodes[email]; }, 3 * 60 * 1000);

        res.status(200).json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('이메일 발송 실패:', error);
        res.status(500).json({ message: '인증번호 발송에 실패했습니다.' });
    }
});

// ## 이메일 인증번호 확인 API ##
app.post('/api/email/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ message: '이메일과 인증번호를 입력해주세요.' });
    }

    if (verificationCodes[email] && verificationCodes[email] === code) {
        delete verificationCodes[email];
        res.status(200).json({ message: '이메일 인증에 성공했습니다.' });
    } else {
        res.status(400).json({ message: '인증번호가 올바르지 않거나 만료되었습니다.' });
    }
});

// 5. 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});