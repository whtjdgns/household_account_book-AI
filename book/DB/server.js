// server.js

// 1. 필요한 라이브러리들을 모두 불러옵니다.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;

// 2. Express 앱 생성 및 기본 설정
const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// 3. 외부 서비스 초기화 (Gemini, Nodemailer)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 4. 임시 저장소
const verificationCodes = {};

// --- 5. Passport Strategy 설정 ---

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let [users] = await db.query('SELECT * FROM users WHERE username = ?', [email]);
        let user = users[0];

        if (!user) {
            const [newUser] = await db.query(
                'INSERT INTO users (username, name, provider) VALUES (?, ?, "google")',
                [email, name]
            );
            [users] = await db.query('SELECT * FROM users WHERE id = ?', [newUser.insertId]);
            user = users[0];
        }
        done(null, user);
    } catch (error) { done(error); }
  }
));

// Naver Strategy 네이버 로그인
passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: "/api/auth/naver/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile._json.email;
        let name = profile._json.name; // 👇 let으로 변경하여 재할당 가능하게 함

        // 👇 이메일이 없는 경우, 더 이상 진행할 수 없으므로 에러 처리
        if (!email) {
            return done(new Error("네이버 계정에서 이메일 정보를 가져올 수 없습니다."), null);
        }
        
        // 👇 이름(name)이 없는 경우, 이메일의 '@' 앞부분을 이름으로 사용
        if (!name) {
            name = email.split('@')[0];
        }

        let [users] = await db.query('SELECT * FROM users WHERE username = ?', [email]);
        let user = users[0];

        if (!user) {
            const [newUser] = await db.query(
                'INSERT INTO users (username, name, provider) VALUES (?, ?, "naver")', 
                [email, name]
            );
            [users] = await db.query('SELECT * FROM users WHERE id = ?', [newUser.insertId]);
            user = users[0];
        }
        done(null, user);
    } catch (error) { 
        done(error); 
    }
  }
));

// --- 6. API 라우트 (API Endpoints) ---

// ## 회원가입 API ##
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ message: '이름, 아이디, 비밀번호를 모두 입력해주세요.' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO users (name, username, password_hash, provider) VALUES (?, ?, ?, "local")';
        await db.query(sql, [name, username, hashedPassword]);
        res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
        }
        console.error("회원가입 오류:", error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 로그인 API ##
app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });

        const sql = 'SELECT id, username, name, password_hash, role, provider FROM users WHERE username = ?';
        const [users] = await db.query(sql, [username]);

        if (users.length === 0) return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        
        const user = users[0];

        if (user.provider !== 'local') {
            return res.status(403).json({ message: `${user.provider} 계정으로 로그인해주세요.` });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });

        const payload = { id: user.id, username: user.username, name: user.name, role: user.role, provider: user.provider };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: '로그인 성공!', token: token });
    } catch (error) {
        console.error("로그인 오류:", error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 거래 내역 가져오기 API ##
app.get('/api/transactions', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC';
        const [transactions] = await db.query(sql, [userId]);
        res.status(200).json(transactions);
    } catch (error) {
        console.error("거래 내역 조회 오류:", error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 거래 내역 추가 API ##
app.post('/api/transactions', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { type, amount, description, category } = req.body;

        const sql = 'INSERT INTO transactions (user_id, type, amount, description, category) VALUES (?, ?, ?, ?, ?)';
        await db.query(sql, [userId, type, amount, description, category]);
        res.status(201).json({ message: '거래가 성공적으로 기록되었습니다.' });
    } catch (error) {
        console.error("거래 내역 추가 오류:", error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 이메일 인증 API (회원가입용) ##
app.post('/api/email/send-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, to: email,
            subject: '[AI 가계부] 회원가입 인증번호 안내',
            html: `<p>회원가입을 위한 인증번호입니다: <strong>${code}</strong></p>`,
        });
        setTimeout(() => { delete verificationCodes[email]; }, 3 * 60 * 1000);
        res.status(200).json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('이메일 발송 실패(회원가입):', error);
        res.status(500).json({ message: '인증번호 발송에 실패했습니다.' });
    }
});

// ## 이메일 인증 확인 API ##
app.post('/api/email/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: '이메일과 인증번호를 입력해주세요.' });

    if (verificationCodes[email] && verificationCodes[email] === code) {
        delete verificationCodes[email];
        res.status(200).json({ message: '이메일 인증에 성공했습니다.' });
    } else {
        res.status(400).json({ message: '인증번호가 올바르지 않거나 만료되었습니다.' });
    }
});

// ## 이메일 인증 API (회원탈퇴용) ##
app.post('/api/email/send-delete-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, to: email,
            subject: '[AI 가계부] 회원 탈퇴 인증번호 안내',
            html: `<p>회원 탈퇴를 위한 인증번호입니다: <strong>${code}</strong></p>`,
        });
        setTimeout(() => { delete verificationCodes[email]; }, 3 * 60 * 1000);
        res.status(200).json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('이메일 발송 실패(회원탈퇴):', error);
        res.status(500).json({ message: '인증번호 발송에 실패했습니다.' });
    }
});

// ## 카테고리 관리 API ##
app.get('/api/categories', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const sql = 'SELECT * FROM categories WHERE is_default = TRUE OR user_id = ?';
        const [categories] = await db.query(sql, [userId]);
        res.status(200).json(categories);
    } catch (error) {
        console.error("카테고리 조회 오류:", error);
        res.status(500).json({ message: '카테고리 조회 중 오류 발생' });
    }
});
app.post('/api/categories', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { name } = req.body;
        const sql = 'INSERT INTO categories (user_id, name, is_default) VALUES (?, ?, FALSE)';
        await db.query(sql, [userId, name]);
        res.status(201).json({ message: '카테고리가 추가되었습니다.' });
    } catch (error) {
        console.error("카테고리 추가 오류:", error);
        res.status(500).json({ message: '카테고리 추가 중 오류 발생' });
    }
});
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const categoryId = req.params.id;
        const sql = 'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE';
        const [result] = await db.query(sql, [categoryId, userId]);
        if (result.affectedRows === 0) {
            return res.status(403).json({ message: '삭제 권한이 없거나 존재하지 않는 카테고리입니다.' });
        }
        res.status(200).json({ message: '카테고리가 삭제되었습니다.' });
    } catch (error) {
        console.error("카테고리 삭제 오류:", error);
        res.status(500).json({ message: '카테고리 삭제 중 오류 발생' });
    }
});

// ## 계정 관리 API ##
app.post('/api/users/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { currentPassword, newPassword } = req.body;
        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, userId]);
        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (error) {
        console.error("비밀번호 변경 오류:", error);
        res.status(500).json({ message: '비밀번호 변경 중 오류 발생' });
    }
});

// --- 회원 탈퇴 API (수정됨) ---
app.post('/api/users/delete-account', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { email, code } = req.body;

        if (!(verificationCodes[email] && verificationCodes[email] === code)) {
             return res.status(400).json({ message: '인증 정보가 유효하지 않습니다.' });
        }
        
        // 👇 1. 관련된 자식 데이터(거래 내역, 카테고리)를 먼저 삭제합니다.
        await db.query('DELETE FROM transactions WHERE user_id = ?', [userId]);
        await db.query('DELETE FROM categories WHERE user_id = ?', [userId]);
        
        // 👇 2. 모든 자식 데이터가 정리된 후, 부모 데이터(사용자)를 안전하게 삭제합니다.
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        delete verificationCodes[email];
        res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
    } catch (error) {
        console.error("회원 탈퇴 오류:", error);
        res.status(500).json({ message: '회원 탈퇴 처리 중 오류가 발생했습니다.' });
    }
});

// ## 소셜 로그인 라우트 ##
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role, provider: req.user.provider };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
});

app.get('/api/auth/naver', passport.authenticate('naver', { authType: 'reprompt' }));
app.get('/api/auth/naver/callback', passport.authenticate('naver', { session: false }), (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role, provider: req.user.provider };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
});

// ## Gemini 챗봇 API ##
app.post('/api/chatbot', async (req, res) => {
    // (이전 답변에서 제공한 챗봇 로직 전체를 여기에 붙여넣으시면 됩니다.)
    // ...
});


// --- 7. 서버 실행 (반드시 맨 마지막에 위치해야 함) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});