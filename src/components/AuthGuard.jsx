import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 白名单路由，不需要登录就能访问
const whiteList = ['/login', '/landing', '/membership', '/wx-payment', '/no-permission', '/video-edit', '/'];
// 添加无权限页面路由
const NO_PERMISSION_PATH = '/no-permission';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  // 获取用户信息
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const userType = userInfo?.user?.user_type;

  useEffect(() => {
    const currentPath = location.pathname;
    
    if (token) {
      // 已登录状态
      if (currentPath === '/login') {
        // 如果已登录还想访问登录页，重定向到首页
        navigate('/workspace/home', { replace: true });
      }
      
      // 检查管理员权限
      if (currentPath.startsWith('/admin')) {
        if (userType !== 3) {
          // 如果不是管理员访问管理员页面，重定向到无权限页面
          navigate(NO_PERMISSION_PATH, {
            replace: true,
            state: { from: currentPath }
          });
        }
      }
    } else {
      // 未登录状态
      if (!whiteList.includes(currentPath)) {
        // 如果访问的不是白名单页面，重定向到登录页
        navigate('/login', {
          replace: true,
          state: { from: currentPath } // 保存来源路径，登录后可以跳回
        });
      }
    }
  }, [location.pathname, token, userType]);

  return children;
};

export default AuthGuard; 