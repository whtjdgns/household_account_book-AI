const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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
router.get('/average/:category', async (req, res) => {
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

module.exports = router;
