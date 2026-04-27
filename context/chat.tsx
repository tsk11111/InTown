import React, { createContext, useContext, useState } from 'react';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

type ChatStore = Record<string, ChatMessage[]>;

interface ChatContextType {
  getMessages: (eventId: string) => ChatMessage[];
  sendMessage: (eventId: string, userId: string, userName: string, text: string) => void;
}

const now = Date.now();
const m = (offsetMin: number) => now - offsetMin * 60_000;

const SEED: ChatStore = {
  'ro-2': [
    { id: 's1', userId: 'u1', userName: 'Maria', text: 'Salut! Știți dacă se ține și dacă plouă?', timestamp: m(120) },
    { id: 's2', userId: 'u2', userName: 'Andrei', text: 'Da, mergem indiferent de vreme! Aduceți haine impermeabile 🙂', timestamp: m(115) },
    { id: 's3', userId: 'u3', userName: 'Elena', text: 'Super! Eu vin prima dată - unde ne întâlnim exact?', timestamp: m(100) },
    { id: 's4', userId: 'u2', userName: 'Andrei', text: 'La intrarea principală din Herăstrău, lângă poartă. Ne vedem la 9!', timestamp: m(95) },
    { id: 's5', userId: 'u4', userName: 'Radu', text: 'Și eu vin prima dată, mulțumesc pentru indicații 👍', timestamp: m(40) },
  ],
  'ro-3': [
    { id: 's6', userId: 'u5', userName: 'Dan', text: 'A citit cineva deja Moromeții? Ce vi se pare?', timestamp: m(200) },
    { id: 's7', userId: 'u6', userName: 'Raluca', text: 'Superb! Dar e lung... am ajuns la jumătate 😅', timestamp: m(185) },
    { id: 's8', userId: 'u7', userName: 'Ioana', text: 'Eu abia am început dar deja îmi place stilul lui Preda', timestamp: m(170) },
    { id: 's9', userId: 'u5', userName: 'Dan', text: 'Vom vorbi și despre contextul istoric duminică, vine interesant', timestamp: m(90) },
  ],
  'ro-12': [
    { id: 's10', userId: 'u8', userName: 'Vlad', text: 'Se poate veni și fără instrumente?', timestamp: m(300) },
    { id: 's11', userId: 'u9', userName: 'Clubul Țăranului', text: 'Bineînțeles! Publicul e la fel de important 🎸', timestamp: m(285) },
    { id: 's12', userId: 'u10', userName: 'Mihaela', text: 'Sunt cântăreață, pot urca pe scenă?', timestamp: m(260) },
    { id: 's13', userId: 'u9', userName: 'Clubul Țăranului', text: 'Absolut! Open mic - toată lumea e binevenită', timestamp: m(250) },
    { id: 's14', userId: 'u8', userName: 'Vlad', text: 'Perfect, ne vedem vineri seara!', timestamp: m(60) },
  ],
  'ro-1': [
    { id: 's15', userId: 'u11', userName: 'Bogdan', text: 'Bună! E pentru începători sau trebuie experiență?', timestamp: m(180) },
    { id: 's16', userId: 'u12', userName: 'Cafeneaua Veche', text: 'Pentru toate nivelele! Avem table pentru toți 🎯', timestamp: m(165) },
    { id: 's17', userId: 'u13', userName: 'Cristina', text: 'Pot veni și eu deși nu am mai jucat niciodată?', timestamp: m(150) },
    { id: 's18', userId: 'u12', userName: 'Cafeneaua Veche', text: 'Cu atât mai bine! Te învățăm noi 😊', timestamp: m(140) },
  ],
  'bg-sf-1': [
    { id: 's19', userId: 'u14', userName: 'Alex', text: 'Which languages will be at the event?', timestamp: m(240) },
    { id: 's20', userId: 'u15', userName: 'The Библиотека', text: 'Bulgarian, English, Romanian, and usually some French and German too!', timestamp: m(220) },
    { id: 's21', userId: 'u16', userName: 'Petra', text: 'Amazing, I\'m trying to learn Bulgarian 🇧🇬', timestamp: m(200) },
    { id: 's22', userId: 'u14', userName: 'Alex', text: 'Same! See you all there', timestamp: m(50) },
  ],
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<ChatStore>(SEED);

  const getMessages = (eventId: string): ChatMessage[] =>
    store[eventId] ?? [];

  const sendMessage = (eventId: string, userId: string, userName: string, text: string) => {
    const msg: ChatMessage = {
      id: `${eventId}-${Date.now()}`,
      userId,
      userName,
      text: text.trim(),
      timestamp: Date.now(),
    };
    setStore((prev) => ({
      ...prev,
      [eventId]: [...(prev[eventId] ?? []), msg],
    }));
  };

  return (
    <ChatContext.Provider value={{ getMessages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
