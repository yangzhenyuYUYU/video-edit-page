// 模拟登录信息
const mockUserInfo = {
  id: "test-user-id",
  name: "测试用户",
  avatar: "https://picsum.photos/200",
  user_type: 1,
  phone: "13800138000"
};

// 模拟token
const mockToken = "mock-token-for-development-only";

// 设置到localStorage
localStorage.setItem('token', mockToken);
localStorage.setItem('userInfo', JSON.stringify({
  token: mockToken,
  user: mockUserInfo
}));

console.log("模拟登录信息已设置，现在可以跳过登录页面"); 