// server.js

// 1. 필요한 라이브러리들을 모두 불러옵니다.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db'); // 데이터베이스 연결 모듈
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Express 앱 생성 및 기본 설정
const app = express();
app.use(cors());
app.use(express.json()); // JSON 요청 본문을 파싱하기 위해 필요

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. Nodemailer 이메일 발송 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 4. 인증번호 임시 저장소
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

app.get('/api/transactions', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '인증 토큰이 없습니다.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC';
        const [transactions] = await db.query(sql, [userId]);

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
             return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
        }
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '인증 토큰이 없습니다.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { type, amount, description, category } = req.body;

        const sql = 'INSERT INTO transactions (user_id, type, amount, description, category) VALUES (?, ?, ?, ?, ?)';
        await db.query(sql, [userId, type, amount, description, category]);

        res.status(201).json({ message: '거래가 성공적으로 기록되었습니다.' });

    } catch (error) {
        console.error(error);
         if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
             return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
        }
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

// ## Gemini API 카테고리 추천 라우트 ##
app.post('/api/gemini/suggest-category', async (req, res) => {
    const { description } = req.body;

    if (!description) {
        return res.status(400).json({ message: '거래 내역을 입력해주세요.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const categories = ['식비', '교통', '공과금', '쇼핑', '여가', '의료/건강', '기타'];
        const prompt = `다음 지출 내역에 가장 적합한 카테고리를 아래 목록에서 하나만 골라주세요. 다른 설명 없이 카테고리 이름만 정확히 반환해야 합니다. 만약 목록에 적합한 카테고리가 없다면 '기타'로 지정해주세요.\n\n목록: [${categories.join(', ')}]
지출 내역: "${description}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let suggestedCategory = await response.text();

        if (!categories.includes(suggestedCategory)) {
            suggestedCategory = '기타';
        }

        res.status(200).json({ suggestedCategory });

    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        res.status(500).json({ message: 'AI 카테고리 추천 중 오류가 발생했습니다.' });
    }
});

// ## Gemini API 절약 팁 생성 라우트 ##
app.post('/api/gemini/generate-tips', async (req, res) => {
    const { transactions } = req.body;

    if (!transactions || transactions.length === 0) {
        return res.status(400).json({ message: '거래 내역 데이터가 없습니다.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const transactionSummary = transactions
            .map(t => `${t.transaction_date} - ${t.category}: ${t.description} (${t.type === 'expense' ? '-' : '+'}${t.amount}원)`) // Corrected: Removed unnecessary backticks around t.amount
            .join('\n');

        const prompt = `
            당신은 친절하고 명확한 재정 분석가입니다.
            다음은 사용자의 한 달간 거래 내역입니다.

            ${transactionSummary}

            이 내역을 바탕으로, 사용자가 돈을 절약할 수 있는 구체적이고 실용적인 팁 3가지를 각각 번호(1., 2., 3.)를 붙여서 목록 형태로 제안해주세요.
            가장 지출이 많은 카테고리를 언급하고, 그와 관련된 조언을 중심으로 이야기해주세요.
            각 팁은 2-3문장으로 요약하여 친구처럼 친근한 말투로 설명해주세요.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        // AI의 응답이 안전 문제로 차단되었는지 확인합니다.
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            console.error('AI 프롬프트가 안전 문제로 차단되었습니다:', response.promptFeedback);
            return res.status(500).json({ 
                message: `AI가 콘텐츠 생성을 거부했습니다. 이유: ${response.promptFeedback.blockReason}` 
            });
        }

        const text = await response.text();

        const tipsArray = text.split(/\n?[0-9]+\.\s/).filter(tip => tip.trim().length > 0);

        res.status(200).json({ tips: tipsArray });

    } catch (error) {
        console.error('Gemini API 절약 팁 생성 오류:', error);
        res.status(500).json({ message: 'AI 절약 팁 생성 중 오류가 발생했습니다.' });
    }
});

// ## Gemini API 테스트 라우트 ##
app.get('/api/gemini/test', (req, res) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
        res.status(200).json({ message: 'Gemini API 키가 성공적으로 로드되었습니다.' });
    } else {
        res.status(500).json({ message: 'Gemini API 키를 찾을 수 없습니다. .env 파일을 확인해주세요.' });
    }
});

// 5. 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
