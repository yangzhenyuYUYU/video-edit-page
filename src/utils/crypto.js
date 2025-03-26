import CryptoJS from 'crypto-js';

const screptKey = 'ckj-32243f8e-5404-42bd-b52e-16be';

// 引入 seedrandom 库
import seedrandom from 'seedrandom';

// 初始化一个基于种子的随机数生成器 
const rng = seedrandom('随机种子');

// 自定义随机数生成器
CryptoJS.lib.WordArray.random = (nBytes) => {
    const words = [];
    for (let i = 0; i < nBytes; i++) {
        words.push(rng() * 0x100000000);
    }

    return new CryptoJS.lib.WordArray.init(words, nBytes);
};

// 解密函数
export function decryptData(encryptedData, key = screptKey) {
    let iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
    let encryptedText = CryptoJS.enc.Base64.parse(encryptedData.ciphertext);
    let keyWords = CryptoJS.enc.Utf8.parse(key);
    let decryptedData = CryptoJS.AES.decrypt({
            ciphertext: encryptedText
        },
        keyWords, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
    return JSON.parse(decryptedData.toString(CryptoJS.enc.Utf8));
}

// 加密函数
export function encryptData(data, key = screptKey) {
    let iv = CryptoJS.lib.WordArray.random(16); // 随机生成初始向量
    let keyWords = CryptoJS.enc.Utf8.parse(key); // 将密钥转换为WordArray格式
    let encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), keyWords, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return {
        iv: CryptoJS.enc.Base64.stringify(iv),
        ciphertext: encrypted.toString()
    };
}

export default {
    decryptData,
    encryptData
};