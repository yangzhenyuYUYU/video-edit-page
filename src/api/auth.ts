import http from '@/utils/http';

export const sendVerifyCode = (phone: string, areaCode: string) => {
    return http.get(`/auth/send-code?phone=${phone}&area_code=${areaCode}`);
};

export const verifyPhoneCode = (phone: string, code: string) => {
    return http.post('/auth/verify-code', { phone, code });
}

export const login = (phone: string, inviteCode: string) => {
    return http.post(`/auth/login`, { phone, invite_code: inviteCode });
};

export default {
    sendVerifyCode,
    verifyPhoneCode,
    login
};