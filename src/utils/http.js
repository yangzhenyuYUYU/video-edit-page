import axios from 'axios';
import { message, Modal } from 'antd';

// 添加一个标志位来跟踪是否正在显示401弹窗
let isShowingAuthModal = false;

// 创建 axios 实例
const http = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL + '/dhapi', // API 的基础URL
    timeout: 60000 * 10, // 请求超时时间
    headers: {
        'Content-Type': 'application/json',
    }
});

// 请求拦截器
http.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        let noAuth = true;
        // 如果是登录相关的接口或邀请码接口，不需要token
        if (config.url.includes('/auth/') || config.url.includes('/invitation/') || config.url.includes('/wx/')) {
            noAuth = false;
        }
        
        // 如果正在显示401弹窗，直接拒绝所有新请求
        if (isShowingAuthModal) {
            return Promise.reject('登录状态已失效');
        }
        
        if (!token && noAuth) {
            message.error('登录状态已失效,请重新登录');
            window.location.href = '/login';
            return Promise.reject('未登录');
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
http.interceptors.response.use(
    (response) => {
        // 直接返回响应数据
        return response.data;
    },
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401: // 未授权
                    // 如果已经在显示弹窗，直接返回
                    if (isShowingAuthModal) {
                        return Promise.reject(error);
                    }
                    
                    // 设置标志位，表示正在显示弹窗
                    isShowingAuthModal = true;

                    // 使用Modal.confirm显示确认对话框
                    Modal.confirm({
                        title: '登录状态已失效',
                        content: error?.response?.data?.detail || '请重新登录',
                        okText: '确定',
                        cancelText: '取消',
                        onOk: () => {
                            // 清除token和用户信息
                            localStorage.removeItem('token');
                            localStorage.removeItem('userInfo');
                            window.location.href = '/login';
                        },
                        afterClose: () => {
                            // 弹窗关闭后重置标志位
                            isShowingAuthModal = false;
                        }
                    });
                    break;
                case 403: // 禁止访问
                    message.error('没有权限访问该资源');
                    break;
                case 404: // 资源不存在
                    message.error('请求的资源不存在');
                    break;
                case 500: // 服务器错误
                    message.error('服务器错误');
                    break;
                default:
                    message.error(error?.response?.data?.msg || error?.response?.data?.detail);
            }
        } else if (error.request) {
            // 请求已经发出，但没有收到响应
            message.error('网络错误，请检查您的网络连接');
        } else {
            // 请求配置出错
            message.error('请求配置错误: ' + error.message);
        }
        return Promise.reject(error);
    }
);

// 封装 GET 请求
export const get = (url, params) => {
    return http.get(url, { params });
};

// 封装 POST 请求
export const post = (url, data) => {
    return http.post(url, data);
};

// 封装 PUT 请求
export const put = (url, data) => {
    return http.put(url, data);
};

// 封装 DELETE 请求
export const del = (url) => {
    return http.delete(url);
};

export default http;
