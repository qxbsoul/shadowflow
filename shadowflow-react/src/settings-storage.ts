import { BYOK_PROVIDERS, setByokKey, setDefaultProvider, type ByokProvider } from './api';

export type ApiConfigMode = 'official' | 'custom';

export interface ApiSettingsState {
  mode: ApiConfigMode;
  provider: ByokProvider;
  model: string;
  baseUrl: string;
  hasKey: boolean;
}

export interface ApiSettingsInput {
  mode: ApiConfigMode;
  provider: ByokProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export const PROVIDER_LABELS: Record<ByokProvider, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  zhipu: '智谱 GLM',
  mimo: 'MiMo',
  google: 'Google Gemini',
  qwen: '通义千问',
  moonshot: 'Moonshot AI',
  mistral: 'Mistral AI',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  ollama: 'Ollama（本地）',
  lmstudio: 'LM Studio（本地）',
  azure: 'Azure OpenAI',
};

const MODE_KEY = 'sf_api_config_mode';
const CUSTOM_BASE_URL_KEY = 'sf_custom_api_base_url';
const CUSTOM_MODEL_KEY = 'sf_custom_api_model';
const CUSTOM_API_KEY = 'sf_custom_api_key';

function read(key: string): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}

function savedProvider(): ByokProvider {
  const value = read('sf_default_provider');
  return BYOK_PROVIDERS.includes(value as ByokProvider) ? value as ByokProvider : 'deepseek';
}

/**
 * 模型设置的浏览器过渡存储。官方 key 沿用现有 api.ts 请求头契约；
 * 自定义配置独立保存，待 OPC 执行器具备 base_url 契约后再接入，不伪装已生效。
 */
export function loadApiSettings(): ApiSettingsState {
  const mode: ApiConfigMode = read(MODE_KEY) === 'custom' ? 'custom' : 'official';
  const provider = savedProvider();
  const selectedModel = read('sf_selected_model') || 'deepseek-chat';
  const hasKey = mode === 'custom'
    ? Boolean(read(CUSTOM_API_KEY))
    : Boolean(read(`sf_${provider}_key`));
  return {
    mode,
    provider,
    model: mode === 'custom' ? read(CUSTOM_MODEL_KEY) || selectedModel : selectedModel,
    baseUrl: read(CUSTOM_BASE_URL_KEY),
    hasKey,
  };
}

export function saveApiSettings(input: ApiSettingsInput): ApiSettingsState {
  const model = input.model.trim();
  if (input.mode === 'official') {
    setDefaultProvider(input.provider);
    if (input.apiKey.trim()) setByokKey(input.provider, input.apiKey.trim());
  } else {
    localStorage.setItem(CUSTOM_BASE_URL_KEY, input.baseUrl.trim().replace(/\/+$/, ''));
    localStorage.setItem(CUSTOM_MODEL_KEY, model);
    if (input.apiKey.trim()) localStorage.setItem(CUSTOM_API_KEY, input.apiKey.trim());
  }
  localStorage.setItem(MODE_KEY, input.mode);
  localStorage.setItem('sf_selected_model', model);
  return loadApiSettings();
}

export function hasStoredApiKey(mode: ApiConfigMode, provider: ByokProvider): boolean {
  return mode === 'custom'
    ? Boolean(read(CUSTOM_API_KEY))
    : Boolean(read(`sf_${provider}_key`));
}

export function clearApiKey(target: { mode: ApiConfigMode; provider: ByokProvider }): ApiSettingsState {
  if (target.mode === 'custom') localStorage.removeItem(CUSTOM_API_KEY);
  else setByokKey(target.provider, '');
  return loadApiSettings();
}
