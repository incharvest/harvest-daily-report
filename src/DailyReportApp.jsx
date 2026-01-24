import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, Trash2, Calendar, ChevronDown, ChevronUp, Search, Plus, User, Users, X, Edit2, Check, Clock, Lock, LogOut, Eye, EyeOff, FileText, ChevronLeft, Download, Printer, Shield, Settings, Camera, Image } from 'lucide-react';

export default function DailyReportApp() {
  const [reports, setReports] = useState([]);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [sharedSummaries, setSharedSummaries] = useState([]);
  const [showSharedSummaries, setShowSharedSummaries] = useState(false);
  const [viewingSharedSummary, setViewingSharedSummary] = useState(null);
  const [staffList, setStaffList] = useState([
    { name: '管理者', password: 'admin', isAdmin: true },
    { name: '山田太郎', password: '1234', isAdmin: false },
    { name: '佐藤花子', password: '5678', isAdmin: false },
    { name: '鈴木一郎', password: '9999', isAdmin: false }
  ]);
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedStaffForLogin, setSelectedStaffForLogin] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [filterStaff, setFilterStaff] = useState('all');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffIsAdmin, setNewStaffIsAdmin] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingStaffName, setEditingStaffName] = useState('');
  const [editingStaffPassword, setEditingStaffPassword] = useState('');
  const [editingStaffIsAdmin, setEditingStaffIsAdmin] = useState(false);
  const [currentReport, setCurrentReport] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    staff: '',
    tasks: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSavedSummaries, setShowSavedSummaries] = useState(false);
  const [showAllStaffSummary, setShowAllStaffSummary] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // カスタムカラー
  const colors = {
    primary: 'bg-emerald-800',
    primaryHover: 'hover:bg-emerald-900',
    primaryLight: 'bg-emerald-100',
    primaryLightHover: 'hover:bg-emerald-200',
    primaryText: 'text-emerald-800',
    primaryBorder: 'border-emerald-800',
    accent: 'bg-emerald-600',
    accentHover: 'hover:bg-emerald-700',
    gradient: 'from-emerald-900 via-emerald-800 to-teal-900',
  };

  // 音声認識の初期化
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ja-JP';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentReport(prev => ({
            ...prev,
            tasks: prev.tasks + finalTranscript
          }));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }
  }, [isListening]);

  // 音声入力の開始/停止
  const toggleListening = () => {
    // ブラウザ対応チェック
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showNotificationMsg('お使いのブラウザは音声入力に対応していません。Chrome、Edge、Safariをお使いください。', 'error');
      return;
    }

    // 音声認識オブジェクトがない場合は作成
    if (!recognitionRef.current) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ja-JP';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setCurrentReport(prev => ({
              ...prev,
              tasks: prev.tasks + finalTranscript
            }));
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            showNotificationMsg('マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。', 'error');
          } else if (event.error === 'no-speech') {
            showNotificationMsg('音声が検出されませんでした。もう一度お試しください。', 'error');
          } else {
            showNotificationMsg(`音声認識エラー: ${event.error}`, 'error');
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          if (isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              setIsListening(false);
            }
          }
        };

        recognitionRef.current.onstart = () => {
          showNotificationMsg('音声入力を開始しました。話してください。', 'success');
        };

      } catch (e) {
        showNotificationMsg('音声認識の初期化に失敗しました。', 'error');
        return;
      }
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        showNotificationMsg('音声入力を停止しました。', 'success');
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        showNotificationMsg('音声入力の開始に失敗しました。ページを再読み込みしてお試しください。', 'error');
      }
    }
  };

  // 通知表示
  const showNotificationMsg = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // カメラを開始
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        showNotificationMsg('カメラの使用が許可されていません。ブラウザの設定でカメラを許可してください。', 'error');
      } else if (error.name === 'NotFoundError') {
        showNotificationMsg('カメラが見つかりません。', 'error');
      } else {
        showNotificationMsg('カメラの起動に失敗しました。', 'error');
      }
    }
  };

  // カメラを停止
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // 写真を撮影
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      const newPhoto = {
        id: `photo-${Date.now()}`,
        data: photoData,
        timestamp: new Date().toISOString()
      };
      setPhotos(prev => [...prev, newPhoto]);
      showNotificationMsg('写真を撮影しました');
    }
  };

  // 写真を削除
  const deletePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    showNotificationMsg('写真を削除しました');
  };

  // ファイルから写真を追加
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const newPhoto = {
              id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              data: event.target.result,
              timestamp: new Date().toISOString()
            };
            setPhotos(prev => [...prev, newPhoto]);
          };
          reader.readAsDataURL(file);
        }
      });
      showNotificationMsg('写真を追加しました');
    }
    e.target.value = '';
  };

  // ログイン処理
  const handleLogin = () => {
    const staff = staffList.find(s => s.name === selectedStaffForLogin);
    if (staff && staff.password === passwordInput) {
      setLoggedInStaff(staff.name);
      setIsAdmin(staff.isAdmin);
      setCurrentReport(prev => ({ ...prev, staff: staff.name }));
      setPasswordInput('');
      setSelectedStaffForLogin(null);
      setLoginError('');
      showNotificationMsg(`${staff.name}さん、ようこそ！${staff.isAdmin ? '（管理者）' : ''}`);
    } else {
      setLoginError('パスワードが正しくありません');
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    setLoggedInStaff(null);
    setIsAdmin(false);
    setShowSummary(false);
    setShowSavedSummaries(false);
    setShowAdminPanel(false);
    setCurrentReport({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      staff: '',
      tasks: ''
    });
    showNotificationMsg('ログアウトしました');
  };

  // 職員の追加
  const addStaff = () => {
    if (!newStaffName.trim()) {
      showNotificationMsg('職員名を入力してください', 'error');
      return;
    }
    if (!newStaffPassword.trim()) {
      showNotificationMsg('パスワードを入力してください', 'error');
      return;
    }
    if (staffList.find(s => s.name === newStaffName.trim())) {
      showNotificationMsg('この職員名は既に登録されています', 'error');
      return;
    }
    setStaffList([...staffList, {
      name: newStaffName.trim(),
      password: newStaffPassword.trim(),
      isAdmin: newStaffIsAdmin
    }]);
    setNewStaffName('');
    setNewStaffPassword('');
    setNewStaffIsAdmin(false);
    showNotificationMsg('職員を追加しました');
  };

  // 職員の削除
  const removeStaff = (name) => {
    const staff = staffList.find(s => s.name === name);
    if (staff?.isAdmin && staffList.filter(s => s.isAdmin).length <= 1) {
      showNotificationMsg('最後の管理者は削除できません', 'error');
      return;
    }
    setStaffList(staffList.filter(s => s.name !== name));
    if (loggedInStaff === name) {
      handleLogout();
    }
    if (filterStaff === name) setFilterStaff('all');
    showNotificationMsg('職員を削除しました');
  };

  // 職員名の編集開始
  const startEditStaff = (staff) => {
    setEditingStaff(staff.name);
    setEditingStaffName(staff.name);
    setEditingStaffPassword(staff.password);
    setEditingStaffIsAdmin(staff.isAdmin);
  };

  // 職員名の編集保存
  const saveEditStaff = () => {
    if (!editingStaffName.trim()) {
      showNotificationMsg('職員名を入力してください', 'error');
      return;
    }
    if (!editingStaffPassword.trim()) {
      showNotificationMsg('パスワードを入力してください', 'error');
      return;
    }
    if (editingStaffName !== editingStaff && staffList.find(s => s.name === editingStaffName.trim())) {
      showNotificationMsg('この職員名は既に登録されています', 'error');
      return;
    }

    const currentStaff = staffList.find(s => s.name === editingStaff);
    if (currentStaff?.isAdmin && !editingStaffIsAdmin && staffList.filter(s => s.isAdmin).length <= 1) {
      showNotificationMsg('最後の管理者の権限は外せません', 'error');
      return;
    }

    setStaffList(staffList.map(s => s.name === editingStaff
      ? { name: editingStaffName.trim(), password: editingStaffPassword.trim(), isAdmin: editingStaffIsAdmin }
      : s
    ));
    setReports(reports.map(r => r.staff === editingStaff ? { ...r, staff: editingStaffName.trim() } : r));

    if (loggedInStaff === editingStaff) {
      setLoggedInStaff(editingStaffName.trim());
      setIsAdmin(editingStaffIsAdmin);
    }
    if (filterStaff === editingStaff) setFilterStaff(editingStaffName.trim());
    if (currentReport.staff === editingStaff) {
      setCurrentReport(prev => ({ ...prev, staff: editingStaffName.trim() }));
    }

    setEditingStaff(null);
    setEditingStaffName('');
    setEditingStaffPassword('');
    setEditingStaffIsAdmin(false);
    showNotificationMsg('職員情報を更新しました');
  };

  // 日報の保存
  const saveReport = () => {
    if (!currentReport.staff) {
      showNotificationMsg('ログインしてください', 'error');
      return;
    }
    if (!currentReport.tasks && photos.length === 0) {
      showNotificationMsg('報告内容または写真を追加してください', 'error');
      return;
    }

    const now = new Date();
    const reportToSave = {
      ...currentReport,
      photos: [...photos],
      id: currentReport.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      savedAt: now.toISOString()
    };

    const existingIndex = reports.findIndex(r => r.id === reportToSave.id);

    if (existingIndex >= 0) {
      const newReports = [...reports];
      newReports[existingIndex] = { ...reportToSave, updatedAt: now.toISOString() };
      setReports(newReports);
    } else {
      setReports([{ ...reportToSave, createdAt: now.toISOString() }, ...reports]);
    }
    showNotificationMsg('日報を保存しました');
  };

  // 日報のクリア
  const clearReport = () => {
    const now = new Date();
    setCurrentReport({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      staff: loggedInStaff || '',
      tasks: ''
    });
    setPhotos([]);
  };

  // 現在時刻をセット
  const setCurrentTime = () => {
    const now = new Date();
    setCurrentReport(prev => ({ ...prev, time: now.toTimeString().slice(0, 5) }));
  };

  // 過去の日報を読み込み
  const loadReport = (report) => {
    if (report.staff !== loggedInStaff && !isAdmin) {
      showNotificationMsg('他の職員の日報は編集できません', 'error');
      return;
    }
    setCurrentReport(report);
    setPhotos(report.photos || []);
    setShowHistory(false);
  };

  // 日報の削除
  const deleteReport = (id, staff, e) => {
    e.stopPropagation();
    if (staff !== loggedInStaff && !isAdmin) {
      showNotificationMsg('他の職員の日報は削除できません', 'error');
      return;
    }
    setReports(reports.filter(r => r.id !== id));
    showNotificationMsg('日報を削除しました');
  };

  // 検索・フィルター
  const filteredReports = reports.filter(report => {
    const matchesStaff = filterStaff === 'all' || report.staff === filterStaff;
    const matchesSearch =
      report.tasks.includes(searchQuery) ||
      report.date.includes(searchQuery) ||
      report.staff.includes(searchQuery);
    return matchesStaff && matchesSearch;
  });

  // 職員ごとの日報数を取得
  const getReportCount = (staffName) => {
    return reports.filter(r => r.staff === staffName).length;
  };

  // 日付のフォーマット
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}(${weekdays[date.getDay()]})`;
  };

  // 指定日の報告をまとめて取得
  const getSummaryReports = () => {
    return reports
      .filter(r => r.date === summaryDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // 日付ごとの報告がある日を取得
  const getReportDates = () => {
    const dates = [...new Set(reports.map(r => r.date))];
    return dates.sort((a, b) => b.localeCompare(a));
  };

  // 全職員のまとめデータを取得
  const getAllStaffSummaryData = () => {
    const summaryReports = getSummaryReports();
    const staffSummary = staffList.map(staff => {
      const staffReports = summaryReports.filter(r => r.staff === staff.name);
      return {
        name: staff.name,
        isAdmin: staff.isAdmin,
        reports: staffReports,
        hasReport: staffReports.length > 0,
        totalPhotos: staffReports.reduce((acc, r) => acc + (r.photos?.length || 0), 0)
      };
    });
    return staffSummary;
  };

  // 全員まとめをテキストダウンロード
  const downloadAllStaffSummary = () => {
    const allStaffData = getAllStaffSummaryData();
    const summaryReports = getSummaryReports();

    if (summaryReports.length === 0) {
      showNotificationMsg('ダウンロードする報告がありません', 'error');
      return;
    }

    let content = `デイサービスハーベスト 全職員日報まとめ\n`;
    content += `日付: ${formatDate(summaryDate)}\n`;
    content += `${'='.repeat(60)}\n\n`;

    allStaffData.forEach(staff => {
      content += `■ ${staff.name}${staff.isAdmin ? ' (管理者)' : ''}\n`;
      content += `${'─'.repeat(40)}\n`;

      if (staff.reports.length === 0) {
        content += `  報告なし\n\n`;
      } else {
        staff.reports.forEach((report, idx) => {
          content += `  [${report.time}]\n`;
          content += `  ${report.tasks.split('\n').join('\n  ')}\n`;
          if (report.photos?.length > 0) {
            content += `  📷 添付写真: ${report.photos.length}枚\n`;
          }
          content += `\n`;
        });
      }
    });

    content += `${'='.repeat(60)}\n`;
    content += `報告状況サマリー\n`;
    content += `${'─'.repeat(40)}\n`;
    const reportedCount = allStaffData.filter(s => s.hasReport).length;
    content += `報告済み: ${reportedCount}名 / 全${staffList.length}名\n`;
    allStaffData.forEach(staff => {
      content += `  ${staff.hasReport ? '✓' : '−'} ${staff.name}: ${staff.reports.length}件`;
      if (staff.totalPhotos > 0) {
        content += ` (写真${staff.totalPhotos}枚)`;
      }
      content += `\n`;
    });
    content += `\n作成日時: ${new Date().toLocaleString('ja-JP')}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ハーベスト全員日報_${summaryDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotificationMsg('全員まとめをダウンロードしました');
  };

  // 全員まとめを印刷
  const printAllStaffSummary = () => {
    const allStaffData = getAllStaffSummaryData();
    const summaryReports = getSummaryReports();

    if (summaryReports.length === 0) {
      showNotificationMsg('印刷する報告がありません', 'error');
      return;
    }

    const reportedCount = allStaffData.filter(s => s.hasReport).length;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>全職員日報まとめ - ${formatDate(summaryDate)}</title>
        <style>
          body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; border-bottom: 3px solid #065f46; padding-bottom: 10px; color: #065f46; font-size: 18px; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
          .staff-section { margin: 15px 0; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; page-break-inside: avoid; }
          .staff-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #065f46; }
          .staff-name { font-weight: bold; font-size: 16px; color: #065f46; }
          .staff-badge { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
          .no-report { color: #9ca3af; font-style: italic; padding: 10px; }
          .report-item { margin: 10px 0; padding: 10px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #065f46; }
          .report-time { color: #065f46; font-weight: bold; margin-bottom: 5px; }
          .report-content { white-space: pre-wrap; line-height: 1.5; }
          .photo-count { color: #666; font-size: 11px; margin-top: 5px; }
          .summary-box { margin-top: 30px; padding: 15px; background: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; }
          .summary-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #065f46; }
          .summary-stats { font-size: 14px; margin-bottom: 10px; }
          .summary-item { margin: 3px 0; }
          .footer { margin-top: 20px; text-align: right; color: #666; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .staff-section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>デイサービスハーベスト<br/>全職員日報まとめ</h1>
        <div class="subtitle">${formatDate(summaryDate)}</div>

        ${allStaffData.map(staff => `
          <div class="staff-section">
            <div class="staff-header">
              <span class="staff-name">${staff.name}</span>
              ${staff.isAdmin ? '<span class="staff-badge">管理者</span>' : ''}
              <span style="margin-left: auto; color: #666;">${staff.reports.length}件の報告</span>
            </div>
            ${staff.reports.length === 0
              ? '<div class="no-report">この日の報告はありません</div>'
              : staff.reports.map(report => `
                <div class="report-item">
                  <div class="report-time">🕐 ${report.time}</div>
                  <div class="report-content">${report.tasks}</div>
                  ${report.photos?.length > 0 ? `<div class="photo-count">📷 添付写真: ${report.photos.length}枚</div>` : ''}
                </div>
              `).join('')
            }
          </div>
        `).join('')}

        <div class="summary-box">
          <div class="summary-title">📊 報告状況サマリー</div>
          <div class="summary-stats">報告済み: <strong>${reportedCount}名</strong> / 全${staffList.length}名</div>
          ${allStaffData.map(staff => `
            <div class="summary-item">
              ${staff.hasReport ? '✓' : '−'} ${staff.name}: ${staff.reports.length}件
              ${staff.totalPhotos > 0 ? `(写真${staff.totalPhotos}枚)` : ''}
            </div>
          `).join('')}
        </div>

        <div class="footer">作成日時: ${new Date().toLocaleString('ja-JP')}</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // 全員まとめを共有保存
  const saveSharedSummary = () => {
    const allStaffData = getAllStaffSummaryData();
    const summaryReports = getSummaryReports();

    if (summaryReports.length === 0) {
      showNotificationMsg('保存する報告がありません', 'error');
      return;
    }

    const existingIndex = sharedSummaries.findIndex(s => s.date === summaryDate);
    const now = new Date();
    const reportedCount = allStaffData.filter(s => s.hasReport).length;

    const sharedData = {
      id: `shared-${summaryDate}`,
      date: summaryDate,
      staffData: allStaffData,
      totalReports: summaryReports.length,
      reportedStaffCount: reportedCount,
      totalStaffCount: staffList.length,
      savedAt: now.toISOString(),
      savedBy: loggedInStaff,
      lastViewedBy: []
    };

    if (existingIndex >= 0) {
      const newShared = [...sharedSummaries];
      newShared[existingIndex] = { ...sharedData, lastViewedBy: sharedSummaries[existingIndex].lastViewedBy };
      setSharedSummaries(newShared);
      showNotificationMsg('共有まとめを更新しました');
    } else {
      setSharedSummaries([sharedData, ...sharedSummaries]);
      showNotificationMsg('共有まとめを保存しました。全員が閲覧できます。');
    }
    setShowAllStaffSummary(false);
  };

  // 共有まとめを閲覧
  const viewSharedSummary = (summary) => {
    // 閲覧履歴を更新
    const now = new Date().toISOString();
    const updatedSummaries = sharedSummaries.map(s => {
      if (s.id === summary.id) {
        const viewedBy = s.lastViewedBy.filter(v => v.name !== loggedInStaff);
        viewedBy.push({ name: loggedInStaff, viewedAt: now });
        return { ...s, lastViewedBy: viewedBy };
      }
      return s;
    });
    setSharedSummaries(updatedSummaries);
    setViewingSharedSummary({ ...summary, lastViewedBy: [...summary.lastViewedBy.filter(v => v.name !== loggedInStaff), { name: loggedInStaff, viewedAt: now }] });
    setShowSharedSummaries(false);
  };

  // 共有まとめを削除
  const deleteSharedSummary = (id, e) => {
    e.stopPropagation();
    if (!isAdmin) {
      showNotificationMsg('管理者のみ削除できます', 'error');
      return;
    }
    if (window.confirm('この共有まとめを削除しますか？全員が閲覧できなくなります。')) {
      setSharedSummaries(sharedSummaries.filter(s => s.id !== id));
      showNotificationMsg('共有まとめを削除しました');
    }
  };

  // 日報まとめを保存
  const saveDailySummary = () => {
    const summaryReports = getSummaryReports();
    if (summaryReports.length === 0) {
      showNotificationMsg('保存する報告がありません', 'error');
      return;
    }

    const existingIndex = savedSummaries.findIndex(s => s.date === summaryDate);
    const now = new Date();

    const summaryData = {
      id: `summary-${summaryDate}`,
      date: summaryDate,
      reports: summaryReports,
      staffStatus: staffList.map(staff => ({
        name: staff.name,
        hasReport: summaryReports.some(r => r.staff === staff.name)
      })),
      savedAt: now.toISOString(),
      savedBy: loggedInStaff
    };

    if (existingIndex >= 0) {
      const newSummaries = [...savedSummaries];
      newSummaries[existingIndex] = summaryData;
      setSavedSummaries(newSummaries);
      showNotificationMsg('日報まとめを更新しました');
    } else {
      setSavedSummaries([summaryData, ...savedSummaries]);
      showNotificationMsg('日報まとめを保存しました');
    }
  };

  // テキストファイルとしてダウンロード
  const downloadAsText = () => {
    const summaryReports = getSummaryReports();
    if (summaryReports.length === 0) {
      showNotificationMsg('ダウンロードする報告がありません', 'error');
      return;
    }

    let content = `デイサービスハーベスト 日報まとめ - ${formatDate(summaryDate)}\n`;
    content += `${'='.repeat(50)}\n\n`;

    summaryReports.forEach((report, index) => {
      content += `【${index + 1}】 ${report.staff} (${report.time})\n`;
      content += `${'-'.repeat(30)}\n`;
      content += `${report.tasks}\n\n`;
    });

    content += `${'='.repeat(50)}\n`;
    content += `報告状況:\n`;
    staffList.forEach(staff => {
      const hasReport = summaryReports.some(r => r.staff === staff.name);
      content += `  ${hasReport ? '✓' : '−'} ${staff.name}${staff.isAdmin ? ' (管理者)' : ''}\n`;
    });
    content += `\n作成日時: ${new Date().toLocaleString('ja-JP')}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ハーベスト日報_${summaryDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotificationMsg('テキストファイルをダウンロードしました');
  };

  // 印刷用表示
  const handlePrint = () => {
    const summaryReports = getSummaryReports();
    if (summaryReports.length === 0) {
      showNotificationMsg('印刷する報告がありません', 'error');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>デイサービスハーベスト 日報まとめ - ${formatDate(summaryDate)}</title>
        <style>
          body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 20px; }
          h1 { text-align: center; border-bottom: 3px solid #065f46; padding-bottom: 10px; color: #065f46; font-size: 18px; }
          .report { margin: 20px 0; padding: 15px; border: 1px solid #d1d5db; border-left: 4px solid #065f46; border-radius: 8px; }
          .report-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .report-number { background: #065f46; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
          .report-staff { font-weight: bold; font-size: 16px; color: #065f46; }
          .report-time { color: #666; }
          .report-content { white-space: pre-wrap; line-height: 1.6; }
          .status { margin-top: 30px; padding: 15px; background: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; }
          .status-title { font-weight: bold; margin-bottom: 10px; color: #065f46; }
          .status-item { margin: 5px 0; }
          .footer { margin-top: 20px; text-align: right; color: #666; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>デイサービスハーベスト 日報まとめ<br/>${formatDate(summaryDate)}</h1>
        ${summaryReports.map((report, index) => `
          <div class="report">
            <div class="report-header">
              <div class="report-number">${index + 1}</div>
              <div class="report-staff">${report.staff}</div>
              <div class="report-time">🕐 ${report.time}</div>
            </div>
            <div class="report-content">${report.tasks}</div>
          </div>
        `).join('')}
        <div class="status">
          <div class="status-title">報告状況</div>
          ${staffList.map(staff => {
            const hasReport = summaryReports.some(r => r.staff === staff.name);
            return `<div class="status-item">${hasReport ? '✓' : '−'} ${staff.name}${staff.isAdmin ? ' (管理者)' : ''}</div>`;
          }).join('')}
        </div>
        <div class="footer">作成日時: ${new Date().toLocaleString('ja-JP')}</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // 保存済みまとめを削除
  const deleteSavedSummary = (date, e) => {
    e.stopPropagation();
    if (!isAdmin) {
      showNotificationMsg('管理者のみ削除できます', 'error');
      return;
    }
    setSavedSummaries(savedSummaries.filter(s => s.date !== date));
    showNotificationMsg('保存済みまとめを削除しました');
  };

  // 保存済みまとめを表示
  const viewSavedSummary = (summary) => {
    setSummaryDate(summary.date);
    setShowSavedSummaries(false);
  };

  // 全日報を削除
  const clearAllReports = () => {
    if (window.confirm('全ての日報を削除しますか？この操作は取り消せません。')) {
      setReports([]);
      showNotificationMsg('全ての日報を削除しました');
    }
  };

  // 全保存済みまとめを削除
  const clearAllSummaries = () => {
    if (window.confirm('全ての保存済みまとめを削除しますか？この操作は取り消せません。')) {
      setSavedSummaries([]);
      showNotificationMsg('全ての保存済みまとめを削除しました');
    }
  };

  // ログイン画面
  if (!loggedInStaff) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} p-4 flex items-center justify-center`}>
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md border border-emerald-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FileText size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-emerald-900 leading-tight">マッサージ・リハビリ重視型<br/>デイサービスハーベスト</h1>
            <p className="text-emerald-600 text-sm mt-2">日報管理システム</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-emerald-800 mb-3 block">職員を選択してください</label>
            <div className="grid grid-cols-2 gap-2">
              {staffList.map(staff => (
                <button
                  key={staff.name}
                  onClick={() => {
                    setSelectedStaffForLogin(staff.name);
                    setPasswordInput('');
                    setLoginError('');
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 border-2 ${
                    selectedStaffForLogin === staff.name
                      ? staff.isAdmin
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg'
                        : 'bg-emerald-700 text-white border-emerald-700 shadow-lg'
                      : staff.isAdmin
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100'
                  }`}
                >
                  {staff.isAdmin ? <Shield size={18} /> : <User size={18} />}
                  <span className="truncate font-medium">{staff.name}</span>
                </button>
              ))}
            </div>
            {staffList.length === 0 && (
              <p className="text-emerald-600 text-sm text-center py-4">職員が登録されていません</p>
            )}
          </div>

          {selectedStaffForLogin && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="text-sm font-medium text-emerald-800 mb-2 block">パスワード</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="パスワードを入力..."
                    className="w-full px-4 py-3 pr-12 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {loginError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <X size={14} />
                    {loginError}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Lock size={20} />
                ログイン
              </button>
            </div>
          )}
        </div>

        {/* 通知 */}
        {notification && (
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  // 管理者パネル
  if (showAdminPanel && isAdmin) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} p-4`}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 mb-4 border border-emerald-200">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowAdminPanel(false)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
              >
                <ChevronLeft size={18} />
                戻る
              </button>
              <h1 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                <Shield size={24} className="text-amber-500" />
                管理者パネル
              </h1>
              <div></div>
            </div>

            {/* 職員管理 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2 border-b-2 border-emerald-200 pb-2">
                <Users size={20} />
                職員管理
              </h2>

              {/* 新規職員追加 */}
              <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200">
                <h3 className="text-sm font-medium text-emerald-800 mb-3">新規職員追加</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="職員名..."
                    className="w-full px-4 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <input
                    type="text"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="パスワード..."
                    className="w-full px-4 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={newStaffIsAdmin}
                      onChange={(e) => setNewStaffIsAdmin(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-emerald-700">管理者権限を付与</span>
                  </label>
                  <button
                    onClick={addStaff}
                    className="w-full px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors font-medium"
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* 職員リスト */}
              <div className="space-y-2">
                {staffList.map(staff => (
                  <div
                    key={staff.name}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                      staff.isAdmin ? 'bg-amber-50 border-amber-200' : 'bg-white border-emerald-200'
                    }`}
                  >
                    {editingStaff === staff.name ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editingStaffName}
                          onChange={(e) => setEditingStaffName(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-500"
                          placeholder="職員名"
                        />
                        <input
                          type="text"
                          value={editingStaffPassword}
                          onChange={(e) => setEditingStaffPassword(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-500"
                          placeholder="パスワード"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingStaffIsAdmin}
                            onChange={(e) => setEditingStaffIsAdmin(e.target.checked)}
                            className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                          />
                          <span className="text-sm text-emerald-700">管理者権限</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditStaff}
                            className="flex-1 p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-sm font-medium"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => { setEditingStaff(null); setEditingStaffName(''); setEditingStaffPassword(''); setEditingStaffIsAdmin(false); }}
                            className="flex-1 p-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors text-sm font-medium"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          {staff.isAdmin ? (
                            <Shield size={20} className="text-amber-500" />
                          ) : (
                            <User size={20} className="text-emerald-600" />
                          )}
                          <div>
                            <span className="font-medium text-emerald-900">{staff.name}</span>
                            {staff.isAdmin && (
                              <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full font-medium">
                                管理者
                              </span>
                            )}
                            <span className="text-sm text-emerald-500 ml-2">({getReportCount(staff.name)}件)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditStaff(staff)}
                            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => removeStaff(staff.name)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* データ管理 */}
            <div>
              <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2 border-b-2 border-emerald-200 pb-2">
                <Settings size={20} />
                データ管理
              </h2>
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <p className="text-sm text-red-700 mb-4 flex items-center gap-2">
                  <X size={16} />
                  以下の操作は取り消せません
                </p>
                <div className="space-y-2">
                  <button
                    onClick={clearAllReports}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 size={18} />
                    全日報を削除 ({reports.length}件)
                  </button>
                  <button
                    onClick={clearAllSummaries}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 size={18} />
                    全保存済みまとめを削除 ({savedSummaries.length}件)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 通知 */}
        {notification && (
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  // まとめ閲覧画面
  if (showSummary) {
    const summaryReports = getSummaryReports();
    const reportDates = getReportDates();
    const isSaved = savedSummaries.some(s => s.date === summaryDate);

    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} p-4`}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 mb-4 border border-emerald-200">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowSummary(false)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
              >
                <ChevronLeft size={18} />
                戻る
              </button>
              <h1 className="text-xl font-bold text-emerald-900">📋 報告まとめ</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllStaffSummary(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
                >
                  <Users size={18} />
                  <span className="hidden sm:inline">全員</span>
                </button>
                <button
                  onClick={() => setShowSavedSummaries(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                >
                  <FileText size={18} />
                  <span className="hidden sm:inline">保存済</span>
                  {savedSummaries.length > 0 && (
                    <span className="bg-emerald-700 text-white text-xs px-2 py-0.5 rounded-full">
                      {savedSummaries.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 日付選択 */}
            <div className="mb-6">
              <label className="text-sm font-medium text-emerald-800 mb-2 block">日付を選択</label>
              <input
                type="date"
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {reportDates.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-emerald-600 mb-2">報告がある日:</p>
                  <div className="flex flex-wrap gap-2">
                    {reportDates.slice(0, 7).map(date => (
                      <button
                        key={date}
                        onClick={() => setSummaryDate(date)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all font-medium ${
                          summaryDate === date
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 報告一覧タイトル */}
            <div className="border-b-2 border-emerald-200 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-emerald-900">
                    {formatDate(summaryDate)} の報告
                  </h2>
                  <p className="text-sm text-emerald-600">{summaryReports.length}件の報告</p>
                </div>
                {isSaved && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full flex items-center gap-1 font-medium">
                    <Check size={14} />
                    保存済み
                  </span>
                )}
              </div>
            </div>

            {/* 報告一覧 */}
            {summaryReports.length === 0 ? (
              <div className="text-center py-12 text-emerald-500">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>この日の報告はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summaryReports.map((report, index) => (
                  <div
                    key={report.id}
                    className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50"
                  >
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-200">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-emerald-700 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-bold text-emerald-900">{report.staff}</span>
                          <div className="flex items-center gap-1 text-sm text-emerald-600">
                            <Clock size={14} />
                            {report.time}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-emerald-800 leading-relaxed">
                      {report.tasks}
                    </div>
                    {report.photos && report.photos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <p className="text-sm text-emerald-600 mb-2 flex items-center gap-1">
                          <Image size={14} />
                          添付写真 ({report.photos.length}枚)
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {report.photos.map(photo => (
                            <img
                              key={photo.id}
                              src={photo.data}
                              alt="添付写真"
                              className="w-full h-16 object-cover rounded-lg border border-emerald-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 全職員の報告状況 */}
            {summaryReports.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-emerald-200">
                <h3 className="text-sm font-medium text-emerald-800 mb-2">報告済み職員</h3>
                <div className="flex flex-wrap gap-2">
                  {staffList.map(staff => {
                    const hasReport = summaryReports.some(r => r.staff === staff.name);
                    return (
                      <span
                        key={staff.name}
                        className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 font-medium ${
                          hasReport
                            ? 'bg-emerald-200 text-emerald-800'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {staff.isAdmin && <Shield size={12} />}
                        {hasReport ? '✓' : '−'} {staff.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 保存・ダウンロードボタン */}
            {summaryReports.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-emerald-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={saveDailySummary}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors font-medium"
                  >
                    <Save size={18} />
                    {isSaved ? '更新する' : '保存する'}
                  </button>
                  <button
                    onClick={downloadAsText}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
                  >
                    <Download size={18} />
                    ダウンロード
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Printer size={18} />
                    印刷
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 保存済みまとめ一覧モーダル */}
        {showSavedSummaries && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-emerald-900">📁 保存済み日報まとめ</h2>
                <button
                  onClick={() => setShowSavedSummaries(false)}
                  className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {savedSummaries.length === 0 ? (
                <div className="text-center py-8 text-emerald-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>保存された日報まとめはありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedSummaries.map(summary => (
                    <div
                      key={summary.id}
                      onClick={() => viewSavedSummary(summary)}
                      className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 cursor-pointer transition-colors border border-emerald-200"
                    >
                      <div>
                        <div className="font-medium text-emerald-900">{formatDate(summary.date)}</div>
                        <div className="text-sm text-emerald-600">
                          {summary.reports.length}件の報告 ・ 保存者: {summary.savedBy}
                        </div>
                        <div className="text-xs text-emerald-400 mt-1">
                          {new Date(summary.savedAt).toLocaleString('ja-JP')}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={(e) => deleteSavedSummary(summary.date, e)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 全職員まとめモーダル */}
        {showAllStaffSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-emerald-200 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-emerald-200">
                <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <Users size={24} className="text-amber-500" />
                  全職員日報まとめ
                </h2>
                <button
                  onClick={() => setShowAllStaffSummary(false)}
                  className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 border-b border-emerald-200 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600">対象日</p>
                    <p className="font-bold text-emerald-900 text-lg">{formatDate(summaryDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-600">報告状況</p>
                    <p className="font-bold text-emerald-900 text-lg">
                      {getAllStaffSummaryData().filter(s => s.hasReport).length} / {staffList.length}名
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {getAllStaffSummaryData().map(staff => (
                    <div
                      key={staff.name}
                      className={`border-2 rounded-xl overflow-hidden ${
                        staff.hasReport ? 'border-emerald-200' : 'border-gray-200'
                      }`}
                    >
                      <div className={`px-4 py-3 flex items-center justify-between ${
                        staff.hasReport
                          ? staff.isAdmin ? 'bg-amber-50' : 'bg-emerald-50'
                          : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          {staff.isAdmin ? (
                            <Shield size={18} className="text-amber-500" />
                          ) : (
                            <User size={18} className="text-emerald-600" />
                          )}
                          <span className="font-bold text-emerald-900">{staff.name}</span>
                          {staff.isAdmin && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                              管理者
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={staff.hasReport ? 'text-emerald-600' : 'text-gray-400'}>
                            {staff.reports.length}件
                          </span>
                          {staff.totalPhotos > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Image size={14} />
                              {staff.totalPhotos}枚
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        {staff.reports.length === 0 ? (
                          <p className="text-gray-400 text-sm italic">この日の報告はありません</p>
                        ) : (
                          <div className="space-y-3">
                            {staff.reports.map((report, idx) => (
                              <div key={report.id} className="bg-white border border-emerald-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-sm text-emerald-600 mb-2">
                                  <Clock size={14} />
                                  <span>{report.time}</span>
                                </div>
                                <div className="text-emerald-800 text-sm whitespace-pre-wrap">
                                  {report.tasks}
                                </div>
                                {report.photos?.length > 0 && (
                                  <div className="mt-2 flex gap-1">
                                    {report.photos.slice(0, 4).map(photo => (
                                      <img
                                        key={photo.id}
                                        src={photo.data}
                                        alt="添付"
                                        className="w-12 h-12 object-cover rounded border border-emerald-200"
                                      />
                                    ))}
                                    {report.photos.length > 4 && (
                                      <div className="w-12 h-12 bg-emerald-100 rounded border border-emerald-200 flex items-center justify-center text-emerald-600 text-xs">
                                        +{report.photos.length - 4}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-emerald-200 bg-white">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button
                    onClick={saveSharedSummary}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Users size={18} />
                    共有保存
                  </button>
                  <button
                    onClick={downloadAllStaffSummary}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
                  >
                    <Download size={18} />
                    DL
                  </button>
                  <button
                    onClick={printAllStaffSummary}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Printer size={18} />
                    印刷
                  </button>
                </div>
                <p className="text-xs text-center text-gray-500">「共有保存」すると全職員が閲覧できます</p>
              </div>
            </div>
          </div>
        )}

        {/* 通知 */}
        {notification && (
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  // メイン画面（ログイン後）
  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} p-4`}>
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 mb-4 border border-emerald-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <FileText size={24} className="text-emerald-700" />
              <span className="hidden sm:inline">ハーベスト日報</span>
              <span className="sm:hidden">日報</span>
            </h1>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
                >
                  <Shield size={18} />
                  <span className="hidden sm:inline">管理</span>
                </button>
              )}
              <button
                onClick={() => setShowSharedSummaries(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
              >
                <Users size={18} />
                <span className="hidden sm:inline">共有</span>
                {sharedSummaries.length > 0 && (
                  <span className="bg-purple-700 text-white text-xs px-2 py-0.5 rounded-full">
                    {sharedSummaries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSummary(true)}
                className="flex items-center gap-2 px-3 py-2 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">まとめ</span>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
              >
                <Calendar size={18} />
                <span className="hidden sm:inline">履歴</span>
                {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* ログインユーザー表示 */}
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            isAdmin ? 'bg-amber-50 border-2 border-amber-200' : 'bg-emerald-50 border-2 border-emerald-200'
          }`}>
            {isAdmin ? (
              <Shield size={24} className="text-amber-500" />
            ) : (
              <User size={24} className="text-emerald-600" />
            )}
            <div>
              <span className={`font-bold text-lg ${isAdmin ? 'text-amber-800' : 'text-emerald-800'}`}>
                {loggedInStaff}
              </span>
              <span className={`text-sm ml-2 ${isAdmin ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isAdmin && '（管理者）'}
              </span>
            </div>
          </div>

          {/* 日付・時間選択 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-emerald-800 mb-2 block">日付</label>
              <input
                type="date"
                value={currentReport.date}
                onChange={(e) => setCurrentReport(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-emerald-800 mb-2 block">時間</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={currentReport.time}
                  onChange={(e) => setCurrentReport(prev => ({ ...prev, time: e.target.value }))}
                  className="flex-1 px-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={setCurrentTime}
                  className="px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors flex items-center gap-2"
                >
                  <Clock size={18} />
                  <span className="hidden sm:inline">今</span>
                </button>
              </div>
            </div>
          </div>

          {/* 報告入力 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-emerald-800">報告</label>
              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff size={18} />
                    <span>停止</span>
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    <span>音声入力</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={currentReport.tasks}
              onChange={(e) => setCurrentReport(prev => ({ ...prev, tasks: e.target.value }))}
              placeholder="報告内容を入力してください..."
              rows={6}
              className={`w-full px-4 py-3 border-2 rounded-xl resize-none focus:outline-none transition-all ${
                isListening
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-emerald-200 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* 写真セクション */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                <Image size={18} />
                写真 ({photos.length}枚)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors text-sm font-medium"
                >
                  <Camera size={18} />
                  <span>撮影</span>
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors text-sm font-medium cursor-pointer">
                  <Plus size={18} />
                  <span>選択</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 写真一覧 */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.data}
                      alt="撮影写真"
                      className="w-full h-24 object-cover rounded-lg border-2 border-emerald-200"
                    />
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={saveReport}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <Save size={20} />
              保存する
            </button>
            <button
              onClick={clearReport}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium"
            >
              <Plus size={20} />
              新規
            </button>
          </div>
        </div>

        {/* 履歴パネル */}
        {showHistory && (
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 mb-4 border border-emerald-200">
            <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2 border-b-2 border-emerald-200 pb-3">
              <Calendar size={20} />
              過去の日報
            </h2>

            {/* 職員フィルター */}
            <div className="mb-4">
              <label className="text-sm font-medium text-emerald-800 mb-2 block">職員で絞り込み</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStaff('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterStaff === 'all'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  全員
                </button>
                {staffList.map(staff => (
                  <button
                    key={staff.name}
                    onClick={() => setFilterStaff(staff.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                      filterStaff === staff.name
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {staff.isAdmin && <Shield size={14} />}
                    {staff.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 検索 */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="日報を検索..."
                className="w-full pl-12 pr-4 py-3 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* 日報リスト */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReports.length === 0 ? (
                <p className="text-center text-emerald-500 py-8">
                  {reports.length === 0 ? '保存された日報はありません' : '該当する日報がありません'}
                </p>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => loadReport(report)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      report.staff === loggedInStaff
                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                        : isAdmin
                        ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-medium text-emerald-900">{formatDate(report.date)}</span>
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <Clock size={14} />
                          {report.time}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          report.staff === loggedInStaff
                            ? 'bg-emerald-200 text-emerald-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {report.staff}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-600 truncate">
                        {report.tasks || '(内容なし)'}
                        {report.photos && report.photos.length > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Image size={12} />
                            {report.photos.length}枚
                          </span>
                        )}
                      </p>
                    </div>
                    {(report.staff === loggedInStaff || isAdmin) && (
                      <button
                        onClick={(e) => deleteReport(report.id, report.staff, e)}
                        className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 音声入力中の表示 */}
        {isListening && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-pulse">
            <Mic size={20} />
            <span className="font-medium">音声入力中...</span>
          </div>
        )}

        {/* カメラモーダル */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-2xl"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={takePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <Camera size={32} className="text-emerald-700" />
              </button>
              <button
                onClick={stopCamera}
                className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={32} />
              </button>
            </div>
            <p className="text-white mt-4 text-sm">撮影ボタンを押して写真を撮影</p>
          </div>
        )}

        {/* 共有まとめ一覧モーダル */}
        {showSharedSummaries && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-purple-200 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-purple-50">
                <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                  <Users size={24} className="text-purple-600" />
                  共有まとめ一覧
                </h2>
                <button
                  onClick={() => setShowSharedSummaries(false)}
                  className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {sharedSummaries.length === 0 ? (
                  <div className="text-center py-12 text-purple-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>共有されたまとめはありません</p>
                    <p className="text-sm mt-2">「まとめ」→「全員」→「共有保存」で作成できます</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedSummaries.map(summary => {
                      const hasViewed = summary.lastViewedBy?.some(v => v.name === loggedInStaff);
                      return (
                        <div
                          key={summary.id}
                          onClick={() => viewSharedSummary(summary)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                            hasViewed
                              ? 'bg-white border-purple-200 hover:border-purple-400'
                              : 'bg-purple-50 border-purple-300 hover:border-purple-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-purple-900">{formatDate(summary.date)}</span>
                                {!hasViewed && (
                                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                    未読
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-purple-600">
                                {summary.reportedStaffCount}/{summary.totalStaffCount}名が報告 ・ {summary.totalReports}件
                              </div>
                              <div className="text-xs text-purple-400 mt-1">
                                作成: {summary.savedBy} ({new Date(summary.savedAt).toLocaleString('ja-JP')})
                              </div>
                              {summary.lastViewedBy?.length > 0 && (
                                <div className="text-xs text-purple-400 mt-1">
                                  閲覧済: {summary.lastViewedBy.map(v => v.name).join(', ')}
                                </div>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={(e) => deleteSharedSummary(summary.id, e)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 共有まとめ閲覧モーダル */}
        {viewingSharedSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-purple-200 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-purple-50">
                <div>
                  <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <Users size={24} className="text-purple-600" />
                    {formatDate(viewingSharedSummary.date)}
                  </h2>
                  <p className="text-sm text-purple-600">
                    作成: {viewingSharedSummary.savedBy}
                  </p>
                </div>
                <button
                  onClick={() => setViewingSharedSummary(null)}
                  className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-purple-50 border-b border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-purple-700">
                    <span className="font-bold">{viewingSharedSummary.reportedStaffCount}</span>/{viewingSharedSummary.totalStaffCount}名が報告
                  </div>
                  <div className="text-sm text-purple-700">
                    合計 <span className="font-bold">{viewingSharedSummary.totalReports}</span>件
                  </div>
                </div>
                {viewingSharedSummary.lastViewedBy?.length > 0 && (
                  <div className="mt-2 text-xs text-purple-500">
                    👀 閲覧済: {viewingSharedSummary.lastViewedBy.map(v => v.name).join(', ')}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {viewingSharedSummary.staffData?.map(staff => (
                    <div
                      key={staff.name}
                      className={`border-2 rounded-xl overflow-hidden ${
                        staff.hasReport ? 'border-purple-200' : 'border-gray-200'
                      }`}
                    >
                      <div className={`px-4 py-3 flex items-center justify-between ${
                        staff.hasReport
                          ? staff.isAdmin ? 'bg-amber-50' : 'bg-purple-50'
                          : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          {staff.isAdmin ? (
                            <Shield size={18} className="text-amber-500" />
                          ) : (
                            <User size={18} className="text-purple-600" />
                          )}
                          <span className="font-bold text-purple-900">{staff.name}</span>
                          {staff.isAdmin && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                              管理者
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={staff.hasReport ? 'text-purple-600' : 'text-gray-400'}>
                            {staff.reports?.length || 0}件
                          </span>
                          {staff.totalPhotos > 0 && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Image size={14} />
                              {staff.totalPhotos}枚
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        {!staff.reports || staff.reports.length === 0 ? (
                          <p className="text-gray-400 text-sm italic">この日の報告はありません</p>
                        ) : (
                          <div className="space-y-3">
                            {staff.reports.map((report) => (
                              <div key={report.id} className="bg-white border border-purple-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
                                  <Clock size={14} />
                                  <span>{report.time}</span>
                                </div>
                                <div className="text-purple-800 text-sm whitespace-pre-wrap">
                                  {report.tasks}
                                </div>
                                {report.photos?.length > 0 && (
                                  <div className="mt-2 flex gap-1">
                                    {report.photos.slice(0, 4).map(photo => (
                                      <img
                                        key={photo.id}
                                        src={photo.data}
                                        alt="添付"
                                        className="w-12 h-12 object-cover rounded border border-purple-200"
                                      />
                                    ))}
                                    {report.photos.length > 4 && (
                                      <div className="w-12 h-12 bg-purple-100 rounded border border-purple-200 flex items-center justify-center text-purple-600 text-xs">
                                        +{report.photos.length - 4}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-purple-200 bg-white">
                <button
                  onClick={() => setViewingSharedSummary(null)}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 隠しcanvas（写真撮影用） */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 通知 */}
        {notification && (
          <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
}
