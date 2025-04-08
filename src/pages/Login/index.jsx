import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { message } from 'antd';
import { sendVerifyCode, verifyPhoneCode, login as toLogin } from '@/api/auth.ts';
import { getUserInfo } from '@/api/user.ts';
import './index.scss';
import logo from '@/assets/images/logo.png';

function Login() {
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isGettingCode, setIsGettingCode] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isLogin, setIsLogin] = useState(true);
  const [showCountryList, setShowCountryList] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+86',
    name: '中国', 
    flag: '🇨🇳'
  });
  const [inviteCode, setInviteCode] = useState('');
  const [countryListPosition, setCountryListPosition] = useState({ top: 0, left: 0 });
  const countrySelectRef = useRef(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef(null);
  
  const countries = [
    { code: '+86', name: '中国', flag: '🇨🇳' },
    { code: '+852', name: '中国香港', flag: '🇭🇰' },
    { code: '+853', name: '中国澳门', flag: '🇲🇴' },
    { code: '+886', name: '中国台湾', flag: '🇹🇼' },
    { code: '+1', name: '美国', flag: '🇺🇸' },
    { code: '+81', name: '日本', flag: '🇯🇵' },
    { code: '+82', name: '韩国', flag: '🇰🇷' },
    { code: '+44', name: '英国', flag: '🇬🇧' },
    { code: '+65', name: '新加坡', flag: '🇸🇬' },
    { code: '+60', name: '马来西亚', flag: '🇲🇾' },
    { code: '+61', name: '澳大利亚', flag: '🇦🇺' },
    { code: '+64', name: '新西兰', flag: '🇳🇿' },
    { code: '+66', name: '泰国', flag: '🇹🇭' },
    { code: '+84', name: '越南', flag: '🇻🇳' },
    { code: '+62', name: '印度尼西亚', flag: '🇮🇩' },
    { code: '+63', name: '菲律宾', flag: '🇵🇭' },
  ];

  const navigate = useNavigate();
  const { login } = useAuth(); // 使用AuthContext提供的login方法
  const { isDarkMode } = useTheme();

  const leftStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), 
      url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80')`
  };

  const handleSendCode = async () => {
    if (!phone) return message.error('请输入手机号');
    
    try {
      const areaCode = selectedCountry.code.replace('+', '');
      const res = await sendVerifyCode(phone, areaCode);
      
      if(res.code !== 0) {
        message.error(res.msg || '发送验证码失败');
        return;
      }
      
      message.success('验证码发送成功');
      
      setIsGettingCode(true);
      let timeLeft = 60;
      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft === 0) {
          clearInterval(timer);
          setIsGettingCode(false);
          setCountdown(60);
        }
      }, 1000);
    } catch (err) {
      message.error('发送验证码失败，请稍后重试');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return message.error('请输入手机号');
    if (!/^\d{6}$/.test(verifyCode)) return message.error('请输入6位验证码');

    try {
      const areaCode = selectedCountry.code.replace('+', '');
      const verifyRes = await verifyPhoneCode(phone, verifyCode, areaCode);
      if(verifyRes.code !== 0) {
        message.error(verifyRes.msg || '验证码错误');
        return;
      }

      const loginRes = await toLogin(phone, inviteCode);
      if (loginRes.code !== 0) {
        message.error(loginRes.msg || '登录失败');
        return;
      }
      
      // Store token first
      localStorage.setItem('token', loginRes.data.token);
      
      // Get latest user info
      const userInfoRes = await getUserInfo();
      if (userInfoRes.code !== 0) {
        message.error(userInfoRes.msg || '获取用户信息失败');
        return;
      }
      
      // Combine token with latest user info
      const userData = {
        token: loginRes.data.token,
        user: userInfoRes.data
      };
      
      login(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      message.success('登录成功');
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryList(false);
  };

  const handleCountrySelectClick = () => {
    if (showCountryList) {
      handleCloseCountryList();
    } else {
      setShowCountryList(true);
    }
  };

  const handleCloseCountryList = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowCountryList(false);
    }, 200); // 与动画时长相同
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleCloseCountryList();
      }
    };

    if (showCountryList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryList]);

  const Modal = ({ title, content, visible, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
      if (visible) {
        setShouldRender(true);
      }
    }, [visible]);

    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        setShouldRender(false);
        onClose();
      }, 300); // 动画持续时间
    };

    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    };

    if (!shouldRender) return null;

    return (
      <div 
        className={`modal-overlay ${visible ? 'enter' : ''} ${isClosing ? 'exit' : ''}`}
        onClick={handleOverlayClick}
      >
        <div 
          className={`modal-content2 ${visible ? 'enter' : ''} ${isClosing ? 'exit' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
          <div className="modal-body">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`page-login ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="login-left" style={leftStyle}>
        <div className="login-left-content">
          <h1>数字人生态平台</h1>
          <p>
            打造您的专属数字形象，让创作更加简单。
            利用先进的AI技术，轻松复刻您的声音和形象，
            开启数字世界的无限可能。
          </p>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-box">
          <div className="login-header">
            <div className="login-logo-wrapper">
              <img src={logo} alt="logo" className="login-logo-img" />
              <span className="login-brand-text">跨灵</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="phone-input-group">
                <div 
                  className="country-select"
                  onClick={handleCountrySelectClick}
                >
                  <div className="select-content">
                    <span className="country-code">
                      <span className="prefix">
                        {selectedCountry.code.slice(1) === '86' ? 'CN' :
                         selectedCountry.code.slice(1) === '852' ? 'HK' :
                         selectedCountry.code.slice(1) === '853' ? 'MO' :
                         selectedCountry.code.slice(1) === '886' ? 'TW' :
                         selectedCountry.code.slice(1) === '1' ? 'US' :
                         selectedCountry.code.slice(1) === '81' ? 'JP' :
                         selectedCountry.code.slice(1) === '82' ? 'KR' :
                         selectedCountry.code.slice(1) === '44' ? 'GB' :
                         selectedCountry.code.slice(1) === '65' ? 'SG' :
                         selectedCountry.code.slice(1) === '60' ? 'MY' :
                         selectedCountry.code.slice(1) === '61' ? 'AU' :
                         selectedCountry.code.slice(1) === '64' ? 'NZ' :
                         selectedCountry.code.slice(1) === '66' ? 'TH' :
                         selectedCountry.code.slice(1) === '84' ? 'VN' :
                         selectedCountry.code.slice(1) === '62' ? 'ID' :
                         selectedCountry.code.slice(1) === '63' ? 'PH' : ''
                        }
                      </span>
                      <span className="number">{selectedCountry.code}</span>
                    </span>
                  </div>
                  <span className={`arrow-down ${showCountryList ? 'open' : ''}`}>▼</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                />
              </div>
              
              {showCountryList && (
                <div 
                  ref={dropdownRef}
                  className={`country-list ${isClosing ? 'closing' : ''}`}
                >
                  {countries.map((country) => (
                    <div
                      key={country.code}
                      className="country-item"
                      onClick={() => handleCountrySelect(country)}
                    >
                      <span className="country-code-prefix">
                        {country.code.slice(1) === '86' ? 'CN' :
                         country.code.slice(1) === '852' ? 'HK' :
                         country.code.slice(1) === '853' ? 'MO' :
                         country.code.slice(1) === '886' ? 'TW' :
                         country.code.slice(1) === '1' ? 'US' :
                         country.code.slice(1) === '81' ? 'JP' :
                         country.code.slice(1) === '82' ? 'KR' :
                         country.code.slice(1) === '44' ? 'GB' :
                         country.code.slice(1) === '65' ? 'SG' :
                         country.code.slice(1) === '60' ? 'MY' :
                         country.code.slice(1) === '61' ? 'AU' :
                         country.code.slice(1) === '64' ? 'NZ' :
                         country.code.slice(1) === '66' ? 'TH' :
                         country.code.slice(1) === '84' ? 'VN' :
                         country.code.slice(1) === '62' ? 'ID' :
                         country.code.slice(1) === '63' ? 'PH' : ''
                        }
                      </span>
                      <span className="country-name">{country.name}</span>
                      <span className="country-code">{country.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-group verify-code">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
              />
              <button
                type="button"
                className={`send-code-btn ${isGettingCode ? 'disabled' : ''}`}
                onClick={handleSendCode}
                disabled={isGettingCode}
              >
                {isGettingCode ? `${countdown}s后重试` : '获取验证码'}
              </button>
            </div>
            
            <div className="form-group invite-code">
              <input
                type="text"
                value={inviteCode}
                maxLength={32}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="邀请码（选填）"
              />
            </div>
            
            <button type="submit" className="submit-btn">
              {isLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="login-footer">
            <p>登录即表示同意</p>
            <div className="agreement-links">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowServiceModal(true);
              }}>服务协议</a>
              <span>&</span>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowPrivacyModal(true);
              }}>隐私政策</a>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="服务协议"
        content={
          <div className="agreement-content">
            <h4>1. 服务内容</h4>
            <p>1.1 本平台提供数字人生态相关服务，包括但不限于数字形象创建、声音克隆等功能。</p>
            <p>1.2 用户需要遵守相关法律法规和平台规则使用服务。</p>
            
            <h4>2. 用户责任</h4>
            <p>2.1 用户应确保提供的所有信息真实、准确。</p>
            <p>2.2 用户应妥善保管账号信息，对账号下的所有行为负责。</p>
            
            <h4>3. 知识产权</h4>
            <p>3.1 平台所有内容的知识产权归本公司所有。</p>
            <p>3.2 用户创作的内容知识产权归属按具体业务规则执行。</p>
          </div>
        }
        visible={showServiceModal}
        onClose={() => setShowServiceModal(false)}
      />
      
      <Modal
        title="隐私政策"
        content={
          <div className="agreement-content">
            <h4>1. 信息收集</h4>
            <p>1.1 我们收集的用户信息包括但不限于：手机号、设备信息等。</p>
            <p>1.2 我们严格遵守相关法律法规保护用户隐私。</p>
            
            <h4>2. 信息使用</h4>
            <p>2.1 收集的信息将用于提供服务和改善用户体验。</p>
            <p>2.2 未经用户同意，不会向第三方分享用户隐私信息。</p>
            
            <h4>3. 信息保护</h4>
            <p>3.1 采用业界标准的安全技术保护用户信息。</p>
            <p>3.2 定期审查和更新安全措施。</p>
          </div>
        }
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}

export default Login;