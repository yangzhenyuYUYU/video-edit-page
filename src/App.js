import React from 'react';
import AppRouter from './router';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import 'antd/dist/reset.css';

console.log(process.env.REACT_APP_BASE_URL);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
