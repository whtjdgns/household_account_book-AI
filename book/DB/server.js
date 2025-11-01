// server.js

// 1. 필요한 라이브러리들을 모두 불러옵니다.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./db'); // 데이터베이스 연결 모듈
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const jwt = require('jsonwebtoken');

// 2. 라우터 모듈들을 불러옵니다.
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const geminiRoutes = require('./routes/gemini');
const emailRoutes = require('./routes/email');
const adminChatbotRoutes = require('./routes/admin_chatbot');

// 3. Express 앱 생성 및 기본 설정
const app = express();
app.use(cors());
app.use(express.json()); // JSON 요청 본문을 파싱하기 위해 필요

// 4. Passport 초기화 및 전략 설정
app.use(passport.initialize());

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
                'INSERT INTO users (username, name) VALUES (?, ?)',
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

// Naver Strategy
passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: "/api/auth/naver/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile._json.email;
        const name = profile._json.name;

        let [users] = await db.query('SELECT * FROM users WHERE username = ?', [email]);
        let user = users[0];

        if (!user) {
            const [newUser] = await db.query('INSERT INTO users (username, name) VALUES (?, ?)', [email, name]);
            [users] = await db.query('SELECT * FROM users WHERE id = ?', [newUser.insertId]);
            user = users[0];
        }
        
        done(null, user);
    } catch (error) {
        done(error);
    }
  }
));

// 5. API 라우트 마운트
app.use('/api', authRoutes);
app.use('/api', geminiRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin/chatbot', adminChatbotRoutes);

// 6. 관리자 확인 미들웨어 (현재 사용되지 않음)
const isAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '인증 토큰이 없습니다.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: '접근 권한이 없습니다. (관리자 전용)' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

// 7. 서버 실행
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});