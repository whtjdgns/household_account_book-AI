const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 관리자 권한 확인 미들웨어
function isAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: '관리자 권한이 없습니다.' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        console.error("토큰 확인 오류:", error.message);
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
}

// 관리자 챗봇이 자연어 명령을 받아 AI로 분석 후 DB 작업을 수행하는 라우트
router.post('/command', isAdmin, async (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ message: '명령어를 입력해주세요.' });
    }

    try {
        console.log(`[Admin Command] Received: "${command}"`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
            당신은 관리자의 명령을 해석하여 JSON 형식으로 변환하는 시스템입니다.
            주어진 자연어 명령을 분석하여 다음 작업 중 하나로 분류하고, 필요한 정보를 추출해야 합니다. 복합적인 명령은 가장 마지막에 정의된 복합 액션으로 분류해야 합니다.

            1.  **사용자 생성 (createUser)**
                -   단순히 사용자만 생성하는 경우.
                -   필요 정보: 사용자 이름(name), 아이디(username), 비밀번호(password).
                -   명령 예시: "사용자 'hong' 비번 '1234' 생성", "임의 사용자 추가해줘"

            2.  **카테고리 생성 (createCategory)**
                -   필요 정보: 카테고리 이름(categoryName), 사용자 ID(userId, 선택사항).

            3.  **임의 거래내역 생성 (addDummyTransactions)**
                -   기존 사용자에게 거래내역만 추가하는 경우.
                -   필요 정보: 사용자 아이디(username),  생성할 개수(count).
                -   명령 예시: "사용자 'testuser'에게 가짜 거래내역 15개 만들어줘"

            4.  **사용자 생성 및 거래내역 추가 (createUserAndPopulate)**
                -   사용자 생성과 거래내역 추가를 동시에 요청하는 복합 명령.
                -   필요 정보: 생성할 거래내역 개수(count).
                -   명령 예시: "임의의 사용자를 만들고 거래내역 20개를 추가해줘", "테스트용 계정 하나 파고 가계부 기록 30개 채워줘", "임의의 계정을 만들고 수입 지출금액을 카테고리에 맞게 넣어줘"
                -   JSON 출력: { "action": "createUserAndPopulate", "payload": { "count": 20 } }

            5.  **사용자 생성 및 카테고리 추가 (createUserAndCategories)**
                -   사용자 생성과 여러 카테고리 추가를 동시에 요청하는 복합 명령.
                -   필요 정보: 생성할 카테고리 개수(count). (수익/지출 각각)
                -   명령 예시: "임의의 계정과 수익지출 카테고리 10개씩 넣어봐", "테스트 계정 만들고 카테고리 5개씩 추가해줘"
                -   JSON 출력: { "action": "createUserAndCategories", "payload": { "count": 10 } }

            7.  **사용자 삭제 (deleteUser)**
                -   기존 사용자를 삭제하는 경우.
                -   필요 정보: 사용자 아이디(username).
                -   명령 예시: "사용자 'testuser'를 삭제해줘"

            6.  **지원하지 않는 명령 (unsupported)**
                -   위 작업에 해당하지 않거나 정보가 불충분한 경우 사용합니다.

            다른 말은 절대 하지 말고, 반드시 유효한 JSON 객체만 반환해야 합니다.
        `;

        const prompt = `${systemPrompt}

${command}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        if (!text) {
            throw new Error("AI로부터 유효한 응답을 받지 못했습니다.");
        }



        console.log(`[Admin Command] AI JSON Output: ${text}`);

        let parsedAction;
        try {
            const jsonMatch = text.match(/\{.*\}/s);
            if (!jsonMatch) throw new Error("AI 응답에서 유효한 JSON을 찾을 수 없습니다.");
            parsedAction = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("AI 응답 JSON 파싱 오류:", e);
            return res.status(500).json({ message: "AI가 반환한 응답을 처리하는 데 실패했습니다." });
        }

        const { action, payload } = parsedAction;

        switch (action) {
            case 'createUser': {
                const { name, username, password } = payload;
                if (!name || !username || !password) return res.status(400).json({ message: 'AI가 사용자 생성을 위한 정보를 모두 추출하지 못했습니다.' });
                
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const userSql = 'INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)';
                await db.query(userSql, [name, username, hashedPassword]);
                res.status(201).json({ message: `사용자 '${username}' 생성이 완료되었습니다.` });
                break;
            }

            case 'createCategory': {
                const { categoryName, userId, isDefault } = payload;
                if (!categoryName) return res.status(400).json({ message: 'AI가 카테고리 생성을 위한 정보를 추출하지 못했습니다.' });

                if (isDefault) {
                    const defaultSql = 'INSERT INTO categories (name, is_default) VALUES (?, TRUE)';
                    await db.query(defaultSql, [categoryName]);
                    res.status(201).json({ message: `기본 카테고리 '${categoryName}' 생성이 완료되었습니다.` });
                } else {
                    const userCatSql = 'INSERT INTO categories (user_id, name, is_default) VALUES (?, ?, FALSE)';
                    await db.query(userCatSql, [userId, categoryName]);
                    res.status(201).json({ message: `사용자(ID:${userId})에게 '${categoryName}' 카테고리 생성이 완료되었습니다.` });
                }
                break;
            }

            case 'addDummyTransactions': {
                const { username, count } = payload;
                if (!username || !count) return res.status(400).json({ message: 'AI가 거래내역 생성을 위한 대상과 개수를 추출하지 못했습니다.' });

                const [users] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
                if (users.length === 0) return res.status(404).json({ message: `사용자 '${username}'을(를) 찾을 수 없습니다.` });
                const userId = users[0].id;

                const [defaultCategories] = await db.query('SELECT name FROM categories WHERE is_default = TRUE');
                if (defaultCategories.length === 0) return res.status(500).json({ message: '거래내역을 생성하기 위한 기본 카테고리가 없습니다.' });
                const categoryNames = defaultCategories.map(c => c.name);

                const dummyDescriptions = {
                    '식비': ['점심 식사', '마트 장보기', '카페', '저녁 배달음식'],
                    '교통비': ['버스 요금', '지하철 요금', '택시비', '주유'],
                    '쇼핑': ['온라인 쇼핑', '옷 구매', '생활용품 구매'],
                    '문화생활': ['영화 관람', '친구와 약속', '운동'],
                    '월급': ['회사 급여', '보너스', '부수입']
                };

                let transactions = [];
                for (let i = 0; i < count; i++) {
                    const category = categoryNames[i % categoryNames.length]; // 모든 카테고리에 순차적으로 할당
                    const descriptions = dummyDescriptions[category] || ['기타 지출'];
                    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
                    const type = (category === '월급') ? 'income' : 'expense';
                    const amount = (type === 'income')
                        ? Math.floor(Math.random() * 1500000) + 2500000
                        : Math.floor(Math.random() * 100000) + 1000;
                    const date = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
                    transactions.push([userId, type, amount, description, category, date]);
                }

                const sql = 'INSERT INTO transactions (user_id, type, amount, description, category, transaction_date) VALUES ?';
                await db.query(sql, [transactions]);

                res.status(201).json({ message: `사용자 '${username}'에게 ${count}개의 임의 거래내역을 추가했습니다.` });
                break;
            }

            case 'createUserAndPopulate': {
                const count = (payload && payload.count) ? payload.count : 10; // 기본값 10으로 설정

                // 1. 임의 사용자 생성
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const username = `testuser${randomSuffix}`;
                const name = `테스트유저${randomSuffix}`;
                const password = `pw_${Math.random().toString(36).slice(-8)}`;
                
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const userSql = 'INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)';
                const newUserResult = await db.query(userSql, [name, username, hashedPassword]);
                const userId = newUserResult[0].insertId;
                console.log(`[Admin Command] Created user '${username}' (ID: ${userId})`);

                const [defaultCategories] = await db.query('SELECT name FROM categories WHERE is_default = TRUE');
                if (defaultCategories.length === 0) return res.status(500).json({ message: '거래내역을 생성하기 위한 기본 카테고리가 없습니다.' });
                const categoryNames = defaultCategories.map(c => c.name);

                const dummyDescriptions = {
                    '식비': ['점심 식사', '마트 장보기', '카페', '저녁 배달음식'],
                    '교통비': ['버스 요금', '지하철 요금', '택시비', '주유'],
                    '쇼핑': ['온라인 쇼핑', '옷 구매', '생활용품 구매'],
                    '문화생활': ['영화 관람', '친구와 약속', '운동'],
                    '월급': ['회사 급여', '보너스', '부수입']
                };

                let transactions = [];
                for (let i = 0; i < count; i++) {
                    const category = categoryNames[i % categoryNames.length]; // 모든 카테고리에 순차적으로 할당
                    const descriptions = dummyDescriptions[category] || ['기타 지출'];
                    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
                    const type = (category === '월급')
                        ? 'income'
                        : 'expense';
                    const amount = (type === 'income')
                        ? Math.floor(Math.random() * 1500000) + 2500000
                        : Math.floor(Math.random() * 100000) + 1000;
                    const date = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
                    transactions.push([userId, type, amount, description, category, date]);
                }

                const transSql = 'INSERT INTO transactions (user_id, type, amount, description, category, transaction_date) VALUES ?';
                await db.query(transSql, [transactions]);

                res.status(201).json({ message: `임의 사용자 '${username}'을(를) 생성하고, ${count}개의 거래내역을 추가했습니다.` });
                break;
            }

            case 'createUserAndCategories': {
                if (!payload || !payload.count) {
                    return res.status(400).json({ message: 'AI가 생성할 카테고리 개수를 추출하지 못했습니다.' });
                }
                const { count } = payload;

                // 1. Create a random user
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const username = `cat_user${randomSuffix}`;
                const name = `카테고리유저${randomSuffix}`;
                const password = `pw_${Math.random().toString(36).slice(-8)}`;

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const userSql = 'INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)';
                const newUserResult = await db.query(userSql, [name, username, hashedPassword]);
                const userId = newUserResult[0].insertId;
                console.log(`[Admin Command] Created user '${username}' (ID: ${userId})`);

                // 2. Define and insert categories
                const incomeCategories = Array.from({ length: count }, (_, i) => `임의수입${i + 1}`);
                const expenseCategories = Array.from({ length: count }, (_, i) => `임의지출${i + 1}`);
                const allCategories = [...incomeCategories, ...expenseCategories];

                if (allCategories.length > 0) {
                    const categorySql = 'INSERT INTO categories (user_id, name, is_default) VALUES ?';
                    const categoryValues = allCategories.map(catName => [userId, catName, false]);
                    await db.query(categorySql, [categoryValues]);
                }

                res.status(201).json({ message: `임의 사용자 '${username}'을(를) 생성하고, ${count * 2}개의 카테고리를 추가했습니다.` });
                break;
            }

            case 'deleteUser': {
                const { username } = payload;
                if (!username) return res.status(400).json({ message: 'AI가 삭제할 사용자 정보를 추출하지 못했습니다.' });

                const [users] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
                if (users.length === 0) return res.status(404).json({ message: `사용자 '${username}'을(를) 찾을 수 없습니다.` });

                const deleteSql = 'DELETE FROM users WHERE username = ?';
                await db.query(deleteSql, [username]);

                res.status(200).json({ message: `사용자 '${username}'을(를) 성공적으로 삭제했습니다.` });
                break;
            }

            case 'unsupported':
                res.status(400).json({ message: `지원하지 않는 명령입니다. 이유: ${payload.reason}` });
                break;

            default:
                res.status(400).json({ message: '알 수 없는 작업입니다.' });
        }

    } catch (error) {
        console.error(`[Admin Command] Error:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이미 존재하는 아이디 또는 카테고리입니다.' });
        }
        res.status(500).json({ message: '명령 처리 중 서버 오류가 발생했습니다.' });
    }
});

module.exports = router;