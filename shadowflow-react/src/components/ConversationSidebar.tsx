import { useWorkbench } from '../store';

export default function ConversationSidebar() {
  const {
    conversations, activeConversationId, selectConversation, newConversation,
    switchConversationKind, typing, deliverables, openModal,
  } = useWorkbench();
  const activeKind = conversations.find(item => item.id === activeConversationId)?.kind ?? 'single';
  const visible = conversations.filter(item => (item.kind ?? 'single') === activeKind);
  return (
    <aside className="conversation-sidebar">
      <div className="conversation-head">
        <div className="chat-kind-tabs" aria-label="对话模式">
          <button type="button" className={activeKind === 'single' ? 'active' : ''} onClick={() => switchConversationKind('single')} disabled={typing}>单聊</button>
          <button type="button" className={activeKind === 'group' ? 'active' : ''} onClick={() => switchConversationKind('group')} disabled={typing}>群聊</button>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => newConversation(activeKind)} disabled={typing}>
          {activeKind === 'group' ? '新建群聊' : '新开对话'}
        </button>
      </div>
      <div className="conversation-list">
        {visible.map(item => {
          const project = item.projectId ? deliverables.find(d => d.sourceId === item.projectId) : undefined;
          return (
            <div key={item.id} className={item.id === activeConversationId ? 'conversation-item active' : 'conversation-item'}>
              <button type="button" className="conversation-open" onClick={() => selectConversation(item.id)} disabled={typing}>
                <span className="conversation-title">{item.title}</span>
                <span className="conversation-meta">{item.projectId ? project?.status ?? '历史项目' : item.kind === 'group' ? '总经理与员工协作' : '与总经理对话'}</span>
              </button>
              <button type="button" className="conversation-delete" title="删除对话" aria-label={`删除${item.title}`} disabled={typing} onClick={() => openModal({ kind: 'delete-conversation', conversationId: item.id })}>删除</button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
