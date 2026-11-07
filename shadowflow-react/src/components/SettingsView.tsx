import { useEffect, useState, type FormEvent } from 'react';
import { BYOK_PROVIDERS } from '../api';
import { hasStoredApiKey, PROVIDER_LABELS, type ApiConfigMode } from '../settings-storage';
import { useWorkbench } from '../store';

type SettingsSection = 'general' | 'model';

const PROVIDER_VENDORS: Record<string, string[]> = {
  anthropic: ['Anthropic'], openai: ['OpenAI'], deepseek: ['DeepSeek'], mimo: ['MiMo'],
  google: ['Google'], qwen: ['Alibaba'],
};

export function modelsForProvider<T extends { id: string; vendor: string }>(models: T[], provider: string): T[] {
  const vendors = PROVIDER_VENDORS[provider] ?? [];
  return models.filter(item => vendors.includes(item.vendor));
}

export default function SettingsView() {
  const { models, apiSettings, saveModelSettings, clearModelKey } = useWorkbench();
  const [section, setSection] = useState<SettingsSection>('general');
  const [customEditor, setCustomEditor] = useState(false);
  const [mode, setMode] = useState<ApiConfigMode>(apiSettings.mode);
  const [provider, setProvider] = useState(apiSettings.provider);
  const [model, setModel] = useState(apiSettings.model);
  const [baseUrl, setBaseUrl] = useState(apiSettings.baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const hasCustom = Boolean(apiSettings.baseUrl && apiSettings.model);
  const hasKey = hasStoredApiKey(mode, provider);
  const providerModels = modelsForProvider(models, provider);

  useEffect(() => {
    setMode(apiSettings.mode);
    setProvider(apiSettings.provider);
    setModel(apiSettings.model);
    setBaseUrl(apiSettings.baseUrl);
    setApiKey('');
    setCustomEditor(false);
    setConfirmClear(false);
  }, [apiSettings]);

  const openExisting = () => {
    setCustomEditor(false);
    setMode(apiSettings.mode);
    setProvider(apiSettings.provider);
    setModel(apiSettings.model);
    setBaseUrl(apiSettings.baseUrl);
    setFeedback('');
    setError('');
    setConfirmClear(false);
  };

  const openCustomEditor = () => {
    setCustomEditor(true);
    setMode('custom');
    setModel(hasCustom ? apiSettings.model : '');
    setBaseUrl(apiSettings.baseUrl);
    setFeedback('');
    setError('');
    setConfirmClear(false);
  };

  const selectProvider = (value: string) => {
    setConfirmClear(false);
    setFeedback('');
    if (value === 'custom') {
      setMode('custom');
      setModel(apiSettings.model);
      setBaseUrl(apiSettings.baseUrl);
      return;
    }
    setMode('official');
    setProvider(value as typeof provider);
    setModel(modelsForProvider(models, value)[0]?.id ?? '');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback('');
    setError('');
    if (!model.trim()) {
      setError('请填写或选择模型。');
      return;
    }
    if (mode === 'custom') {
      let parsed: URL;
      try { parsed = new URL(baseUrl.trim()); } catch {
        setError('请输入完整的 Base URL，例如 https://api.openai.com/v1。');
        return;
      }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setError('Base URL 仅支持 http:// 或 https://。');
        return;
      }
    }
    try {
      saveModelSettings({ mode, provider, model, baseUrl, apiKey });
      setApiKey('');
      setShowKey(false);
      setCustomEditor(false);
      setFeedback(mode === 'custom' ? '已保存并加入“现有 Provider”下拉表。' : '配置已保存到当前浏览器，刷新后仍会保留。');
    } catch {
      setError('浏览器存储不可用，本次配置未保存。请检查隐私模式或存储权限。');
    }
  };

  const clearKey = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setFeedback('再次点击“确认清除”才会移除密钥。');
      return;
    }
    clearModelKey({ mode, provider });
    setApiKey('');
    setConfirmClear(false);
    setError('');
    setFeedback('密钥已从当前浏览器移除，其他模型配置保持不变。');
  };

  return (
    <div className="view-inner settings-page">
      <div className="view-head">
        <h2>设置</h2>
      </div>

      <div className="settings-shell">
        <nav className="panel settings-nav" aria-label="设置目录">
          <button type="button" className={section === 'general' ? 'settings-nav-item active' : 'settings-nav-item'} onClick={() => setSection('general')}>通用</button>
          <button type="button" className={section === 'model' ? 'settings-nav-item active' : 'settings-nav-item'} onClick={() => setSection('model')}>模型与 API</button>
        </nav>

        <div className="settings-content">
          {section === 'general' && (
            <section className="panel settings-main">
              <div className="settings-section-head"><h3>通用</h3></div>
              <div className="settings-form">
                <dl className="settings-facts general-facts">
                  <div><dt>应用</dt><dd>ShadowFlow 工作台</dd></div>
                  <div><dt>运行环境</dt><dd>本地前后端联调</dd></div>
                </dl>
                <div className="settings-actions"><button type="button" className="btn btn-primary" onClick={() => setSection('model')}>管理模型与 API</button></div>
              </div>
            </section>
          )}

          {section === 'model' && (
            <section className="panel settings-main">
              <div className="settings-section-head">
                <h3>模型与 API</h3>
                <span className={hasKey ? 'settings-badge saved' : 'settings-badge'}>{hasKey ? '密钥已保存' : '未配置密钥'}</span>
              </div>
              <form className="settings-form" onSubmit={submit} noValidate autoComplete="off">
                <div className="filter-tabs settings-mode" aria-label="API 配置模式">
                  <button type="button" className={!customEditor ? 'ftab active' : 'ftab'} onClick={openExisting}>现有 Provider</button>
                  <button type="button" className={customEditor ? 'ftab active' : 'ftab'} onClick={openCustomEditor}>自定义 API</button>
                </div>

                {!customEditor ? (
                  <>
                    <div className="settings-grid">
                      <div className="form-group">
                        <label className="form-label" htmlFor="settings-provider">服务提供商</label>
                        <select id="settings-provider" className="form-select" value={mode === 'custom' ? 'custom' : provider} onChange={event => selectProvider(event.target.value)}>
                          {BYOK_PROVIDERS.map(item => <option key={item} value={item}>{PROVIDER_LABELS[item]}</option>)}
                          {(hasCustom || mode === 'custom') && <option value="custom">自定义 API · {apiSettings.model || model}</option>}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor={mode === 'custom' ? 'settings-custom-model' : 'settings-model'}>{mode === 'custom' ? '模型 ID' : '默认模型'}</label>
                        {mode === 'custom' ? (
                          <input id="settings-custom-model" className="form-input" value={model} onChange={event => setModel(event.target.value)} />
                        ) : providerModels.length ? (
                          <select id="settings-model" className="form-select" value={model} onChange={event => setModel(event.target.value)}>
                            {!providerModels.some(item => item.id === model) && model && <option value={model}>{model}</option>}
                            {providerModels.map(item => <option key={item.id} value={item.id}>{item.label} · {item.tier}</option>)}
                          </select>
                        ) : (
                          <input id="settings-model" className="form-input" value={model} onChange={event => setModel(event.target.value)} placeholder="输入该 Provider 的模型 ID" />
                        )}
                      </div>
                    </div>
                    {mode === 'custom' && (
                      <div className="form-group">
                        <label className="form-label" htmlFor="settings-base-url">Base URL</label>
                        <input id="settings-base-url" className="form-input" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="settings-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="settings-base-url">Base URL</label>
                      <input id="settings-base-url" className="form-input" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="https://your-endpoint.example/v1" inputMode="url" />
                      <div className="settings-help">填写到 API 版本路径，不要追加 /chat/completions。</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="settings-custom-model">模型 ID</label>
                      <input id="settings-custom-model" className="form-input" value={model} onChange={event => setModel(event.target.value)} placeholder="例如 deepseek-chat" />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-api-key">API Key</label>
                  <div className="settings-key-row">
                    <input id="settings-api-key" className="form-input" type={showKey ? 'text' : 'password'} value={apiKey} onChange={event => { setApiKey(event.target.value); setConfirmClear(false); }} placeholder={hasKey ? '已有密钥；留空保存则保持不变' : '输入你的 API Key'} autoComplete="new-password" spellCheck={false} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowKey(value => !value)}>{showKey ? '隐藏' : '显示'}</button>
                  </div>
                  <div className="settings-help">密钥不会回显；仅保存在当前浏览器 localStorage，未加密，请勿在共享设备上使用。</div>
                </div>
                <div className="settings-notice">{mode === 'official' ? '候选模型已按当前 Provider 过滤；没有后台候选时可手动填写模型 ID。保存不代表已验证连接。' : '自定义地址和模型 ID 可直接修改；当前只保存到本机，不会向该地址发送请求。'}</div>
                {error && <div className="settings-feedback error" role="alert">{error}</div>}
                {feedback && <div className="settings-feedback" role="status">{feedback}</div>}
                <div className="settings-actions">
                  <button type="submit" className="btn btn-primary">保存配置</button>
                  <button type="button" className="btn btn-danger" disabled={!hasKey} onClick={clearKey}>{confirmClear ? '确认清除' : '清除密钥'}</button>
                  {confirmClear && <button type="button" className="btn btn-ghost" onClick={() => { setConfirmClear(false); setFeedback(''); }}>取消</button>}
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
