import { useState, type FormEvent } from 'react';
import { useWorkbench } from '../store';

export default function AuthView() {
  const { authPanel, setAuthPanel, authenticate, guestLogin, authError } = useWorkbench();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (authPanel === 'login') await authenticate('login', { email, password });
      else await authenticate('register', { email, password, display_name: displayName, company_name: companyName });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setBusy(false);
    }
  };

  const guest = async () => {
    setBusy(true);
    setError('');
    try { await guestLogin(); } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <div className="brand-mark">S</div>
        <h1>你的公司，独立工作空间</h1>
      </section>
      <section className="panel auth-panel">
        <div className="filter-tabs">
          <button type="button" className={authPanel === 'login' ? 'ftab active' : 'ftab'} onClick={() => setAuthPanel('login')}>登录</button>
          <button type="button" className={authPanel === 'register' ? 'ftab active' : 'ftab'} onClick={() => setAuthPanel('register')}>注册</button>
        </div>
        <form className="settings-form" onSubmit={submit}>
          {authPanel === 'register' && (
            <div className="settings-grid">
              <div className="form-group"><label className="form-label" htmlFor="auth-name">老板姓名</label><input id="auth-name" className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="auth-company">公司名称</label><input id="auth-company" className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} required /></div>
            </div>
          )}
          <div className="form-group"><label className="form-label" htmlFor="auth-email">邮箱</label><input id="auth-email" className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div>
          <div className="form-group"><label className="form-label" htmlFor="auth-password">密码</label><input id="auth-password" className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={authPanel === 'login' ? 'current-password' : 'new-password'} minLength={8} required /></div>
          {(error || authError) && <div className="settings-feedback error" role="alert">{error || authError}</div>}
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '正在进入…' : authPanel === 'login' ? '登录并进入公司' : '注册并创建公司'}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void guest()}>未注册演示</button>
          </div>
        </form>
      </section>
    </div>
  );
}
