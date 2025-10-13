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
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const NaverStrategy = require('passport-naver').Strategy;

// 2. Express 앱 생성 및 기본 설정
const app = express();
app.use(cors());
app.use(express.json()); // JSON 요청 본문을 파싱하기 위해 필요

// Passport 초기화
app.use(passport.initialize());

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

// 관리자 확인 미들웨어
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

        const sql = 'SELECT id, username, name, password_hash, role FROM users WHERE username = ?';
        const [users] = await db.query(sql, [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        const payload = { id: user.id, username: user.username, name: user.name, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: '로그인 성공!', token: token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
});

// ## 챗봇 API (Vertex AI) - 성능 개선 버전 ##

// 경량화된 AI 호출로 사용자 질문에 데이터가 필요한지 판단하는 함수
async function isDataRequired(message) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `사용자의 다음 질문에 답변하기 위해 거래 내역 데이터가 필요한가요? '예' 또는 '아니오'로만 답해주세요: "${message}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        console.log(`[Chatbot Intent Check] Query: "${message}" -> Needs Data: ${text}`);
        return text.includes('예');
    } catch (error) {
        console.error("AI intent check error:", error);
        // 오류 발생 시, 안전하게 데이터가 필요하다고 가정
        return true;
    }
}

app.post('/api/chatbot', async (req, res) => {
    const { message, currentPage, chatHistory } = req.body;
    const authHeader = req.headers.authorization;

    let userRole = null;
    let userId = null;

    // 1. 토큰에서 사용자 정보 확인
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userRole = decoded.role;
            userId = decoded.id;
        } catch (error) {
            console.error("Token verification error:", error.message);
            return res.status(401).json({ text: "인증 토큰이 유효하지 않습니다." });
        }
    }

    try {
        console.log(`[Chatbot] Role: '${userRole || 'Guest'}' | Message: '${message}'`);

        // 2. 관리자 명령어 처리
        if (userRole === 'admin') {
            return res.json({ text: "관리자 모드는 현재 개발 중입니다." });
        }

        // 3. 사용자의 질문 의도 파악 (데이터 필요 여부 확인)
        const requiresData = userId ? await isDataRequired(message) : false;

        let transactionSummary = '';
        // 4. 데이터가 필요하다고 판단될 경우에만 거래 내역 조회
        if (requiresData) {
            console.log("[Chatbot] Data required. Fetching transactions...");
            const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC';
            const [transactions] = await db.query(sql, [userId]);
            
            if (transactions.length > 0) {
                transactionSummary = transactions.map(t => {
                    const date = new Date(t.transaction_date).toISOString().split('T')[0];
                    return `${date} | ${t.category} | ${t.description} | ${t.type === 'expense' ? '-' : '+'}${t.amount}원`;
                }).join('\n');
            }
        }

        // 5. Gemini AI 호출
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const historyFromClient = (chatHistory || []).slice(0, -1);
        const history = [];

        if (historyFromClient.length > 0) {
            // Gemini API는 기록이 user 역할로 시작하고 역할이 번갈아 나타나야 합니다.
            // 클라이언트에서 받은 기록을 API 요구사항에 맞게 정리합니다.

            // 1. 첫 번째 사용자 메시지를 찾습니다.
            const firstUserIndex = historyFromClient.findIndex(msg => msg.sender === 'user');

            if (firstUserIndex !== -1) {
                // 2. 첫 사용자 메시지부터 시작하여 역할이 번갈아 나오도록 기록을 구성합니다.
                let lastRole = null;
                for (let i = firstUserIndex; i < historyFromClient.length; i++) {
                    const msg = historyFromClient[i];
                    const role = msg.sender === 'user' ? 'user' : 'model';
                    
                    // 이전 메시지와 역할이 다른 경우에만 추가
                    if (role !== lastRole) {
                        history.push({
                            role: role,
                            parts: [{ text: msg.text }]
                        });
                        lastRole = role;
                    }
                }
            }
        }

        const availableCategories = ['식비', '교통', '공과금', '쇼핑', '여가', '의료/건강', '기타'];
        const systemPrompt = `
            당신은 'AI 핀로그' 웹사이트 전용 AI 어시스턴트, 'AI 핀로그 챗봇'입니다. 당신의 역할은 애플리케이션 기능 안내와 사용자 데이터 분석, 두 가지입니다. 절대로 사과하거나 변명하지 마세요. 모르는 질문에는 "죄송합니다, 해당 질문은 가계부 기능과 관련이 없어 답변하기 어렵습니다."라고만 답변하세요.

            **1. 애플리케이션 기능 안내:**
            *   **대시보드 (dashboard):** 월별 요약 및 최근 거래 내역 확인.
            *   **리포트 (report):** 카테고리별 지출 차트 및 AI 절약 팁 확인.
            *   **거래 기록:** '거래 추가' 버튼으로 기록. 카테고리: [${availableCategories.join(', ')}]

            **2. 사용자 데이터 분석:**
            *   ${requiresData ? 
            `아래에 사용자의 전체 거래 내역 데이터가 제공됩니다. 이 데이터를 기반으로만 답변해야 합니다. 페이지에 보이는 내용과 무관하게, 여기에 제공된 전체 데이터를 사용해 답변하세요.
                ---
                **사용자 거래 내역:**
                ${transactionSummary.length > 0 ? transactionSummary : '아직 기록된 거래 내역이 없습니다.'}
                ---` : 
                '사용자가 자신의 거래 내역에 대해 질문하면, "로그인이 필요한 기능입니다. 로그인하시면 고객님의 소중한 데이터를 바탕으로 답변해 드릴게요!"라고 안내하세요.'
            }
            *   사용자가 "내 지출", "거래 내역 찾아줘" 등 자신의 데이터에 대해 질문하면, 위 데이터를 분석하여 사실에 기반한 답변을 생성하세요.
            *   계산이 필요하면 직접 계산해서 정확한 수치를 제공하세요.

            **응답 규칙:**
            *   사용자의 현재 페이지는 '${currentPage}'입니다.
            *   항상 한국어로, 친구처럼 친근하지만 전문적인 톤을 유지하세요.
        `;

        const systemInstruction = { parts: [{ text: systemPrompt }] };

        const chat = model.startChat({
            history: history,
            generationConfig: { maxOutputTokens: 1000 },
            systemInstruction: systemInstruction,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ text });

    } catch (error) {
        console.error('Chatbot API Error:', error);
        res.status(500).json({ text: '챗봇 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
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

// ## 카테고리별 평균 지출 계산 API ##
app.get('/api/transactions/average/:category', async (req, res) => {
    console.log('--- 평균 지출 계산 API 호출됨 ---');
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('오류: 인증 토큰이 없거나 형식이 잘못되었습니다.');
            return res.status(401).json({ message: '인증 토큰이 없거나 형식이 잘못되었습니다.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { category } = req.params;

        const sql = `
            SELECT AVG(amount) as average 
            FROM transactions 
            WHERE category = ? AND type = 'expense' AND user_id != ?
        `;
        const [results] = await db.query(sql, [category, userId]);

        const average = results[0].average || 0;

        res.status(200).json({ average });

    } catch (error) {
        console.error('평균 계산 API 오류:', error);
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
        console.log('Prompt:', prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let suggestedCategory = await response.text();

        if (!categories.includes(suggestedCategory.trim())) {
            suggestedCategory = '기타';
        }

        res.status(200).json({ suggestedCategory: suggestedCategory.trim() });

    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        res.status(500).json({ message: 'AI 카테고리 추천 중 오류가 발생했습니다.' });
    }
});

// ## Gemini API 절약 팁 생성 라우트 ##
app.post('/api/gemini/generate-tips', async (req, res) => {
    const { transactions } = req.body;

    console.log('--- generate-tips route called ---');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Not Loaded');

    if (!transactions || transactions.length === 0) {
        return res.status(400).json({ message: '거래 내역 데이터가 없습니다.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      

        const transactionSummary = transactions
            .map(t => `${t.transaction_date} - ${t.category}: ${t.description} (${t.type === 'expense' ? '-' : '+'}${t.amount}원)`) // Corrected newline escape
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



// ## 구글 소셜 로그인 ##
app.use(passport.initialize());

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

app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);

// ## 네이버 소셜 로그인 ##
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

app.get('/api/auth/naver',
  passport.authenticate('naver', { authType: 'reprompt' })
);

app.get('/api/auth/naver/callback', 
  passport.authenticate('naver', { session: false }),
  (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);



// 5. 서버 실행
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`백엔드 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});