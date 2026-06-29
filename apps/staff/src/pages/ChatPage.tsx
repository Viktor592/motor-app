import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, fetchMessages, addMessage } from '../slices/chatSlice';
import { AppDispatch, RootState } from '../store';
import { getSocket, joinOrder } from '../services/socket';
import s from './ChatPage.module.css';

export default function ChatPage() {
  const { orderId } = useParams<{ orderId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { messages, sending, loading } = useSelector((st: RootState) => st.chat);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchMessages(orderId));
      joinOrder(orderId);
      const socket = getSocket();
      socket?.on('chat:message', (msg: any) => dispatch(addMessage(msg)));
      return () => { socket?.off('chat:message'); };
    }
  }, [orderId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, sending]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setText('');
    dispatch(sendMessage({ message: t, orderId }));
  };

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.agentDot} />
        <div>
          <div className={s.agentName}>Агент «Приёмщик»</div>
          <div className={s.agentStatus}>● Онлайн · Powered by Claude AI · claude-sonnet-4-6</div>
        </div>
      </div>

      {/* Messages */}
      <div className={s.messages}>
        {loading && <p className={s.loading}>Загрузка истории…</p>}
        {!loading && messages.length === 0 && (
          <div className={s.welcome}>
            <div className={s.welcomeIco}>🤖</div>
            <h3 className={s.welcomeTitle}>Агент готов к работе</h3>
            <p className={s.welcomeText}>Опишите проблему с вашим автомобилем — я задам уточняющие вопросы, помогу разобраться и запишу к нужному специалисту.</p>
            <div className={s.prompts}>
              {['Стук в подвеске при повороте', 'Горит чек двигателя', 'Не заряжается аккумулятор', 'Нужно ТО'].map(p => (
                <button key={p} className={s.promptBtn} onClick={() => { setText(p); }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`${s.msg} ${m.role === 'USER' ? s.msgUser : s.msgAI}`}>
            {m.role === 'ASSISTANT' && <div className={s.ava}>AI</div>}
            <div className={s.bubble}>
              <p className={s.bubbleText}>{m.content}</p>
              <span className={s.bubbleTime}>
                {new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {sending && (
          <div className={`${s.msg} ${s.msgAI}`}>
            <div className={s.ava}>AI</div>
            <div className={`${s.bubble} ${s.typing}`}>
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={s.inputRow} onSubmit={submit}>
        <textarea className={s.input} value={text} onChange={e => setText(e.target.value)}
          placeholder="Опишите проблему…" rows={1} maxLength={2000}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e as any); } }}
        />
        <button className={s.sendBtn} type="submit" disabled={!text.trim() || sending}>↑</button>
      </form>
    </div>
  );
}
