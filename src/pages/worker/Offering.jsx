import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, FileDown, CheckCircle2, ArrowLeft, Users, Save, 
  Trash2, Edit3, AlertCircle 
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';
import jsPDF from 'jspdf';

const denominations = [
  { key: 'denom_1000', value: 1000 }, { key: 'denom_500', value: 500 },
  { key: 'denom_200', value: 200 }, { key: 'denom_100', value: 100 },
  { key: 'denom_50', value: 50 }, { key: 'denom_20', value: 20 }, { key: 'denom_10', value: 10 },
];

const offeringTypes = ['Sunday Offering', 'Tithe', 'Building Fund', 'Missions', 'Thanksgiving', 'Special Seed'];

export default function Offering() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [offeringType, setOfferingType] = useState('Sunday Offering');
  const [counts, setCounts] = useState({});
  const [attendance, setAttendance] = useState({ adults_male: '', adults_female: '', teens: '', children: '', first_timers: '' });
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const isAdmin = profile?.role === 'admin';
  const isUsher = profile?.groups?.includes('ushers');
  const canAccess = isAdmin || isUsher;

  useEffect(() => {
    if (!canAccess && profile) { navigate('/worker'); return; }
    if (canAccess) loadHistory();
  }, [canAccess, profile]); // eslint-disable-line

  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data: offeringData, error: offErr } = await supabase.from('offering_records').select('*').order('service_date', { ascending: false }).limit(20);
    if (offErr) { setHistoryLoading(false); setError(friendlyError(offErr)); return; }

    const dates = offeringData.map(o => o.service_date);
    let attendanceData = [];
    if (dates.length > 0) {
      const { data: attData } = await supabase.from('attendance_records').select('*').in('service_date', dates);
      attendanceData = attData || [];
    }

    const mergedHistory = offeringData.map(offer => {
      const linkedAtt = attendanceData.find(att => att.service_date === offer.service_date);
      return { ...offer, attendance_records: linkedAtt ? [linkedAtt] : [] };
    });

    setHistoryLoading(false);
    setHistory(mergedHistory);
  };

  const total = denominations.reduce((sum, d) => sum + (d.value * (parseInt(counts[d.key]) || 0)), 0);
  const totalAttendance = Object.values(attendance).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  const fmt = (n) => `N ${Number(n || 0).toLocaleString()}`;

  const resetForm = () => {
    setEditingId(null); setServiceDate(new Date().toISOString().split('T')[0]); setOfferingType('Sunday Offering');
    setCounts({}); setAttendance({ adults_male: '', adults_female: '', teens: '', children: '', first_timers: '' }); setError('');
  };

  const handleEditClick = (record) => {
    setEditingId(record.id); setServiceDate(record.service_date); setOfferingType(record.offering_type);
    const denomCounts = {};
    denominations.forEach(d => { denomCounts[d.key] = record[d.key] ? String(record[d.key]) : ''; });
    setCounts(denomCounts);

    const att = record.attendance_records?.[0]; 
    if (att) setAttendance({ adults_male: String(att.adults_male||''), adults_female: String(att.adults_female||''), teens: String(att.teens||''), children: String(att.children||''), first_timers: String(att.first_timers||'') });
    else setAttendance({ adults_male: '', adults_female: '', teens: '', children: '', first_timers: '' });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (total === 0 && totalAttendance === 0) return setError('Enter at least one amount or attendance count');
    setLoading(true);

    const offeringPayload = {
      service_date: serviceDate, offering_type: offeringType,
      denom_1000: parseInt(counts.denom_1000) || 0, denom_500: parseInt(counts.denom_500) || 0, denom_200: parseInt(counts.denom_200) || 0,
      denom_100: parseInt(counts.denom_100) || 0, denom_50: parseInt(counts.denom_50) || 0, denom_20: parseInt(counts.denom_20) || 0,
      denom_10: parseInt(counts.denom_10) || 0, submitted: true, recorded_by: user?.id || null,
    };

    let errorMsg = null;
    if (editingId) {
      const { error } = await supabase.from('offering_records').update(offeringPayload).eq('id', editingId);
      if (error) errorMsg = error;
    } else {
      const { error } = await supabase.from('offering_records').insert(offeringPayload);
      if (error) errorMsg = error;
    }

    if (errorMsg) { setLoading(false); setError(friendlyError(errorMsg)); return; }

    if (!editingId && totalAttendance > 0) {
      await supabase.from('attendance_records').insert({
        service_date: serviceDate, group_name: 'Adults',
        adults_male: parseInt(attendance.adults_male) || 0, adults_female: parseInt(attendance.adults_female) || 0,
        teens: parseInt(attendance.teens) || 0, children: parseInt(attendance.children) || 0,
        first_timers: parseInt(attendance.first_timers) || 0, recorded_by: user?.id || null,
      });
    }

    setLoading(false); setSaved(true); resetForm(); await loadHistory(); setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    await supabase.from('offering_records').delete().eq('id', id);
    if (editingId === id) resetForm();
    loadHistory();
  };

  // --- EXACT RCCG PDF GENERATOR ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('THE REDEEMED CHRISTIAN CHURCH OF GOD', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text('PROVINCE', 105, 21, { align: 'center' });
    doc.text('MONTHLY GENERAL PROGRESS REPORT SHEET', 105, 27, { align: 'center' });
    
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('AREA: ....................................................', 14, 35);
    doc.text('PARISH: HEPHIZIBAH PARISH', 14, 41);
    doc.text(`FOR THE MONTH: ${new Date(serviceDate).toLocaleString('default', { month: 'long' })}`, 14, 47);
    doc.text(`YEAR: ${new Date(serviceDate).getFullYear()}`, 60, 47);
    doc.text('MGPR 002', 180, 27, { align: 'right' });

    // Table Settings
    const startX = 14; const startY = 52; 
    const colWidths = [18, 22, 12, 14, 16, 14, 25, 18, 16, 24]; // Date, Day, M, W, C, Tot, Preacher, Conv, Guest, Offering
    const rowH = 6;

    doc.setLineWidth(0.3);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');

    // Draw Headers
    doc.rect(startX, startY, 179, rowH * 2); // Main box
    doc.text('DATE', startX + 9, startY + 7, { align: 'center' });
    doc.text('DAYS', startX + 29, startY + 7, { align: 'center' });
    doc.text('ATTENDANCE', startX + 59, startY + 3, { align: 'center' });
    
    doc.text('Men', startX + 51, startY + 9, { align: 'center' });
    doc.text('Women', startX + 65, startY + 9, { align: 'center' });
    doc.text('Children', startX + 82, startY + 9, { align: 'center' });
    doc.text('Total', startX + 96, startY + 9, { align: 'center' });
    
    doc.text('Preacher', startX + 116, startY + 7, { align: 'center' });
    doc.text('New\nConverts', startX + 138, startY + 6, { align: 'center' });
    doc.text('New\nGuest', startX + 155, startY + 6, { align: 'center' });
    doc.text('Sunday\nOffering', startX + 175, startY + 6, { align: 'center' });

    // Draw lines
    doc.line(startX + 18, startY, startX + 18, startY + rowH * 2); // Date
    doc.line(startX + 40, startY, startX + 40, startY + rowH * 2); // Days
    doc.line(startX + 105, startY, startX + 105, startY + rowH * 2); // Attendance End
    doc.line(startX + 130, startY, startX + 130, startY + rowH * 2); // Preacher End
    doc.line(startX + 148, startY, startX + 148, startY + rowH * 2); // Converts End
    doc.line(startX + 165, startY, startX + 165, startY + rowH * 2); // Guest End
    doc.line(startX + 51, startY + rowH, startX + 51, startY + rowH * 2); // Men
    doc.line(startX + 65, startY + rowH, startX + 65, startY + rowH * 2); // Women
    doc.line(startX + 82, startY + rowH, startX + 82, startY + rowH * 2); // Children
    doc.line(startX, startY + rowH, startX + 179, startY + rowH); // Middle line

    // Draw Rows
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    let currentY = startY + (rowH * 2);

    // We loop through the whole month's days
    const year = new Date(serviceDate).getFullYear();
    const month = new Date(serviceDate).getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    doc.setFont('helvetica', 'normal');

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayName = days[d.getDay()];
      const dateStr = `${String(i).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${String(year).slice(2)}`;
      
      // Find if we have data for this day
      const record = history.find(h => new Date(h.service_date).getDate() === i);
      const att = record?.attendance_records?.[0] || {};

      // Draw box
      doc.rect(startX, currentY, 179, rowH);

      // Fill Data
      doc.text(dateStr, startX + 9, currentY + 4, { align: 'center' });
      doc.text(dayName, startX + 29, currentY + 4, { align: 'center' });
      
      if (record) {
        doc.text(String(att.adults_male || ''), startX + 51, currentY + 4, { align: 'center' });
        doc.text(String(att.adults_female || ''), startX + 65, currentY + 4, { align: 'center' });
        doc.text(String(att.children || ''), startX + 82, currentY + 4, { align: 'center' });
        doc.text(String(att.total || ''), startX + 96, currentY + 4, { align: 'center' });
        doc.text(String(record.total || ''), startX + 175, currentY + 4, { align: 'center' });
      }

      // Redraw vertical lines over the row
      doc.line(startX + 18, currentY, startX + 18, currentY + rowH);
      doc.line(startX + 40, currentY, startX + 40, currentY + rowH);
      doc.line(startX + 51, currentY, startX + 51, currentY + rowH);
      doc.line(startX + 65, currentY, startX + 65, currentY + rowH);
      doc.line(startX + 82, currentY, startX + 82, currentY + rowH);
      doc.line(startX + 96, currentY, startX + 96, currentY + rowH);
      doc.line(startX + 105, currentY, startX + 105, currentY + rowH);
      doc.line(startX + 130, currentY, startX + 130, currentY + rowH);
      doc.line(startX + 148, currentY, startX + 148, currentY + rowH);
      doc.line(startX + 165, currentY, startX + 165, currentY + rowH);

      currentY += rowH;

      // If we hit the bottom of page, add new page
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    }

    // Footer Signature
    currentY += 15;
    doc.text('_________________________________', 14, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text('Pastor in Charge of Parish', 14, currentY + 5);

    doc.save(`RCCG_MGPR_Report_${serviceDate}.pdf`);
  };

  if (!canAccess) return null;

  return (
    <div className="anim-fade-up min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button onClick={() => navigate('/worker')} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Offering & Attendance</h1>
        <button onClick={handleDownloadPDF} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)' }} title="Download Report">
          <FileDown size={20} style={{ color: 'var(--primary)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard eyebrow={editingId ? "Editing Record" : "Today's Collection"} title={fmt(total)} subtitle={offeringType} right={<HeroIcon icon={Wallet} />} />
      </div>

      {editingId && (
        <div className="px-5 mt-4">
          <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Editing record</span>
            <button onClick={resetForm} className="text-xs font-bold underline" style={{ color: 'var(--accent)' }}>Cancel Edit</button>
          </div>
        </div>
      )}

      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date</label>
          <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Type</label>
          <select value={offeringType} onChange={(e) => setOfferingType(e.target.value)} className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            {offeringTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Denomination Count</h2>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {denominations.map((d, idx) => (
            <div key={d.key} className="flex items-center gap-3 p-3" style={{ borderBottom: idx < denominations.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="w-20 text-sm font-semibold" style={{ color: 'var(--text)' }}>{fmt(d.value)}</span>
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>x</span>
              <input type="number" inputMode="numeric" value={counts[d.key] || ''} onChange={(e) => setCounts({ ...counts, [d.key]: e.target.value })} placeholder="0" className="flex-1 p-2 rounded-lg text-center text-sm focus:outline-none" style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }} />
              <span className="w-20 text-right text-sm font-medium" style={{ color: 'var(--primary)' }}>{fmt(d.value * (parseInt(counts[d.key]) || 0))}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Attendance</h2>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {[ ['adults_male', 'Men'], ['adults_female', 'Women'], ['teens', 'Teens'], ['children', 'Children'], ['first_timers', 'First Timers'] ].map(([key, label], idx, arr) => (
            <div key={key} className="flex items-center gap-3 p-3" style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{label}</span>
              <input type="number" inputMode="numeric" value={attendance[key]} onChange={(e) => setAttendance({ ...attendance, [key]: e.target.value })} placeholder="0" className="w-20 p-2 rounded-lg text-center text-sm focus:outline-none" style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }} />
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--card-soft)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Attendance</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{totalAttendance} people</span>
        </div>
      </div>

      {error && <div className="px-5 mt-4"><p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p></div>}

      <div className="px-5 mt-6">
        <button onClick={handleSave} disabled={loading} className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60" style={{ background: editingId ? 'var(--accent)' : 'var(--primary)' }}>
          {saved ? <><CheckCircle2 size={18} />Saved</> : loading ? 'Saving...' : <><Save size={18} />{editingId ? 'Update Record' : 'Save Offering'}</>}
        </button>
      </div>

      <div className="px-5 mt-8 pb-10">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Recent Submissions</h2>
        {historyLoading ? ( <div className="flex justify-center py-6"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div> ) : history.length === 0 ? ( <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No submissions yet</p> ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-soft)' }}><Wallet size={18} style={{ color: 'var(--primary)' }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{h.offering_type}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(h.service_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right mr-2"><p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{fmt(h.total || 0)}</p></div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditClick(h)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--card-soft)] active:scale-95"><Edit3 size={14} style={{ color: 'var(--text)' }} /></button>
                  <button onClick={() => handleDelete(h.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--danger-soft)] active:scale-95"><Trash2 size={14} style={{ color: 'var(--danger)' }} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}