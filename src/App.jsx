import React, { useState, useEffect } from 'react'
import { Home, Users, UserCheck, FileText, BarChart2, Settings, Menu, X, ChevronLeft } from 'lucide-react'

// ── カラーパレット ──────────────────────────────────────────
const C = {
  kiji:   '#F5F2ED', // 生成り
  sumi:   '#1A1A1A', // 墨色
  ai:     '#1F3A5F', // 藍色
  kincha: '#A88940', // 金茶
  white:  '#FFFFFF',
  gray1:  '#F0EDE8',
  gray2:  '#D4CFCA',
  gray3:  '#888480',
}

// ── グローバルスタイル（CSS-in-JS） ─────────────────────────
const globalStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${C.kiji};
    color: ${C.sumi};
    font-family: 'Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', serif;
    min-height: 100vh;
  }
  button { cursor: pointer; font-family: inherit; }
  input, textarea, select { font-family: inherit; }
`

// ── localStorage ヘルパー ────────────────────────────────────
const LS = {
  get: (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
}

// ── デモデータ初期投入 ───────────────────────────────────────
function initDemoData() {
  if (LS.get('demo_initialized', false)) return

  const patients = [
    { id: 'p1', name: '山田 花子', furigana: 'ヤマダ ハナコ', age: 78, gender: '女', address: '東京都新宿区1-2-3', phone: '03-1234-5678', symptoms: '腰痛・肩こり・膝関節痛', insurance: '健康保険', insuranceNo: '12345678', doctor: '田中 一郎', hospital: '田中内科クリニック', notes: '左膝に注意' },
    { id: 'p2', name: '鈴木 太郎', furigana: 'スズキ タロウ', age: 82, gender: '男', address: '東京都新宿区4-5-6', phone: '03-2345-6789', symptoms: '脳梗塞後遺症・右半身麻痺', insurance: '介護保険', insuranceNo: '87654321', doctor: '佐藤 二郎', hospital: '新宿中央病院', notes: '移乗は必ず二人で' },
    { id: 'p3', name: '佐藤 美代', furigana: 'サトウ ミヨ', age: 75, gender: '女', address: '東京都新宿区7-8-9', phone: '03-3456-7890', symptoms: '変形性膝関節症・腰椎すべり症', insurance: '健康保険', insuranceNo: '11223344', doctor: '木村 三郎', hospital: '木村整形外科', notes: '血圧高め。要確認' },
  ]
  const therapists = [
    { id: 't1', name: '高橋 健', furigana: 'タカハシ ケン', qualification: 'あん摩マッサージ指圧師', phone: '090-1234-5678', active: true },
    { id: 't2', name: '伊藤 明子', furigana: 'イトウ アキコ', qualification: 'あん摩マッサージ指圧師・はり師', phone: '090-2345-6789', active: true },
  ]
  const today = new Date()
  const fmt = (d) => d.toISOString().slice(0, 10)
  const visits = [
    { id: 'v1', date: fmt(today), patientId: 'p1', therapistId: 't1', startTime: '09:00', endTime: '09:30', duration: 30 },
    { id: 'v2', date: fmt(today), patientId: 'p2', therapistId: 't2', startTime: '10:00', endTime: '10:40', duration: 40 },
    { id: 'v3', date: fmt(today), patientId: 'p3', therapistId: 't1', startTime: '11:00', endTime: '11:20', duration: 20 },
  ]

  LS.set('patients', patients)
  LS.set('therapists', therapists)
  LS.set('visits', visits)
  LS.set('reports', [])
  LS.set('officeName', 'ハーベスト訪問施術院')
  LS.set('demo_initialized', true)
}

// ── スタイルユーティリティ ──────────────────────────────────
const s = {
  card: { background: C.white, borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 12 },
  btn: (bg = C.ai, color = C.white) => ({
    background: bg, color, border: 'none', borderRadius: 8, padding: '10px 18px',
    fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
  }),
  input: { width: '100%', border: `1px solid ${C.gray2}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, background: C.white, outline: 'none' },
  label: { fontSize: 12, color: C.gray3, fontWeight: 600, display: 'block', marginBottom: 4 },
  pageWrap: { padding: '16px 16px 80px', maxWidth: 600, margin: '0 auto' },
  section: { fontSize: 13, color: C.ai, fontWeight: 700, borderBottom: `1px solid ${C.ai}`, paddingBottom: 4, marginBottom: 12, marginTop: 20 },
}

// ── ナビゲーション定義 ──────────────────────────────────────
const NAV = [
  { id: 'home',      label: 'ホーム',   Icon: Home },
  { id: 'schedule',  label: '行程表',   Icon: FileText },
  { id: 'patients',  label: '患者',     Icon: Users },
  { id: 'therapists',label: '施術者',   Icon: UserCheck },
  { id: 'reports',   label: '日報',     Icon: BarChart2 },
  { id: 'settings',  label: '設定',     Icon: Settings },
]

// ── ホーム画面 ───────────────────────────────────────────────
function HomeScreen({ navigate }) {
  const officeName  = LS.get('officeName', 'ハーベスト訪問施術院')
  const patients    = LS.get('patients', [])
  const visits      = LS.get('visits', [])
  const reports     = LS.get('reports', [])
  const today       = new Date().toISOString().slice(0, 10)
  const todayVisits = visits.filter(v => v.date === today)
  const thisMonth   = new Date().toISOString().slice(0, 7)
  const monthReports= reports.filter(r => r.date && r.date.startsWith(thisMonth))

  const tiles = [
    { id: 'schedule',   label: '行程表',         sub: `本日 ${todayVisits.length}件`,   Icon: FileText,   bg: C.ai },
    { id: 'patients',   label: '患者マスタ',      sub: `${patients.length}名登録`,       Icon: Users,      bg: '#2E5F8A' },
    { id: 'therapists', label: '施術者マスタ',    sub: '担当者管理',                      Icon: UserCheck,  bg: '#3A6B3A' },
    { id: 'reports',    label: '日報',            sub: `今月 ${monthReports.length}件`,  Icon: BarChart2,  bg: '#7A4A2A' },
    { id: 'monthly',    label: '月次報告書',      sub: '集計・印刷',                      Icon: BarChart2,  bg: C.kincha },
    { id: 'settings',   label: '設定',            sub: 'システム設定',                    Icon: Settings,   bg: C.gray3 },
  ]

  return (
    <div style={s.pageWrap}>
      <div style={{ textAlign: 'center', paddingTop: 20, paddingBottom: 28 }}>
        <div style={{ fontSize: 11, color: C.kincha, letterSpacing: 3, marginBottom: 4 }}>VISITING MASSAGE SYSTEM</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.sumi }}>{officeName}</h1>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {[
            { label: '本日の予定', value: todayVisits.length, unit: '件' },
            { label: '今月の日報', value: monthReports.length, unit: '件' },
            { label: '患者数', value: patients.length, unit: '名' },
          ].map(({ label, value, unit }) => (
            <div key={label} style={{ ...s.card, padding: '12px 18px', marginBottom: 0, textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 11, color: C.gray3 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: C.ai }}>{value}<span style={{ fontSize: 13 }}>{unit}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {tiles.map(({ id, label, sub, Icon, bg }) => (
          <button key={id} onClick={() => navigate(id)}
            style={{ background: bg, color: C.white, border: 'none', borderRadius: 14, padding: '18px 14px', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <Icon size={24} style={{ opacity: 0.85, marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── プレースホルダー画面（未実装） ──────────────────────────
function PlaceholderScreen({ title, navigate }) {
  return (
    <div style={s.pageWrap}>
      <button onClick={() => navigate('home')} style={{ ...s.btn(C.gray2, C.sumi), marginBottom: 16 }}>
        <ChevronLeft size={16} /> ホームへ
      </button>
      <div style={{ ...s.card, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 16, color: C.gray3 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.gray3, marginTop: 8 }}>実装中...</div>
      </div>
    </div>
  )
}

// ── ボトムナビ ───────────────────────────────────────────────
function BottomNav({ current, navigate }) {
  const items = NAV.slice(0, 5)
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: C.white, borderTop: `1px solid ${C.gray2}`,
      display: 'flex', zIndex: 100,
      boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
    }}>
      {items.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => navigate(id)}
          style={{
            flex: 1, border: 'none', background: 'none', padding: '8px 0 6px',
            color: current === id ? C.ai : C.gray3,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
          <Icon size={20} strokeWidth={current === id ? 2.5 : 1.8} />
          <span style={{ fontSize: 10, fontWeight: current === id ? 700 : 400 }}>{label}</span>
        </button>
      ))}
    </nav>
  )
}

// ── アプリ本体 ───────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home')
  const [param, setParam] = useState(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = globalStyle
    document.head.appendChild(style)
    initDemoData()
    return () => document.head.removeChild(style)
  }, [])

  const navigate = (id, p = null) => { setScreen(id); setParam(p) }

  const renderScreen = () => {
    switch (screen) {
      case 'home':       return <HomeScreen navigate={navigate} />
      case 'schedule':   return <PlaceholderScreen title="行程表" navigate={navigate} />
      case 'patients':   return <PlaceholderScreen title="患者マスタ" navigate={navigate} />
      case 'therapists': return <PlaceholderScreen title="施術者マスタ" navigate={navigate} />
      case 'reports':    return <PlaceholderScreen title="日報" navigate={navigate} />
      case 'monthly':    return <PlaceholderScreen title="月次報告書" navigate={navigate} />
      case 'settings':   return <PlaceholderScreen title="設定" navigate={navigate} />
      default:           return <HomeScreen navigate={navigate} />
    }
  }

  const showNav = !['report_new', 'report_detail'].includes(screen)

  return (
    <div style={{ minHeight: '100vh', background: C.kiji }}>
      {renderScreen()}
      {showNav && <BottomNav current={screen} navigate={navigate} />}
    </div>
  )
}
