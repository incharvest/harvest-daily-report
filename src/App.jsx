import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Home, Users, UserCheck, FileText, BarChart2, Settings, Menu, X, ChevronLeft, Plus, Search, Edit2, Trash2, Save, XCircle, Mic, MicOff } from 'lucide-react'

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

// ── 患者マスタ ───────────────────────────────────────────────
const PATIENT_FIELDS = [
  { key: 'name',        label: '氏名',         required: true },
  { key: 'furigana',   label: 'フリガナ' },
  { key: 'age',         label: '年齢',         type: 'number' },
  { key: 'gender',      label: '性別',         type: 'select', options: ['','男','女','その他'] },
  { key: 'phone',       label: '電話番号',     type: 'tel' },
  { key: 'address',     label: '住所' },
  { key: 'symptoms',    label: '症状・主訴',   type: 'textarea' },
  { key: 'insurance',   label: '保険種別',     type: 'select', options: ['','健康保険','介護保険','自費','その他'] },
  { key: 'insuranceNo', label: '保険証番号' },
  { key: 'doctor',      label: '同意医師名' },
  { key: 'hospital',    label: '医療機関名' },
  { key: 'notes',       label: '備考',         type: 'textarea' },
]

function emptyPatient() {
  return { id: '', name: '', furigana: '', age: '', gender: '', phone: '', address: '', symptoms: '', insurance: '', insuranceNo: '', doctor: '', hospital: '', notes: '' }
}

function PatientForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || emptyPatient())
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  return (
    <div style={s.card}>
      {PATIENT_FIELDS.map(({ key, label, type, options, required }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={s.label}>{label}{required && <span style={{ color: '#c00' }}> *</span>}</label>
          {type === 'textarea' ? (
            <textarea value={data[key]} onChange={e => set(key, e.target.value)}
              style={{ ...s.input, height: 72, resize: 'vertical' }} />
          ) : type === 'select' ? (
            <select value={data[key]} onChange={e => set(key, e.target.value)} style={s.input}>
              {options.map(o => <option key={o} value={o}>{o || '選択...'}</option>)}
            </select>
          ) : (
            <input type={type || 'text'} value={data[key]} onChange={e => set(key, e.target.value)} style={s.input} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => { if (!data.name.trim()) { alert('氏名は必須です'); return } onSave(data) }}
          style={{ ...s.btn(), flex: 1 }}>
          <Save size={15} /> 保存
        </button>
        <button onClick={onCancel} style={{ ...s.btn(C.gray2, C.sumi), flex: 1 }}>
          <XCircle size={15} /> キャンセル
        </button>
      </div>
    </div>
  )
}

function PatientsScreen({ navigate }) {
  const [patients, setPatients]   = useState(() => LS.get('patients', []))
  const [search, setSearch]       = useState('')
  const [editing, setEditing]     = useState(null)
  const [adding, setAdding]       = useState(false)

  const save = (ps) => { setPatients(ps); LS.set('patients', ps) }

  const handleSave = (data) => {
    if (data.id) {
      save(patients.map(p => p.id === data.id ? data : p))
    } else {
      save([...patients, { ...data, id: 'p' + Date.now() }])
    }
    setEditing(null); setAdding(false)
  }

  const handleDelete = (id) => {
    if (!confirm('この患者を削除しますか？')) return
    save(patients.filter(p => p.id !== id))
  }

  const filtered = patients.filter(p =>
    !search || p.name.includes(search) || p.furigana.includes(search) || p.phone?.includes(search)
  )

  return (
    <div style={s.pageWrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => navigate('home')} style={{ ...s.btn(C.gray2, C.sumi) }}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>患者マスタ</h2>
        <button onClick={() => { setAdding(true); setEditing(null) }} style={s.btn()}>
          <Plus size={15} /> 新規
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.gray3 }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="氏名・フリガナ・電話で検索" style={{ ...s.input, paddingLeft: 30 }} />
      </div>

      {adding && (
        <PatientForm initial={emptyPatient()} onSave={handleSave} onCancel={() => setAdding(false)} />
      )}

      {filtered.length === 0 && !adding && (
        <div style={{ ...s.card, textAlign: 'center', padding: 32, color: C.gray3 }}>患者が見つかりません</div>
      )}

      {filtered.map(p => (
        editing?.id === p.id ? (
          <PatientForm key={p.id} initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        ) : (
          <div key={p.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.gray3 }}>{p.furigana}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {p.age && `${p.age}歳`}{p.gender && `・${p.gender}`}{p.insurance && ` ／ ${p.insurance}`}
                </div>
                {p.symptoms && <div style={{ fontSize: 12, color: C.ai, marginTop: 4 }}>症状: {p.symptoms}</div>}
                {p.phone && <div style={{ fontSize: 12, color: C.gray3 }}>{p.phone}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setEditing(p); setAdding(false) }}
                  style={{ ...s.btn(C.gray1, C.sumi), padding: '6px 10px' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)}
                  style={{ ...s.btn('#fee', '#c00'), padding: '6px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  )
}

// ── 施術者マスタ ─────────────────────────────────────────────
const THERAPIST_FIELDS = [
  { key: 'name',          label: '氏名',       required: true },
  { key: 'furigana',      label: 'フリガナ' },
  { key: 'qualification', label: '資格',       type: 'select',
    options: ['', 'あん摩マッサージ指圧師', 'はり師', 'きゅう師',
              'あん摩マッサージ指圧師・はり師', 'あん摩マッサージ指圧師・はり師・きゅう師', 'その他'] },
  { key: 'phone',   label: '電話番号', type: 'tel' },
  { key: 'active',  label: '稼働状況', type: 'select', options: ['true', 'false'] },
  { key: 'notes',   label: '備考',     type: 'textarea' },
]

function emptyTherapist() {
  return { id: '', name: '', furigana: '', qualification: '', phone: '', active: 'true', notes: '' }
}

function TherapistForm({ initial, onSave, onCancel }) {
  const [data, setData] = useState(initial || emptyTherapist())
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  return (
    <div style={s.card}>
      {THERAPIST_FIELDS.map(({ key, label, type, options, required }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={s.label}>{label}{required && <span style={{ color: '#c00' }}> *</span>}</label>
          {type === 'textarea' ? (
            <textarea value={data[key]} onChange={e => set(key, e.target.value)}
              style={{ ...s.input, height: 60, resize: 'vertical' }} />
          ) : type === 'select' && key === 'active' ? (
            <select value={String(data[key])} onChange={e => set(key, e.target.value)} style={s.input}>
              <option value="true">稼働中</option>
              <option value="false">休止中</option>
            </select>
          ) : type === 'select' ? (
            <select value={data[key]} onChange={e => set(key, e.target.value)} style={s.input}>
              {options.map(o => <option key={o} value={o}>{o || '選択...'}</option>)}
            </select>
          ) : (
            <input type={type || 'text'} value={data[key]} onChange={e => set(key, e.target.value)} style={s.input} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => { if (!data.name.trim()) { alert('氏名は必須です'); return } onSave(data) }}
          style={{ ...s.btn(), flex: 1 }}>
          <Save size={15} /> 保存
        </button>
        <button onClick={onCancel} style={{ ...s.btn(C.gray2, C.sumi), flex: 1 }}>
          <XCircle size={15} /> キャンセル
        </button>
      </div>
    </div>
  )
}

function TherapistsScreen({ navigate }) {
  const [therapists, setTherapists] = useState(() => LS.get('therapists', []))
  const [editing, setEditing]       = useState(null)
  const [adding, setAdding]         = useState(false)

  const save = (ts) => { setTherapists(ts); LS.set('therapists', ts) }

  const handleSave = (data) => {
    if (data.id) {
      save(therapists.map(t => t.id === data.id ? data : t))
    } else {
      save([...therapists, { ...data, id: 't' + Date.now() }])
    }
    setEditing(null); setAdding(false)
  }

  const handleDelete = (id) => {
    if (!confirm('この施術者を削除しますか？')) return
    save(therapists.filter(t => t.id !== id))
  }

  return (
    <div style={s.pageWrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => navigate('home')} style={s.btn(C.gray2, C.sumi)}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>施術者マスタ</h2>
        <button onClick={() => { setAdding(true); setEditing(null) }} style={s.btn()}>
          <Plus size={15} /> 新規
        </button>
      </div>

      {adding && (
        <TherapistForm initial={emptyTherapist()} onSave={handleSave} onCancel={() => setAdding(false)} />
      )}

      {therapists.length === 0 && !adding && (
        <div style={{ ...s.card, textAlign: 'center', padding: 32, color: C.gray3 }}>施術者が登録されていません</div>
      )}

      {therapists.map(t => (
        editing?.id === t.id ? (
          <TherapistForm key={t.id} initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        ) : (
          <div key={t.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 99,
                    background: String(t.active) === 'true' ? '#e6f4e6' : C.gray1,
                    color: String(t.active) === 'true' ? '#2a6b2a' : C.gray3,
                  }}>
                    {String(t.active) === 'true' ? '稼働中' : '休止中'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.gray3 }}>{t.furigana}</div>
                {t.qualification && <div style={{ fontSize: 13, color: C.ai, marginTop: 4 }}>{t.qualification}</div>}
                {t.phone && <div style={{ fontSize: 12, color: C.gray3, marginTop: 2 }}>{t.phone}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setEditing(t); setAdding(false) }}
                  style={{ ...s.btn(C.gray1, C.sumi), padding: '6px 10px' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(t.id)}
                  style={{ ...s.btn('#fee', '#c00'), padding: '6px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  )
}

// ── 行程表 ───────────────────────────────────────────────────
function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日','月','火','水','木','金','土']
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${days[d.getDay()]}）`
}

function ScheduleScreen({ navigate }) {
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10))
  const patients            = LS.get('patients', [])
  const therapists          = LS.get('therapists', [])
  const visits              = LS.get('visits', [])
  const reports             = LS.get('reports', [])

  const dayVisits = visits
    .filter(v => v.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const patMap  = Object.fromEntries(patients.map(p => [p.id, p]))
  const theMap  = Object.fromEntries(therapists.map(t => [t.id, t]))
  const repMap  = Object.fromEntries(reports.map(r => [r.visitId, r]))

  return (
    <div style={s.pageWrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => navigate('home')} style={s.btn(C.gray2, C.sumi)}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>行程表</h2>
        <button onClick={() => navigate('report_new', { date })} style={s.btn()}>
          <Plus size={15} /> 日報作成
        </button>
      </div>

      {/* 日付ナビゲーション */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, ...s.card, padding: '10px 12px' }}>
        <button onClick={() => setDate(addDays(date, -1))} style={{ ...s.btn(C.gray1, C.sumi), padding: '6px 12px' }}>‹</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ ...s.input, flex: 1, textAlign: 'center', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600 }} />
        <button onClick={() => setDate(addDays(date, 1))} style={{ ...s.btn(C.gray1, C.sumi), padding: '6px 12px' }}>›</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: C.gray3, marginBottom: 12 }}>{fmtDate(date)}</div>

      {dayVisits.length === 0 && (
        <div style={{ ...s.card, textAlign: 'center', padding: 40, color: C.gray3 }}>
          この日の予定はありません
        </div>
      )}

      {/* タイムライン */}
      {dayVisits.map((v, i) => {
        const p    = patMap[v.patientId]
        const t    = theMap[v.therapistId]
        const done = !!repMap[v.id]
        return (
          <div key={v.id} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            {/* 時刻・線 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ai }}>{v.startTime}</div>
              <div style={{ flex: 1, width: 2, background: C.gray2, margin: '4px 0' }} />
              {i === dayVisits.length - 1 && <div style={{ fontSize: 12, color: C.gray3 }}>{v.endTime}</div>}
            </div>
            {/* カード */}
            <div style={{ flex: 1, ...s.card, marginBottom: 4, borderLeft: `3px solid ${done ? C.kincha : C.ai}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p?.name || '（不明）'}</div>
                  <div style={{ fontSize: 12, color: C.gray3 }}>{v.startTime}〜{v.endTime}（{v.duration}分）</div>
                  {t && <div style={{ fontSize: 12, color: C.ai, marginTop: 2 }}>担当: {t.name}</div>}
                  {p?.symptoms && <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>{p.symptoms}</div>}
                </div>
                <div>
                  {done ? (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#fdf3dc', color: C.kincha, fontWeight: 700 }}>日報済</span>
                  ) : (
                    <button onClick={() => navigate('report_new', { visitId: v.id, date: v.date })}
                      style={{ ...s.btn(), fontSize: 12, padding: '6px 10px' }}>
                      日報作成
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 日報作成 ─────────────────────────────────────────────────
const BODY_PARTS = ['頭部','頸部','肩（右）','肩（左）','肩甲骨周囲（右）','肩甲骨周囲（左）','上肢（右）','上肢（左）','腰背部','臀部（右）','臀部（左）','下肢（右）','下肢（左）','足部（右）','足部（左）']
const TREATMENTS  = ['按摩','マッサージ','指圧','関節可動域訓練','ストレッチ','温罨法','変形徒手矯正術']
const DURATIONS   = [15, 20, 30, 40, 60]

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

// ── 音声入力テキストエリア ────────────────────────────────────
function VoiceTextarea({ label, value, onChange, placeholder }) {
  const [listening, setListening] = useState(false)
  const recogRef = useRef(null)

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const toggleVoice = () => {
    if (!supported) { alert('このブラウザは音声入力に対応していません'); return }
    if (listening) {
      recogRef.current?.stop()
      setListening(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SpeechRecognition()
    recog.lang = 'ja-JP'
    recog.continuous = true
    recog.interimResults = true
    let base = value

    recog.onresult = (e) => {
      let interim = ''
      let final = base
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript
          base = final
        } else {
          interim = e.results[i][0].transcript
        }
      }
      onChange(final + interim)
    }
    recog.onend = () => { setListening(false); onChange(base) }
    recog.onerror = () => { setListening(false) }
    recogRef.current = recog
    recog.start()
    setListening(true)
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ ...s.label, marginBottom: 0 }}>{label}</label>
        <button onClick={toggleVoice} style={{
          border: 'none', background: listening ? '#fee' : C.gray1,
          color: listening ? '#c00' : C.gray3,
          borderRadius: 99, padding: '3px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {listening ? <><MicOff size={12} /> 停止</> : <><Mic size={12} /> 音声</>}
        </button>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...s.input, height: 80, resize: 'vertical', borderColor: listening ? '#c00' : C.gray2 }} />
      {listening && <div style={{ fontSize: 11, color: '#c00', marginTop: 2 }}>● 録音中...</div>}
    </div>
  )
}

function TagSelect({ options, selected, onChange, color }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const active = selected.includes(o)
        return (
          <button key={o} onClick={() => toggle(o)} style={{
            border: `1px solid ${active ? color : C.gray2}`,
            background: active ? color : C.white,
            color: active ? C.white : C.sumi,
            borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: active ? 700 : 400,
          }}>{o}</button>
        )
      })}
    </div>
  )
}

function ReportNewScreen({ navigate, param }) {
  const patients   = LS.get('patients', [])
  const therapists = LS.get('therapists', [])
  const visits     = LS.get('visits', [])

  const initVisit = param?.visitId ? visits.find(v => v.id === param.visitId) : null

  const now      = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const nowTime  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  const [date, setDate]               = useState(initVisit?.date || param?.date || todayStr)
  const [patientId, setPatientId]     = useState(initVisit?.patientId || '')
  const [therapistId, setTherapistId] = useState(initVisit?.therapistId || '')
  const [startTime, setStartTime]     = useState(initVisit?.startTime || nowTime)
  const [duration, setDuration]       = useState(initVisit?.duration || 30)
  const [endTime, setEndTime]         = useState(initVisit?.endTime || addMinutes(nowTime, 30))
  const [bpSys, setBpSys]             = useState('')
  const [bpDia, setBpDia]             = useState('')
  const [pulse, setPulse]             = useState('')
  const [temp, setTemp]               = useState('')
  const [bodyParts, setBodyParts]     = useState([])
  const [treatments, setTreatments]   = useState([])
  const [findings, setFindings]       = useState('')
  const [improvements, setImprovements] = useState('')
  const [nextPlan, setNextPlan]       = useState('')
  const [notes, setNotes]             = useState('')

  const patient = patients.find(p => p.id === patientId)

  const handlePatientChange = (id) => {
    setPatientId(id)
  }

  const handleDuration = (d) => {
    setDuration(d)
    setEndTime(addMinutes(startTime, d))
  }

  const handleStartTime = (t) => {
    setStartTime(t)
    setEndTime(addMinutes(t, duration))
  }

  const handleSave = () => {
    if (!patientId) { alert('患者を選択してください'); return }
    if (!therapistId) { alert('施術者を選択してください'); return }

    const report = {
      id:          'r' + Date.now(),
      visitId:     initVisit?.id || null,
      date, patientId, therapistId,
      startTime, endTime, duration,
      vitals:      { bpSys, bpDia, pulse, temp },
      bodyParts, treatments,
      findings, improvements, nextPlan, notes,
      createdAt:   new Date().toISOString(),
    }

    // 行程表に訪問が無ければ追加
    if (!initVisit) {
      const newVisit = { id: 'v' + Date.now(), date, patientId, therapistId, startTime, endTime, duration }
      LS.set('visits', [...visits, newVisit])
      report.visitId = newVisit.id
    }

    const existing = LS.get('reports', [])
    LS.set('reports', [...existing, report])
    alert('日報を保存しました')
    navigate('reports')
  }

  return (
    <div style={s.pageWrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => navigate('schedule')} style={s.btn(C.gray2, C.sumi)}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>日報作成</h2>
      </div>

      {/* 基本情報 */}
      <div style={s.section}>基本情報</div>
      <div style={s.card}>
        <div style={{ marginBottom: 12 }}>
          <label style={s.label}>日付</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={s.label}>患者 <span style={{ color: '#c00' }}>*</span></label>
          <select value={patientId} onChange={e => handlePatientChange(e.target.value)} style={s.input}>
            <option value="">選択してください</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {patient?.symptoms && (
            <div style={{ fontSize: 12, color: C.ai, marginTop: 6, padding: '6px 8px', background: '#eef2f8', borderRadius: 6 }}>
              症状: {patient.symptoms}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={s.label}>施術者 <span style={{ color: '#c00' }}>*</span></label>
          <select value={therapistId} onChange={e => setTherapistId(e.target.value)} style={s.input}>
            <option value="">選択してください</option>
            {therapists.filter(t => String(t.active) === 'true').map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={s.label}>開始時刻</label>
            <input type="time" value={startTime} onChange={e => handleStartTime(e.target.value)} style={s.input} />
          </div>
          <div>
            <label style={s.label}>終了時刻</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={s.input} />
          </div>
        </div>
        <div>
          <label style={s.label}>施術時間（分）</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => handleDuration(d)} style={{
                border: `1px solid ${duration === d ? C.ai : C.gray2}`,
                background: duration === d ? C.ai : C.white,
                color: duration === d ? C.white : C.sumi,
                borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: duration === d ? 700 : 400,
              }}>{d}分</button>
            ))}
          </div>
        </div>
      </div>

      {/* バイタル */}
      <div style={s.section}>バイタルサイン</div>
      <div style={s.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={s.label}>血圧 収縮期（mmHg）</label>
            <input type="number" value={bpSys} onChange={e => setBpSys(e.target.value)} placeholder="例: 120" style={s.input} />
          </div>
          <div>
            <label style={s.label}>血圧 拡張期（mmHg）</label>
            <input type="number" value={bpDia} onChange={e => setBpDia(e.target.value)} placeholder="例: 80" style={s.input} />
          </div>
          <div>
            <label style={s.label}>脈拍（回/分）</label>
            <input type="number" value={pulse} onChange={e => setPulse(e.target.value)} placeholder="例: 72" style={s.input} />
          </div>
          <div>
            <label style={s.label}>体温（℃）</label>
            <input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} placeholder="例: 36.5" style={s.input} />
          </div>
        </div>
      </div>

      {/* 施術部位 */}
      <div style={s.section}>施術部位</div>
      <div style={s.card}>
        <TagSelect options={BODY_PARTS} selected={bodyParts} onChange={setBodyParts} color={C.ai} />
      </div>

      {/* 施術内容 */}
      <div style={s.section}>施術内容</div>
      <div style={s.card}>
        <TagSelect options={TREATMENTS} selected={treatments} onChange={setTreatments} color={C.kincha} />
      </div>

      {/* 所見・申し送り */}
      <div style={s.section}>所見・記録</div>
      <div style={s.card}>
        <VoiceTextarea label="所見・状態" value={findings} onChange={setFindings}
          placeholder="施術中の状態、反応など" />
        <VoiceTextarea label="改善・変化" value={improvements} onChange={setImprovements}
          placeholder="前回比の変化、改善点など" />
        <VoiceTextarea label="次回計画" value={nextPlan} onChange={setNextPlan}
          placeholder="次回の施術方針、注意点など" />
        <div>
          <label style={s.label}>備考</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="その他、申し送り事項" style={{ ...s.input, height: 60, resize: 'vertical' }} />
        </div>
      </div>

      <button onClick={handleSave} style={{ ...s.btn(), width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
        <Save size={16} /> 日報を保存する
      </button>
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
      case 'schedule':   return <ScheduleScreen navigate={navigate} />
      case 'patients':   return <PatientsScreen navigate={navigate} />
      case 'therapists': return <TherapistsScreen navigate={navigate} />
      case 'report_new': return <ReportNewScreen navigate={navigate} param={param} />
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
