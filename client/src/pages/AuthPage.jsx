import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import '../styles/auth.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-form-wrapper">
          {isLogin ? (
            <>
              <LoginForm onSuccess={() => {}} />
              <div className="auth-links">
                <p>
                  Don't have an account?{' '}
                  <a onClick={() => setIsLogin(false)}>Register</a>
                </p>
              </div>
            </>
          ) : (
            <>
              <RegisterForm onSuccess={() => {}} />
              <div className="auth-links">
                <p>
                  Already have an account?{' '}
                  <a onClick={() => setIsLogin(true)}>Login</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
