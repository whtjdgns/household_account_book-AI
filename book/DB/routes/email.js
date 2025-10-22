const express = require('express');
const nodemailer = require('nodemailer');
const { setCode, verifyCode } = require('../verification');

const router = express.Router();

// Nodemailer 이메일 발송 설정
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ## 이메일 인증번호 발송 API ##
router.post('/send-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(email, code); // verification 모듈 사용

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '[AI 가계부] 회원가입 인증번호 안내',
            html: `<p>회원가입을 위한 인증번호입니다: <strong>${code}</strong></p>`,
        });
        
        res.status(200).json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('이메일 발송 실패:', error);
        res.status(500).json({ message: '인증번호 발송에 실패했습니다.' });
    }
});

// ## 이메일 인증번호 확인 API ##
router.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ message: '이메일과 인증번호를 입력해주세요.' });
    }

    if (verifyCode(email, code)) { // verification 모듈 사용
        res.status(200).json({ message: '이메일 인증에 성공했습니다.' });
    } else {
        res.status(400).json({ message: '인증번호가 올바르지 않거나 만료되었습니다.' });
    }
});

// ## 이메일 인증 API (회원탈퇴용) ##
router.post('/send-delete-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(email, code); // verification 모듈 사용

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '[AI 가계부] 회원 탈퇴 인증번호 안내',
            html: `<p>회원 탈퇴를 위한 인증번호입니다: <strong>${code}</strong></p>`,
        });
        
        res.status(200).json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('이메일 발송 실패(회원탈퇴):', error);
        res.status(500).json({ message: '인증번호 발송에 실패했습니다.' });
    }
});

module.exports = router;