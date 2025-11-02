const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        return true;
    }
}

router.post('/chatbot', async (req, res) => {
    const { message, currentPage, chatHistory } = req.body;
    const authHeader = req.headers.authorization;

    let userRole = null;
    let userId = null;

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

        if (userRole === 'admin') {
            return res.json({ text: "관리자 모드는 현재 개발 중입니다." });
        }

        const requiresData = userId ? await isDataRequired(message) : false;

        let transactionSummary = '';
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

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const historyFromClient = (chatHistory || []).slice(0, -1);
        const history = [];

        if (historyFromClient.length > 0) {
            const firstUserIndex = historyFromClient.findIndex(msg => msg.sender === 'user');
            if (firstUserIndex !== -1) {
                let lastRole = null;
                for (let i = firstUserIndex; i < historyFromClient.length; i++) {
                    const msg = historyFromClient[i];
                    const role = msg.sender === 'user' ? 'user' : 'model';
                    if (role !== lastRole) {
                        history.push({ role: role, parts: [{ text: msg.text }] });
                        lastRole = role;
                    }
                }
            }
        }

        // 프롬프트 파일을 읽어옵니다.
        const promptTemplate = fs.readFileSync(path.join(__dirname, 'chatbot_prompt.txt'), 'utf8');

        const availableCategories = ['식비', '교통', '공과금', '쇼핑', '여가', '의료/건강', '기타'];
        
        let dataAnalysisPrompt;
        if (requiresData) {
            const transactionDetails = transactionSummary.length > 0 ? transactionSummary : '아직 기록된 거래 내역이 없습니다.';
            dataAnalysisPrompt = `
            *   아래에 사용자의 전체 거래 내역 데이터가 제공됩니다. 이 데이터를 기반으로만 답변해야 합니다. 페이지에 보이는 내용과 무관하게, 여기에 제공된 전체 데이터를 사용해 답변하세요.
                ---
                **사용자 거래 내역:**
                ${transactionDetails}
                ---
            `;
        } else {
            dataAnalysisPrompt = `
            *   사용자가 자신의 거래 내역에 대해 질문하면, "로그인이 필요한 기능입니다. 로그인하시면 고객님의 소중한 데이터를 바탕으로 답변해 드릴게요!"라고 안내하세요.
            `;
        }

        // 템플릿의 플레이스홀더를 실제 값으로 교체합니다.
        const systemPrompt = promptTemplate
            .replace('{availableCategories}', availableCategories.join(', '))
            .replace('{dataAnalysisPrompt}', dataAnalysisPrompt)
            .replace('{currentPage}', currentPage);

        const chat = model.startChat({
            history: history,
            generationConfig: { maxOutputTokens: 1000 },
        });

        const result = await chat.sendMessage(systemPrompt + "\n" + message);
        const response = result.response;
        const text = response.text();

        res.json({ text });

    } catch (error) {
        console.error('Chatbot API Error:', error);
        res.status(500).json({ text: '챗봇 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
});

router.post('/gemini/suggest-category', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '인증 토큰이 없습니다.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ message: '거래 내역을 입력해주세요.' });
        }

        const categorySql = 'SELECT name FROM categories WHERE is_default = TRUE OR user_id = ?';
        const [categoryRows] = await db.query(categorySql, [userId]);
        const userCategories = categoryRows.map(row => row.name);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `다음 지출 내역에 가장 적합한 카테고리를 아래 목록에서 하나만 골라줘. 다른 설명 없이 카테고리 이름만 정확히 반환해야 해. 만약 목록에 적합한 카테고리가 없다면 '기타'로 지정해줘.\n\n사용자 카테고리 목록: [${userCategories.join(', ')}]\n지출 내역: "${description}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let suggestedCategory = response.text().trim();

        if (!userCategories.includes(suggestedCategory)) {
            suggestedCategory = '기타';
        }

        res.status(200).json({ suggestedCategory });

    } catch (error) {
        console.error('AI 카테고리 추천 오류:', error);
        res.status(500).json({ message: 'AI 카테고리 추천 중 오류가 발생했습니다.' });
    }
});

router.post('/gemini/generate-tips', async (req, res) => {
    const { transactions } = req.body;

    if (!transactions || transactions.length === 0) {
        return res.status(400).json({ message: '거래 내역 데이터가 없습니다.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
        const transactionSummary = transactions
            .map(t => `${t.transaction_date} - ${t.category}: ${t.description} (${t.type === 'expense' ? '-' : '+'}${t.amount}원)`)
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
        const response = result.response;

        if (response.promptFeedback && response.promptFeedback.blockReason) {
            console.error('AI 프롬프트가 안전 문제로 차단되었습니다:', response.promptFeedback);
            return res.status(500).json({
                message: `AI가 콘텐츠 생성을 거부했습니다. 이유: ${response.promptFeedback.blockReason}` 
            });
        }

        const text = response.text();
        const tipsArray = text.split(/\n?[0-9]+\.\s/).filter(tip => tip.trim().length > 0);
        res.status(200).json({ tips: tipsArray });

    } catch (error) {
        console.error('Gemini API 절약 팁 생성 오류:', error);
        res.status(500).json({ message: 'AI 절약 팁 생성 중 오류가 발생했습니다.' });
    }
});

router.get('/gemini/test', (req, res) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
        res.status(200).json({ message: 'Gemini API 키가 성공적으로 로드되었습니다.' });
    } else {
        res.status(500).json({ message: 'Gemini API 키를 찾을 수 없습니다. .env 파일을 확인해주세요.' });
    }
});

module.exports = router;