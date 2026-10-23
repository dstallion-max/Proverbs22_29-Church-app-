import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Download, TrendingUp, Users, Wallet, Calendar,
  ArrowLeft, BarChart3, RefreshCw
} from 'lucide-react'
import HeroCard, { HeroIcon } from '../../components/common/HeroCard'
import { supabase } from '../../lib/supabaseClient'
import { friendlyError } from '../../utils/errors'
import jsPDF from 'jspdf'

export default function Reports() {
  const navigate = useNavigate()

  const [range, setRange] = useState('30') // days
  const [attendance, setAttendance] = useState([])
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReports()
  }, [range])

  const loadReports = async () => {
    setLoading(true)
    setError('')

    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - parseInt(range))

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const [attRes, offRes] = await Promise.all([
      supabase.rpc('get_attendance_summary', { start_date: startStr, end_date: endStr }),
      supabase.rpc('get_offering_summary', { start_date: startStr, end_date: endStr }),
    ])

    setLoading(false)

    if (attRes.error || offRes.error) {
      setError(friendlyError(attRes.error || offRes.error))
      return
    }

    setAttendance(attRes.data || [])
    setOfferings(offRes.data || [])
  }

  // Derived stats
  const totalAttendance = attendance.reduce((s, r) => s + (r.total || 0), 0)
  const avgAttendance = attendance.length > 0 ? Math.round(totalAttendance / attendance.length) : 0
  const totalOffering = offerings.reduce((s, r) => s + Number(r.total || 0), 0)
  const totalFirstTimers = attendance.reduce((s, r) => s + (r.first_timers || 0), 0)
  const servicesCount = attendance.length

  const fmtMoney = (n) => `N ${Number(n).toLocaleString()}`

  // --- EXACT RCCG PDF GENERATOR FOR ADMIN ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // --- HEADER ---
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(14);
    doc.text('THE REDEEMED CHRISTIAN CHURCH OF GOD', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text('PROVINCE', 105, 21, { align: 'center' });
    doc.text('MONTHLY GENERAL PROGRESS REPORT SHEET', 105, 27, { align: 'center' });
    
    doc.setFontSize(9); 
    doc.setFont('helvetica', 'normal');
    doc.text('AREA: ....................................................', 14, 37);
    doc.text('PARISH: HEPHIZIBAH PARISH', 14, 43);
    doc.text(`FOR THE MONTH: ${new Date().toLocaleString('default', { month: 'long' })}`, 14, 49);
    doc.text(`YEAR: ${new Date().getFullYear()}`, 60, 49);
    doc.text('MGPR 002', 196, 27, { align: 'right' });

    // --- MAIN GRID SETUP ---
    const startX = 14; 
    const startY = 55; 
    const rowH = 5.5; 
    
    doc.setLineWidth(0.3);
    doc.setFontSize(7.5); 
    doc.setFont('helvetica', 'bold');

    // Draw outer box for headers (2 rows high)
    doc.rect(startX, startY, 182, rowH * 2);

    // Header Text
    doc.text('DATE', startX + 8, startY + 7.5, { align: 'center' });
    doc.text('DAYS', startX + 16 + 11, startY + 7.5, { align: 'center' });
    doc.text('ATTENDANCE', startX + 38 + 27, startY + 3.5, { align: 'center' });
    
    // Sub-headers
    doc.text('Men', startX + 38 + 6, startY + 10, { align: 'center' });
    doc.text('Women', startX + 50 + 7, startY + 10, { align: 'center' });
    doc.text('Children', startX + 64 + 7, startY + 10, { align: 'center' });
    doc.text('Total', startX + 78 + 7, startY + 10, { align: 'center' });
    
    doc.text('Preacher', startX + 92 + 13, startY + 7.5, { align: 'center' });
    doc.text('New\nConverts', startX + 118 + 8, startY + 6.5, { align: 'center' });
    doc.text('New\nGuest', startX + 134 + 8, startY + 6.5, { align: 'center' });
    doc.text('Sunday\nOffering', startX + 150 + 16, startY + 6.5, { align: 'center' });

    // Vertical lines for headers
    let currentX = startX;
    doc.line(currentX + 16, startY, currentX + 16, startY + rowH * 2); // Date
    doc.line(currentX + 38, startY, currentX + 38, startY + rowH * 2); // Days
    doc.line(currentX + 92, startY, currentX + 92, startY + rowH * 2); // Attendance end
    doc.line(currentX + 118, startY, currentX + 118, startY + rowH * 2); // Preacher
    doc.line(currentX + 134, startY, currentX + 134, startY + rowH * 2); // Converts
    doc.line(currentX + 150, startY, currentX + 150, startY + rowH * 2); // Guest
    
    // Sub-column lines
    doc.line(currentX + 50, startY + rowH, currentX + 50, startY + rowH * 2);
    doc.line(currentX + 64, startY + rowH, currentX + 64, startY + rowH * 2);
    doc.line(currentX + 78, startY + rowH, currentX + 78, startY + rowH * 2);
    
    doc.line(startX, startY + rowH, startX + 182, startY + rowH);

    // --- DRAW ROWS ---
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    let currentY = startY + (rowH * 2);

    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    doc.setFont('helvetica', 'normal');

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayName = days[d.getDay()];
      const dateStr = `${String(i).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${String(year).slice(2)}`;
      
      const record = attendance.find(h => new Date(h.service_date).getDate() === i);
      const offRecord = offerings.find(h => new Date(h.service_date).getDate() === i);
      
      doc.rect(startX, currentY, 182, rowH);

      doc.text(dateStr, startX + 8, currentY + 3.8, { align: 'center' });
      doc.text(dayName, startX + 16 + 11, currentY + 3.8, { align: 'center' });
      
      if (record) {
        doc.text(String(record.adults_male || ''), startX + 38 + 6, currentY + 3.8, { align: 'center' });
        doc.text(String(record.adults_female || ''), startX + 50 + 7, currentY + 3.8, { align: 'center' });
        doc.text(String(record.children || ''), startX + 64 + 7, currentY + 3.8, { align: 'center' });
        doc.text(String(record.total || ''), startX + 78 + 7, currentY + 3.8, { align: 'center' });
      }
      
      if (offRecord) {
         doc.text(String(offRecord.total || ''), startX + 150 + 16, currentY + 3.8, { align: 'center' });
      }

      // Vertical lines
      doc.line(startX + 16, currentY, startX + 16, currentY + rowH);
      doc.line(startX + 38, currentY, startX + 38, currentY + rowH);
      doc.line(startX + 50, currentY, startX + 50, currentY + rowH);
      doc.line(startX + 64, currentY, startX + 64, currentY + rowH);
      doc.line(startX + 78, currentY, startX + 78, currentY + rowH);
      doc.line(startX + 92, currentY, startX + 92, currentY + rowH);
      doc.line(startX + 118, currentY, startX + 118, currentY + rowH);
      doc.line(startX + 134, currentY, startX + 134, currentY + rowH);
      doc.line(startX + 150, currentY, startX + 150, currentY + rowH);

      currentY += rowH;
    }

    // --- AVERAGE ATTENDANCE BLOCK ---
    doc.setFont('helvetica', 'bold');
    const avgHeaderH = 8;
    const avgRowH = 6;
    
    // Adjusted widths so the text doesn't overlap
    const blockHeight = avgHeaderH + (avgRowH * 3);
    doc.rect(startX, currentY, 92, blockHeight);

    // Top Header row
    doc.text('Average', startX + 8, currentY + 5, { align: 'center' });
    doc.text('Attendance', startX + 8, currentY + 7.5, { align: 'center' });
    
    doc.text('Men', startX + 50, currentY + 5, { align: 'center' });
    doc.text('Women', startX + 63, currentY + 5, { align: 'center' });
    doc.text('Children', startX + 76, currentY + 5, { align: 'center' });
    doc.text('Total', startX + 86, currentY + 5, { align: 'center' });

    // Draw Header Lines
    doc.line(startX, currentY + avgHeaderH, startX + 92, currentY + avgHeaderH);
    doc.line(startX + 16, currentY, startX + 16, currentY + blockHeight);
    doc.line(startX + 44, currentY, startX + 44, currentY + blockHeight); // Days column
    doc.line(startX + 57, currentY + avgHeaderH, startX + 57, currentY + blockHeight); // Men
    doc.line(startX + 69, currentY + avgHeaderH, startX + 69, currentY + blockHeight); // Women
    doc.line(startX + 81, currentY + avgHeaderH, startX + 81, currentY + blockHeight); // Children

    // Draw Data Rows
    doc.setFont('helvetica', 'normal');
    
    // Calculate Averages
    const getDayData = (dayIndex) => attendance.filter(h => new Date(h.service_date).getDay() === dayIndex);
    const tuesData = getDayData(2);
    const thursData = getDayData(4);
    const sunData = getDayData(0);
    
    const calcAvg = (data, key) => data.length > 0 ? Math.round(data.reduce((sum, item) => sum + (item[key] || 0), 0) / data.length) : 0;

    // Helper to draw a single row in the average block
    const drawAvgRow = (label, data, y) => {
      const m = calcAvg(data, 'adults_male');
      const w = calcAvg(data, 'adults_female');
      const c = calcAvg(data, 'children');
      const t = m + w + c; // Calculating the correct total

      doc.text(label, startX + 30, y, { align: 'center' });
      doc.text(String(m), startX + 50, y, { align: 'center' });
      doc.text(String(w), startX + 63, y, { align: 'center' });
      doc.text(String(c), startX + 76, y, { align: 'center' });
      doc.text(String(t), startX + 86, y, { align: 'center' });
    };

    // Row 1: Tuesday
    let rowY = currentY + avgHeaderH + 4.5;
    drawAvgRow('TUESDAY', tuesData, rowY);

    // Row 2: Thursday
    rowY += avgRowH;
    drawAvgRow('THURSDAY', thursData, rowY);

    // Row 3: Sunday
    rowY += avgRowH;
    drawAvgRow('SUNDAY', sunData, rowY);

    // Horizontal lines for the 3 data rows
    doc.line(startX, currentY + avgHeaderH + avgRowH, startX + 92, currentY + avgHeaderH + avgRowH);
    doc.line(startX, currentY + avgHeaderH + avgRowH * 2, startX + 92, currentY + avgHeaderH + avgRowH * 2);


    // --- FOOTER SIGNATURE ---
    let finalY = currentY + blockHeight + 15;
    
    // The totals block on the right side
    const totalOfferingMonth = offerings.reduce((sum, r) => sum + Number(r.total || 0), 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL AMOUNT REMITTED: N ${totalOfferingMonth.toLocaleString()}`, 196, finalY - 10, { align: 'right' });

    doc.text('_________________________________', 14, finalY);
    doc.text('Pastor in Charge of Parish', 14, finalY + 5);

    doc.save(`RCCG_MGPR_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/admin')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Reports</h1>
        <button
          onClick={loadReports}
          disabled={loading}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Reports"
          title="Church Analytics"
          subtitle="Download and share with regional head"
          right={<HeroIcon icon={BarChart3} />}
        />
      </div>

      <div className="px-5 mt-5">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {[
            { id: '7', label: '7 days' },
            { id: '30', label: '30 days' },
            { id: '90', label: '90 days' },
            { id: '365', label: '1 year' },
          ].map((r) => {
            const active = range === r.id
            return (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className="flex-1 py-2.5 text-xs font-medium rounded-xl transition-all"
                style={{
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {!loading && (
        <>
          <div className="px-5 mt-5 grid grid-cols-2 gap-3">
            <Tile icon={Users} label="Total Attendance" value={totalAttendance} color="var(--primary)" />
            <Tile icon={Wallet} label="Total Offering" value={fmtMoney(totalOffering)} color="var(--success)" />
            <Tile icon={TrendingUp} label="Avg per Service" value={avgAttendance} color="var(--accent)" />
            <Tile icon={Calendar} label="Services" value={servicesCount} color="#a855f7" />
          </div>

          <div className="px-5 mt-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Attendance History</h2>

            {attendance.length === 0 ? (
              <EmptyCard icon={Users} text="No attendance records in this period" />
            ) : (
              <div className="space-y-2">
                {attendance.map((r) => (
                  <div
                    key={r.service_date}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--primary-soft)' }}
                    >
                      <Calendar size={18} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {new Date(r.service_date).toLocaleDateString('en-NG', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {r.adults_male || 0} M · {r.adults_female || 0} F · {r.teens || 0} T · {r.children || 0} C
                      </p>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      {r.total || 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 mt-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Offering History</h2>

            {offerings.length === 0 ? (
              <EmptyCard icon={Wallet} text="No offering records in this period" />
            ) : (
              <div className="space-y-2">
                {offerings.map((r, i) => (
                  <div
                    key={`${r.service_date}-${r.offering_type}-${i}`}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--success-soft)' }}
                    >
                      <Wallet size={18} style={{ color: 'var(--success)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                        {r.offering_type}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {new Date(r.service_date).toLocaleDateString('en-NG')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                      {fmtMoney(r.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 mt-6 pb-6">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition"
              style={{ background: 'var(--primary)' }}
            >
              <Download size={18} />
              Download MGPR Report
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Tile({ icon: Icon, label, value, color }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: `1px solid ${color}40` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-display text-2xl mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function EmptyCard({ icon: Icon, text }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <Icon size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  )
}