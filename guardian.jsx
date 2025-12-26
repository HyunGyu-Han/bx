import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  ShieldCheck, 
  XCircle, 
  PenTool, 
  Image as ImageIcon, 
  Sparkles, 
  Layout, 
  Clock, 
  UserCheck,
  Menu,
  Check,
  AlertCircle,
  Loader2,
  Archive,
  Save,
  MessageSquare
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// --- Firebase Initialization ---
// [중요] 배포 시 설정 방법:
// 1. Firebase 콘솔(console.firebase.google.com)에서 프로젝트 생성
// 2. 웹 앱 추가 후 'firebaseConfig' 객체 복사
// 3. 아래 fallbackConfig 부분에 붙여넣기 하세요.
const fallbackConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : fallbackConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 캔버스 환경이 아닐 경우 기본 앱 ID 사용
const appId = typeof __app_id !== 'undefined' ? __app_id : 'proper-market-bx';

// --- Gemini API Configuration ---
// [중요] 배포 시 API 키 보안을 위해 환경변수 사용을 권장합니다.
const apiKey = ""; 

async function callGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return null;
  }
}

// --- PROPER MARKET BX DATA (Single Source of Truth) ---
const bxData = {
  brandName: "PROPER MARKET (프로퍼마켓)",
  slogan: "Wellness for all (모두를 위한 웰니스)",
  coreConcept: "온라인 + 브랜드 + 리테일 (Online Trader Joe's / ALDI)",
  toneAndManner: [
    "네오 & 모던 (Neo & Modern)", 
    "미니멀 (Minimal)", 
    "약간의 위트 (Slight Wit)", 
    "강요하지 않는 (Not pushy)",
    "생활밀착형 (Life-friendly)"
  ],
  keywords: [
    "PROPER made", "PROPER tasty", "PROPER club", 
    "루틴(Routine)", "큐레이션(Curation)", "신뢰(Trust)"
  ],
  forbidden: [
    "지나친 할인 강조 (Price-driven)", 
    "너무 대중적인/유치한 톤 (Too Mass)", 
    "부담스러운 럭셔리 (Too Luxury)",
    "스톡 사진 느낌 (Stock Photos)"
  ],
  personas: [
    { name: "30대 워킹맘/전문직", desc: "합리적이고 깐깐함. 시간이 부족해 큐레이션을 원함." },
    { name: "관리하는 프로페셔널 걸", desc: "건강, 뷰티, 자신감 중요. 'Erewhon' 느낌 선호." },
    { name: "오후 3시의 직장인", desc: "당 떨어질 때 죄책감 없는 간식을 찾음." }
  ]
};

// --- Main Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
        // Fallback for demo without config
        if (!user) setUser({ uid: 'demo-user' });
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-sans selection:bg-[#E6F4EA]">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E5E5E5] flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-[#F0F0F0]">
          <h1 className="font-bold text-2xl tracking-tight text-[#004D40] flex items-center gap-2">
            <Leaf className="w-6 h-6" fill="#004D40" />
            PROPER<br/>MARKET
          </h1>
          <p className="text-xs text-[#666] mt-2 tracking-widest uppercase font-medium">BX Guardian</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Layout size={20}/>} label="BX Dashboard" />
          <NavItem active={activeTab === 'copy'} onClick={() => setActiveTab('copy')} icon={<PenTool size={20}/>} label="Copy Validator" />
          <NavItem active={activeTab === 'visual'} onClick={() => setActiveTab('visual')} icon={<ImageIcon size={20}/>} label="Visual Check" />
          <NavItem active={activeTab === 'persona'} onClick={() => setActiveTab('persona')} icon={<UserCheck size={20}/>} label="Persona Simulator" />
          <div className="pt-4 mt-4 border-t border-[#F0F0F0]">
            <NavItem active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} icon={<Archive size={20}/>} label="Team Archive" />
          </div>
        </nav>

        <div className="p-6 bg-[#E6F4EA] m-4 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#C8E6C9] rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <p className="text-xs font-bold text-[#004D40] mb-1 relative z-10">CURRENT MOOD</p>
          <p className="text-sm text-[#004D40] leading-relaxed relative z-10">
            "We make standards for life."<br/>
            오늘도 '적절한' 기준을 만들고 있나요?
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 max-w-5xl mx-auto min-h-screen">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'copy' && <CopyValidator user={user} />}
        {activeTab === 'visual' && <VisualValidator />}
        {activeTab === 'persona' && <PersonaSimulator user={user} />}
        {activeTab === 'archive' && <TeamArchive user={user} />}
      </main>
    </div>
  );
}

// --- Navigation Item ---
function NavItem({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden
        ${active 
          ? 'bg-[#004D40] text-white shadow-lg shadow-green-900/10' 
          : 'text-[#555] hover:bg-[#F5F5F5]'}`}
    >
      <div className="relative z-10 flex items-center space-x-3">
        {icon}
        <span className={`font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
      </div>
      {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>}
    </button>
  );
}

// --- 1. Dashboard Component ---
function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">BX Cloud Overview</h2>
        <p className="text-[#666]">우리가 정의한 'PROPER'의 기준입니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Core Concept" content="Online Trader Joe's + ALDI" sub="D2C 중심, SKU 최소화, 큐레이션" color="bg-[#E6F4EA] border-[#004D40]" />
        <Card title="Slogan" content="Wellness for all" sub="모두를 위한 웰니스" color="bg-[#FFF3E0] border-[#FF9800]" />
        <Card title="Target Tone" content="Life-friendly & Minimal" sub="네오 모던, 약간의 위트" color="bg-[#E3F2FD] border-[#2196F3]" />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          <ShieldCheck className="text-[#004D40]" />
          PROPER MARKET's 'DO & DON'T'
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold mb-4 tracking-wide">DO (권장)</span>
            <ul className="space-y-3">
              {bxData.keywords.map((k, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#333]">
                  <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-green-600" />
                  </span>
                  {k}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-[#333]">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                   <Check size={12} className="text-green-600" />
                </span>
                뽀빠이 매거진 스타일 (생활감)
              </li>
            </ul>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold mb-4 tracking-wide">DON'T (금지)</span>
            <ul className="space-y-3">
              {bxData.forbidden.map((k, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#333]">
                  <span className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <XCircle size={12} className="text-red-500" />
                  </span>
                  {k}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-[#333]">
                <span className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <XCircle size={12} className="text-red-500" />
                  </span>
                스톡 사진 사용 금지
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. Copy Validator with AI ---
function CopyValidator({ user }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const analyze = async () => {
    if (!text) return;
    setLoading(true);
    
    const prompt = `
      당신은 'PROPER MARKET(프로퍼마켓)'의 BX Guardian입니다.
      우리는 온라인의 Trader Joe's를 지향하며, 'Wellness for all'을 슬로건으로 합니다.
      
      [BX 가이드라인]
      - 톤앤매너: 네오, 모던, 미니멀, 약간의 위트, 강요하지 않는 태도.
      - 절대 금지: 너무 대중적(유치함)이거나, 너무 럭셔리(위화감)한 것. 할인만 강조하는 것.
      - 핵심 가치: 생활의 기준, 루틴, 큐레이션, "우리가 골랐어".
      
      [분석할 텍스트]
      "${text}"

      [요청사항]
      1. 이 텍스트가 PROPER MARKET의 톤앤매너(특히 '약간의 위트'와 '강요하지 않는 태도')에 맞는지 평가해줘.
      2. 만약 CJ/풀무원 같은 대기업 느낌이거나, 한살림 같은 너무 진지한 느낌이라면 지적해줘.
      3. 개선된 버전을 'PROPER made' 스타일로 2가지 제안해줘. (이모지 활용, 간결하게)
    `;

    const aiRes = await callGemini(prompt);
    setResult(aiRes);
    setLoading(false);
  };

  const saveToArchive = async () => {
    if (!user || !result) {
        if(!user) alert("로그인이 필요하거나 데모 모드입니다.");
        return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'archive'), {
        type: 'Copy Check',
        input: text,
        output: result,
        timestamp: serverTimestamp(),
        userId: user.uid
      });
      alert("팀 아카이브에 저장되었습니다!");
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다. (Firebase 설정 확인 필요)");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold mb-2">Copywriting Validator</h2>
        <p className="text-[#666]">작성한 카피가 'PROPER'한지 검증합니다.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow">
        <textarea 
          className="w-full h-40 p-4 border border-[#E0E0E0] rounded-xl focus:ring-2 focus:ring-[#004D40] focus:border-transparent outline-none resize-none text-[#333] placeholder:text-slate-300"
          placeholder="여기에 검증할 카피, 상세페이지 문구, 인스타 캡션을 입력하세요..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button 
            onClick={analyze}
            disabled={loading || !text}
            className="bg-[#004D40] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#00382E] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:hover:bg-[#004D40]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            BX Check
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-[#F4F9F6] p-6 rounded-2xl border border-[#C8E6C9] prose max-w-none relative animate-fade-in-up">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[#004D40] font-bold flex items-center gap-2 m-0">
              <Leaf size={20} /> AI Analysis Report
            </h3>
            <button
              onClick={saveToArchive}
              disabled={saving}
              className="text-xs bg-[#004D40] text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#00382E] transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save to Team Archive
            </button>
          </div>
          <div className="whitespace-pre-wrap text-[#333] leading-relaxed text-sm">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. Visual Validator (Checklist based on PDF) ---
function VisualValidator() {
  const [checks, setChecks] = useState({
    noStock: false,
    lifestyle: false,
    routine: false,
    tone: false
  });

  const progress = Object.values(checks).filter(Boolean).length * 25;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold mb-2">Visual & Creative Check</h2>
        <p className="text-[#666]">이미지가 '뽀빠이 매거진' 스타일이나 '생활감'을 담고 있나요?</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm h-fit">
          <h3 className="font-bold mb-6 text-lg">Self-Checklist</h3>
          <div className="space-y-4">
            <CheckItem 
              label="스톡(Stock) 사진이 아닌가요? (직접 촬영/연출)" 
              checked={checks.noStock} 
              onChange={() => setChecks({...checks, noStock: !checks.noStock})} 
            />
            <CheckItem 
              label="'뽀빠이 매거진'처럼 자연스러운 생활감이 있나요?" 
              checked={checks.lifestyle} 
              onChange={() => setChecks({...checks, lifestyle: !checks.lifestyle})} 
            />
            <CheckItem 
              label="제품이 고객의 '루틴(아침, 3PM, 운동후)' 속에 있나요?" 
              checked={checks.routine} 
              onChange={() => setChecks({...checks, routine: !checks.routine})} 
            />
            <CheckItem 
              label="네오 모던 & 미니멀한 디자인 톤인가요?" 
              checked={checks.tone} 
              onChange={() => setChecks({...checks, tone: !checks.tone})} 
            />
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>PROPER Score</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-[#EEE] rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                    progress === 100 ? 'bg-green-500' : 'bg-[#004D40]'
                }`}
                style={{width: `${progress}%`}}
              ></div>
            </div>
            {progress === 100 && (
                <p className="text-xs text-green-600 font-bold mt-2 text-center animate-bounce">
                    Perfect! BX 기준을 충족합니다.
                </p>
            )}
          </div>
        </div>

        <div className="bg-[#E3F2FD] p-6 rounded-2xl border border-[#BBDEFB]">
          <h3 className="font-bold text-[#1565C0] mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            Visual Guide Tip
          </h3>
          <ul className="space-y-4 text-sm text-[#0D47A1]">
            <li className="leading-relaxed">
              <strong>📸 자연광 활용:</strong> 인위적인 스튜디오 조명보다 자연스러운 햇살 느낌을 지향하세요. (Wellness mood)
            </li>
            <li className="leading-relaxed">
              <strong>🧘‍♀️ 상황 연출:</strong> 제품만 덩그러니 있는 '누끼'컷 보다는, 누군가 막 먹으려는 순간이나 가방에서 꺼내는 상황을 보여주세요.
            </li>
            <li className="leading-relaxed">
              <strong>🎨 컬러 팔레트:</strong> Green, Navy, Cream을 메인으로 사용하고, 과도한 원색 사용은 자제해주세요.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ label, checked, onChange }) {
  return (
    <div 
      onClick={onChange}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border select-none
        ${checked ? 'bg-[#E8F5E9] border-[#A5D6A7]' : 'bg-white border-[#EEE] hover:bg-[#FAFAFA]'}`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors duration-200
        ${checked ? 'bg-[#4CAF50] border-[#4CAF50]' : 'border-[#CCC]'}`}>
        {checked && <Check size={12} className="text-white" />}
      </div>
      <span className={`text-sm transition-colors ${checked ? 'text-[#2E7D32] font-medium' : 'text-[#666]'}`}>{label}</span>
    </div>
  );
}

// --- 4. Persona Simulator (New Feature) ---
function PersonaSimulator({ user }) {
  const [selectedPersona, setSelectedPersona] = useState(bxData.personas[0]);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const askPersona = async () => {
    if (!query) return;
    setLoading(true);

    const prompt = `
      [Roleplay]
      당신은 PROPER MARKET의 타겟 고객인 '${selectedPersona.name}'입니다.
      당신의 성향: ${selectedPersona.desc}
      
      우리는 온라인의 Trader Joe's 같은 'PROPER MARKET'입니다.
      사용자가 다음 아이디어/상품/카피를 제안했을 때, 당신의 입장에서 솔직한 피드백을 주세요.
      
      [제안 내용]
      "${query}"

      피드백 가이드:
      1. 당신의 라이프스타일(루틴)에 맞는지?
      2. 너무 비싸 보이거나 너무 싸구려 같진 않은지?
      3. 구매 의향이 있는지?
      
      말투는 해당 페르소나에 맞춰서 자연스럽게 해주세요.
    `;

    const res = await callGemini(prompt);
    setResponse(res);
    setLoading(false);
  };

  const saveToArchive = async () => {
    if (!user || !response) {
         if(!user) alert("로그인이 필요하거나 데모 모드입니다.");
         return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'archive'), {
        type: `Persona: ${selectedPersona.name}`,
        input: query,
        output: response,
        timestamp: serverTimestamp(),
        userId: user.uid
      });
      alert("팀 아카이브에 저장되었습니다!");
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold mb-2">Persona Simulator</h2>
        <p className="text-[#666]">우리의 고객들이 이 기획을 어떻게 생각할지 미리 물어보세요.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {bxData.personas.map((p, i) => (
          <button
            key={i}
            onClick={() => { setSelectedPersona(p); setResponse(''); }}
            className={`flex-1 p-4 rounded-xl border text-left transition-all duration-200
              ${selectedPersona.name === p.name 
                ? 'bg-[#004D40] text-white border-[#004D40] shadow-lg transform scale-105' 
                : 'bg-white border-[#EEE] text-[#666] hover:bg-[#F5F5F5]'}`}
          >
            <div className="font-bold text-sm mb-1">{p.name}</div>
            <div className={`text-xs ${selectedPersona.name === p.name ? 'text-green-200' : 'text-[#999]'}`}>
              {p.desc}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm flex flex-col gap-4">
        <div className="flex gap-2 items-center text-sm font-bold text-[#333]">
          <span className="bg-[#E0F2F1] text-[#00695C] px-2 py-1 rounded">To. {selectedPersona.name}</span>
          에게 물어보기:
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askPersona()}
            className="flex-1 p-3 border border-[#E0E0E0] rounded-lg outline-none focus:border-[#004D40] transition-colors"
            placeholder="예: '서리태 콩물 두유 패키지를 핫핑크로 하면 어떨까?' 또는 '가격이 5만원대면 살까?'"
          />
          <button 
            onClick={askPersona}
            disabled={loading}
            className="bg-[#263238] text-white px-6 rounded-lg font-bold hover:bg-[#37474F] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
            Ask
          </button>
        </div>
      </div>

      {response && (
        <div className="flex gap-4 animate-fade-in-up">
          <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex-shrink-0 flex items-center justify-center text-2xl border border-[#B2DFDB]">
            🤔
          </div>
          <div className="flex-1 bg-white p-6 rounded-r-2xl rounded-bl-2xl border border-[#E5E5E5] shadow-sm relative">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-[#1A1A1A] mb-2">{selectedPersona.name}의 답변</h4>
              <button
                onClick={saveToArchive}
                disabled={saving}
                className="text-xs bg-[#F5F5F5] text-[#666] px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#E0E0E0] transition-colors"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Archive
              </button>
            </div>
            <p className="text-[#333] leading-relaxed whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 5. Team Archive (New Feature) ---
function TeamArchive({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (or demo mode) before querying
    // Note: Real deployment requires setup
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'archive'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold mb-2 text-[#004D40] flex items-center gap-2">
          <Archive size={28} />
          Team BX Archive
        </h2>
        <p className="text-[#666]">팀원들이 저장한 BX 검증 결과와 인사이트를 모아보는 공간입니다.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#004D40]" size={40} />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E5E5] border-dashed">
          <p className="text-[#999]">아직 저장된 아카이브가 없습니다.<br/>카피 검증이나 페르소나 대화를 저장해보세요!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {logs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded-xl border border-[#E5E5E5] shadow-sm hover:border-[#004D40] transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    log.type.includes('Persona') ? 'bg-[#E3F2FD] text-[#1565C0]' : 'bg-[#E6F4EA] text-[#2E7D32]'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-xs text-[#999] flex items-center gap-1">
                    <Clock size={12} />
                    {log.timestamp?.toDate().toLocaleString() || 'Just now'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-[#999] mb-1">INPUT</div>
                  <div className="text-[#333] text-sm bg-[#FAFAFA] p-3 rounded-lg border border-[#EEE] group-hover:border-[#C8E6C9] transition-colors">
                    "{log.input}"
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#999] mb-1 flex items-center gap-1">
                    <Sparkles size={12} className="text-[#004D40]" /> AI FEEDBACK
                  </div>
                  <div className="text-[#333] text-sm whitespace-pre-wrap leading-relaxed">
                    {log.output}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ title, content, sub, color }) {
  return (
    <div className={`p-6 rounded-2xl border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow`}>
      <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-xl font-bold text-[#1A1A1A] mb-1">{content}</div>
      <div className="text-sm text-[#555]">{sub}</div>
    </div>
  );
}
