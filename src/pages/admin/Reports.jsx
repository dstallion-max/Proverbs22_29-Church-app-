import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Download, TrendingUp, Users, Wallet, Calendar,
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
  const avgAttendance = attendance.length > 0
    ? Math.round(totalAttendance / attendance.length)
    : 0
  const totalOffering = offerings.reduce((s, r) => s + Number(r.total || 0), 0)
  const totalFirstTimers = attendance.reduce((s, r) => s + (r.first_timers || 0), 0)
  const servicesCount = attendance.length

  const fmtMoney = (n) => `N ${Number(n).toLocaleString()}`

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(30, 58, 138)
    doc.text('RCCG Hephzibah Chapel', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text('A Place of Grace', pageWidth / 2, 27, { align: 'center' })

    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('Church Report', pageWidth / 2, 40, { align: 'center' })

    doc.setFontSize(9)
    doc.setTextColor(120)
    const periodLabel = `Period: Last ${range} days (${new Date(Date.now() - parseInt(range) * 86400000).toLocaleDateString('en-NG')} — ${new Date().toLocaleDateString('en-NG')})`
    doc.text(periodLabel, pageWidth / 2, 47, { align: 'center' })

    let y = 60

    // Summary
    doc.setFontSize(12)
    doc.setTextColor(30, 58, 138)
    doc.text('Summary', 14, y)
    y += 8

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(`Total Attendance: ${totalAttendance}`, 14, y); y += 6
    doc.text(`Average per Service: ${avgAttendance}`, 14, y); y += 6
    doc.text(`First Timers: ${totalFirstTimers}`, 14, y); y += 6
    doc.text(`Services Recorded: ${servicesCount}`, 14, y); y += 6
    doc.text(`Total Offering: ${fmtMoney(totalOffering)}`, 14, y); y += 10

    // Attendance table
    if (attendance.length > 0) {
      doc.setFontSize(12)
      doc.setTextColor(30, 58, 138)
      doc.text('Attendance by Service', 14, y)
      y += 8

      doc.setFontSize(9)
      doc.setTextColor(80)
      doc.text('Date', 14, y)
      doc.text('Men', 55, y)
      doc.text('Women', 75, y)
      doc.text('Teens', 100, y)
      doc.text('Children', 125, y)
      doc.text('First', 155, y)
      doc.text('Total', 175, y)
      y += 2
      doc.line(14, y, pageWidth - 14, y)
      y += 5

      doc.setTextColor(0)
      attendance.slice(0, 20).forEach((r) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.text(new Date(r.service_date).toLocaleDateString('en-NG'), 14, y)
        doc.text(String(r.adults_male || 0), 55, y)
        doc.text(String(r.adults_female || 0), 75, y)
        doc.text(String(r.teens || 0), 100, y)
        doc.text(String(r.children || 0), 125, y)
        doc.text(String(r.first_timers || 0), 155, y)
        doc.text(String(r.total || 0), 175, y)
        y += 6
      })
      y += 6
    }

    // Offering table
    if (offerings.length > 0) {
      if (y > 240) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(30, 58, 138)
      doc.text('Offerings by Service', 14, y)
      y += 8

      doc.setFontSize(9)
      doc.setTextColor(80)
      doc.text('Date', 14, y)
      doc.text('Type', 60, y)
      doc.text('Total', 160, y)
      y += 2
      doc.line(14, y, pageWidth - 14, y)
      y += 5

      doc.setTextColor(0)
      offerings.slice(0, 25).forEach((r) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.text(new Date(r.service_date).toLocaleDateString('en-NG'), 14, y)
        doc.text(String(r.offering_type || ''), 60, y)
        doc.text(fmtMoney(r.total), 160, y)
        y += 6
      })
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Generated ${new Date().toLocaleString('en-NG')} · Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }

    const filename = `Heghizbah-Report-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

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
              Download PDF Report
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