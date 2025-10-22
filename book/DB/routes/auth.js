const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const db = require('../db');
const { checkCode, deleteCode } = require('../verification');

const router = express.Router();

// ## 회원가입 API ##
router.post('/users/register', async (req, res) => {
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
router.post('/users/login', async (req, res) => {
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

// ## 구글 소셜 로그인 ##
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);

// ## 네이버 소셜 로그인 ##
router.get('/auth/naver',
  passport.authenticate('naver', { authType: 'reprompt' })
);

router.get('/auth/naver/callback',
  passport.authenticate('naver', { session: false }),
  (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, name: req.user.name, role: req.user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);

// 비밀번호 변경 API
router.post('/users/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { currentPassword, newPassword } = req.body;

        const sqlSelect = 'SELECT password_hash FROM users WHERE id = ?';
        const [users] = await db.query(sqlSelect, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        const user = users[0];

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        const sqlUpdate = 'UPDATE users SET password_hash = ? WHERE id = ?';
        await db.query(sqlUpdate, [hashedNewPassword, userId]);

        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error("비밀번호 변경 오류:", error);
        res.status(500).json({ message: '비밀번호 변경 중 서버 오류가 발생했습니다.' });
    }
});

// ## 계정 관리 API (회원 탈퇴) ##
router.post('/users/delete-account', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const { email, code } = req.body;

        if (!checkCode(email, code)) {
             return res.status(400).json({ message: '인증 정보가 유효하지 않습니다.' });
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        deleteCode(email);
        res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });

    } catch (error) {
        console.error("회원 탈퇴 오류:", error);
        res.status(500).json({ message: '회원 탈퇴 처리 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
