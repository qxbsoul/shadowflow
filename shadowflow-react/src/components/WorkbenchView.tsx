import { useEffect, useRef, useState } from 'react';
import { useWorkbench } from '../store';
import LiveBoard from './LiveBoard';
import ConversationSidebar from './ConversationSidebar';
import { modelsForProvider } from './SettingsView';

const QUICK_CHIPS = [
  { label: '生成本周获客简报', text: '生成本周获客简报' },
  { label: '安排每日行业简报', text: '安排每天早上 9 点的行业简报' },
  { label: '复盘上周转化', text: '复盘上周的转化数据' },
  { label: '整理客户跟进计划', text: '整理本周客户跟进计划' },
];

export default function WorkbenchView() {
  const { messages, typing, sendChat, toast, gwStatus, models, selectedModel, selectModel, conversations, activeConversationId, apiSettings } = useWorkbench();
  const [text, setText] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const activeConversation = conversations.find(item => item.id === activeConversationId);
  const projectLocked = Boolean(activeConversation?.projectId);
  const isGroup = activeConversation?.kind === 'group';
  const visibleModels = apiSettings.mode === 'custom' ? [] : modelsForProvider(models, apiSettings.provider);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = () => {
    const value = text.trim();
    if (!value || typing) return;
    setText('');
    sendChat(value);
  };

  return (
    <div className="workbench">
      <ConversationSidebar />
      <div className="chat-col">
        <div className="chat-head">
          <div className="ava">{isGroup ? '群' : '总'}</div>
          <div className="name">{isGroup ? '公司总经理群' : '总经理'}</div>
          <div className="model-chip">
            <span>模型</span>
            <select value={selectedModel} onChange={e => selectModel(e.target.value)} disabled={gwStatus !== 'ok' || apiSettings.mode === 'custom' || (!visibleModels.length && !selectedModel)}>
              {gwStatus !== 'ok' && <option value={selectedModel}>演示模型</option>}
              {gwStatus === 'ok' && apiSettings.mode === 'custom' && <option value={selectedModel}>{selectedModel} · 自定义</option>}
              {gwStatus === 'ok' && apiSettings.mode === 'official' && !visibleModels.some(model => model.id === selectedModel) && selectedModel && (
                <option value={selectedModel}>{selectedModel}</option>
              )}
              {visibleModels.map(model => <option key={model.id} value={model.id}>{model.label} · {model.tier}</option>)}
            </select>
          </div>
        </div>

        <div className="chat-body" ref={bodyRef}>
          {messages.map((m, i) => (
            <div key={m.id ?? i} className={m.from === 'boss' ? 'msg-row boss' : `msg-row ${m.from}`}>
              {m.from !== 'boss' && <div className="msg-ava">{m.from === 'ceo' ? '总' : m.from === 'agent' ? (m.senderName ?? '员').slice(0, 1) : '·'}</div>}
              <div>
                {m.from !== 'boss' && <div className="msg-sender">{m.senderName ?? (m.from === 'ceo' ? '总经理' : '系统')}</div>}
                <div className="bubble">
                  {m.text}
                  {m.card && (
                    <div className="biz-card">
                      <div className="bc-head">交付物</div>
                      <div className="bc-body">
                        <div className="bc-title">{m.card.title}</div>
                        <div className="bc-meta">{m.card.meta}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="msg-time">{m.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="msg-row">
              <div className="msg-ava">总</div>
              <div className="bubble">
                <span className="typing"><i /><i /><i /></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-foot">
          <div className="quick-chips">
            {QUICK_CHIPS.map(c => <button key={c.label} className="chip" disabled={typing || projectLocked} onClick={() => sendChat(c.text)}>{c.label}</button>)}
          </div>
          {projectLocked && <div className="project-locked">此对话已绑定项目；有新需求请点击“新开对话”。</div>}
          <div className="input-row">
            <textarea
              className="chat-input"
              rows={1}
              placeholder={projectLocked ? '此对话已绑定项目，请新开对话创建新项目' : '给总经理派活，比如：整理上周获客数据，明早发我简报'}
              value={text}
              disabled={projectLocked}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="icon-btn" title="添加附件" disabled={projectLocked} onClick={() => toast('附件上传接口已预留，当前版本尚未接入')}>附件</button>
            <button className="send-btn" onClick={send} disabled={typing || projectLocked || !text.trim()} title="发送">发送</button>
          </div>
        </div>
      </div>
      <LiveBoard />
    </div>
  );
}
