const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// 카테고리 가져오기
router.get('/', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // 기본 카테고리와 해당 사용자가 추가한 카테고리를 모두 조회
        const sql = 'SELECT * FROM categories WHERE is_default = TRUE OR user_id = ?';
        const [categories] = await db.query(sql, [userId]);
        res.status(200).json(categories);
    } catch (error) {
        console.error("카테고리 조회 오류:", error);
        res.status(500).json({ message: '카테고리 조회 중 오류가 발생했습니다.' });
    }
});

// 새 카테고리 추가
router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: '카테고리 이름을 입력해주세요.' });
        }

        const sql = 'INSERT INTO categories (user_id, name, is_default) VALUES (?, ?, FALSE)';
        await db.query(sql, [userId, name]);
        res.status(201).json({ message: '카테고리가 추가되었습니다.' });
    } catch (error) {
        console.error("카테고리 추가 오류:", error);
        res.status(500).json({ message: '카테고리 추가 중 오류가 발생했습니다.' });
    }
});

// 카테고리 삭제
router.delete('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const categoryId = req.params.id;

        // 본인이 생성한 카테고리만 삭제 가능하도록 user_id와 is_default = FALSE 조건을 추가
        const sql = 'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE';
        const [result] = await db.query(sql, [categoryId, userId]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: '삭제 권한이 없거나 존재하지 않는 카테고리입니다.' });
        }
        res.status(200).json({ message: '카테고리가 삭제되었습니다.' });
    } catch (error) {
        console.error("카테고리 삭제 오류:", error);
        res.status(500).json({ message: '카테고리 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;