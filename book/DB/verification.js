// verification.js

// 인증번호를 임시로 저장하는 객체
const verificationCodes = {};

/**
 * 이메일과 인증번호를 저장하고, 3분 후에 자동으로 삭제합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} code - 인증번호
 */
const setCode = (email, code) => {
    verificationCodes[email] = code;
    // 3분 후 인증번호 자동 삭제
    setTimeout(() => {
        if (verificationCodes[email] === code) {
            delete verificationCodes[email];
        }
    }, 3 * 60 * 1000);
};

/**
 * 주어진 이메일과 코드가 유효한지 확인하고, 유효하면 삭제합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} code - 인증번호
 * @returns {boolean} - 인증 성공 여부
 */
const verifyCode = (email, code) => {
    if (verificationCodes[email] && verificationCodes[email] === code) {
        delete verificationCodes[email];
        return true;
    }
    return false;
};

/**
 * 회원 탈퇴와 같이, 인증 후에도 코드를 즉시 삭제하지 않고 유효성만 검사해야 하는 경우 사용합니다.
 * @param {string} email - 사용자 이메일
 * @param {string} code - 인증번호
 * @returns {boolean} - 코드 일치 여부
 */
const checkCode = (email, code) => {
    return verificationCodes[email] && verificationCodes[email] === code;
};

/**
 * 사용된 코드를 명시적으로 삭제합니다.
 * @param {string} email - 사용자 이메일
 */
const deleteCode = (email) => {
    delete verificationCodes[email];
};


module.exports = {
    setCode,
    verifyCode,
    checkCode,
    deleteCode,
    verificationCodes, // 회원 탈퇴 로직에서 직접 접근해야 할 수도 있으므로 임시 export
};