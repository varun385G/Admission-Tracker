import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import StudentDetailModal from '../components/students/StudentDetailModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

  const { data: calData } = useQuery({
    queryKey: ['calendar', monthStr],
    queryFn: () => api.get('/reports/calendar', { params: { month: monthStr } }).then(r => r.data),
  });

  const { data: dayStudents } = useQuery({
    queryKey: ['students-followup', selectedDate],
    queryFn: () => api.get('/students', { params: { limit: 50 } }).then(r =>
      r.data.students.filter(s => s.next_followup_date?.startsWith(selectedDate))
    ),
    enabled: !!selectedDate,
  });

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const firstDayOfWeek = getDay(startOfMonth(current));

  const prevMonth = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={prevMonth}>← Prev</button>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700 }}>
          {MONTH_NAMES[current.getMonth()]} {current.getFullYear()}
        </h2>
        <button className="btn btn-outline btn-sm" onClick={nextMonth}>Next →</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(new Date())}>Today</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Calendar grid */}
        <div className="card card-body">
          <div className="cal-grid" style={{ marginBottom: 8 }}>
            {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
          </div>
          <div className="cal-grid">
            {/* Empty cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-day empty" />
            ))}
            {/* Day cells */}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const count = calData?.[dateStr] || 0;
              const _today = isToday(day);
              const selected = selectedDate === dateStr;
              return (
                <div key={dateStr} className={`cal-day ${_today ? 'today' : ''} ${count > 0 ? 'has-followups' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{ outline: selected ? '2px solid var(--primary)' : 'none' }}
                >
                  <div className="cal-day-num" style={{ color: _today ? 'var(--primary)' : undefined, fontWeight: _today ? 700 : 600 }}>
                    {day.getDate()}
                  </div>
                  {count > 0 && <div className="cal-badge">{count}</div>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', opacity: 0.7 }} />
              Follow-ups scheduled
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid var(--primary)' }} />
              Today
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 13 }}>
              {selectedDate
                ? `${format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}`
                : 'Select a day'}
            </span>
            {selectedDate && (
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                {dayStudents?.length || 0} follow-up{dayStudents?.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {!selectedDate && <p style={{ color: 'var(--text3)', fontSize: 13 }}>Click a day to see follow-ups</p>}
            {selectedDate && (!dayStudents?.length
              ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No follow-ups on this day</p>
              : dayStudents.map(s => (
                <div key={s.id} onClick={() => setDetailId(s.id)} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.course_interested} · {s.status}</div>
                  {s.staff_name && <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>{s.staff_name}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <StudentDetailModal open={!!detailId} onClose={() => setDetailId(null)} studentId={detailId}
        onEdit={() => {}} onDeleted={() => setDetailId(null)} />
    </div>
  );
}
