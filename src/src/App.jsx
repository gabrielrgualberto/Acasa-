import { useState, useEffect } from "react";

const SUPABASE_URL = "https://azruaouuhotikjtjnlec.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cnVhb3V1aG90aWtqdGpubGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDg3NTksImV4cCI6MjA5NDcyNDc1OX0.mHYdGlUKyF_1A8C3jQuJtbbiSY4sJs5kAiaQ5fUVqtM";

const api = async (method, path, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const EVENT_COLORS = [
  { label: "Dourado", value: "#C9A84C" },
  { label: "Rosa", value: "#D4658A" },
  { label: "Verde", value: "#4CAF82" },
  { label: "Azul", value: "#4C7EC9" },
  { label: "Coral", value: "#E07B5A" },
];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }

const css = `
* { box-sizing: border-box; }
.cal-wrap { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
.cal-header-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.cal-nav { background: transparent; border: 1px solid #2a2620; color: #888; font-size: 18px; width: 40px; height: 40px; border-radius: 3px; cursor: pointer; }
.cal-month-name { font-size: 28px; font-weight: 400; letter-spacing: 2px; color: #f0e8d8; text-align: center; }
.cal-year { font-size: 13px; color: #C9A84C; letter-spacing: 3px; text-align: center; }
.cal-days-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 4px; }
.cal-day-label { text-align: center; font-size: 11px; letter-spacing: 2px; color: #666; text-transform: uppercase; padding: 8px 0; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-cell { min-height: 90px; border-radius: 4px; padding: 8px 6px; cursor: pointer; border: 1px solid #1e1c17; background: #141210; overflow: hidden; }
.cal-cell.today { background: #1e1c17; border-color: #C9A84C55; }
.cal-day-num { font-size: 13px; color: #888; margin-bottom: 4px; }
.cal-day-num.today { color: #C9A84C; font-weight: 700; }
.cal-event { font-size: 10px; padding: 2px 4px; border-radius: 2px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.app-header { background: linear-gradient(135deg,#1a1710 0%,#0f0e0c 100%); border-bottom: 1px solid #2a2620; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
.logo-area { display: flex; align-items: center; gap: 14px; }
.logo-img { height: 52px; width: auto; object-fit: contain; border-radius: 4px; }
.logo-text-block .label { font-size: 11px; letter-spacing: 4px; color: #C9A84C; text-transform: uppercase; margin-bottom: 2px; }
.logo-text-block .title { font-size: 20px; font-weight: 400; color: #f0e8d8; letter-spacing: 1px; }
.view-btns { display: flex; gap: 8px; }
.view-btn { padding: 6px 14px; border-radius: 3px; font-size: 11px; letter-spacing: 1px; cursor: pointer; text-transform: uppercase; font-family: inherit; }
@media (max-width: 600px) {
  .cal-wrap { padding: 12px 6px; }
  .cal-header-nav { margin-bottom: 12px; }
  .cal-nav { width: 30px; height: 30px; font-size: 13px; }
  .cal-month-name { font-size: 16px; letter-spacing: 1px; }
  .cal-year { font-size: 10px; letter-spacing: 1px; }
  .cal-days-header { gap: 1px; margin-bottom: 1px; }
  .cal-day-label { font-size: 7px; padding: 3px 0; letter-spacing: 0; }
  .cal-grid { gap: 1px; }
  .cal-cell { min-height: 46px; padding: 2px 2px; }
  .cal-day-num { font-size: 9px; margin-bottom: 1px; }
  .cal-event { font-size: 7px; padding: 1px 2px; }
  .app-header { padding: 12px 16px; }
  .logo-img { height: 36px; }
  .logo-text-block .label { font-size: 9px; letter-spacing: 2px; }
  .logo-text-block .title { font-size: 15px; }
  .view-btn { padding: 5px 10px; font-size: 10px; }
}
`;

export default function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ name: "", time: "", description: "", color: "#C9A84C" });
  const [view, setView] = useState("calendar");

  const loadEvents = async () => {
    setLoading(true);
    const data = await api("GET", "events?select=*&order=date.asc");
    if (data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y-1); } else setCurrentMonth(m => m-1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y+1); } else setCurrentMonth(m => m+1); };

  const eventsForDate = (d) => events.filter(e => e.date === d);
  const openNewEvent = (d) => { setSelectedDate(d); setEditingEvent(null); setForm({ name:"", time:"", description:"", color:"#C9A84C" }); setShowModal(true); };
  const openEditEvent = (ev) => { setEditingEvent(ev); setForm({ name:ev.name, time:ev.time||"", description:ev.description||"", color:ev.color }); setSelectedDate(ev.date); setShowModal(true); };

  const saveEvent = async () => {
    if (!form.name.trim()) return;
    if (editingEvent) {
      await api("PATCH", `events?id=eq.${editingEvent.id}`, form);
    } else {
      await api("POST", "events", { ...form, date: selectedDate });
    }
    setShowModal(false);
    loadEvents();
  };

  const deleteEvent = async (id) => {
    await api("DELETE", `events?id=eq.${id}`);
    setShowModal(false);
    loadEvents();
  };

  const upcomingEvents = events.filter(e => e.date >= formatDate(today)).slice(0, 5);
  const allEvents = [...events].sort((a,b) => a.date.localeCompare(b.date));
  const formatDisplayDate = (d) => { const [y,m,day] = d.split("-"); return `${day} de ${MONTHS[parseInt(m)-1]} de ${y}`; };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", background:"#0f0e0c", fontFamily:"'Georgia','Times New Roman',serif", color:"#e8e0d0" }}>
        <div className="app-header">
          <div className="logo-area">
            <img src="/acasafoto.jpeg" alt="À Casa" className="logo-img" onError={e => e.target.style.display='none'} />
            <div className="logo-text-block">
              <div className="label">Agenda de Eventos</div>
              <div className="title">À Casa</div>
            </div>
          </div>
          <div className="view-btns">
            {["calendar","list"].map(v => (
              <button key={v} onClick={() => setView(v)} className="view-btn" style={{ border:`1px solid ${view===v?"#C9A84C":"#2a2620"}`, background:view===v?"#C9A84C22":"transparent", color:view===v?"#C9A84C":"#888" }}>
                {v==="calendar"?"Calendário":"Lista"}
              </button>
            ))}
          </div>
        </div>

        <div className="cal-wrap">
          {loading && <div style={{ textAlign:"center", color:"#666", padding:"60px 0" }}>Carregando eventos...</div>}

          {!loading && view==="calendar" && (
            <>
              <div className="cal-header-nav">
                <button className="cal-nav" onClick={prevMonth}>←</button>
                <div>
                  <div className="cal-month-name">{MONTHS[currentMonth]}</div>
                  <div className="cal-year">{currentYear}</div>
                </div>
                <button className="cal-nav" onClick={nextMonth}>→</button>
              </div>
              <div className="cal-days-header">
                {DAYS_SHORT.map(d => <div key={d} className="cal-day-label">{d}</div>)}
              </div>
              <div className="cal-grid">
                {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`}/>)}
                {Array.from({length:daysInMonth}).map((_,i) => {
                  const day=i+1;
                  const dateStr=`${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayEvents=eventsForDate(dateStr);
                  const isToday=dateStr===formatDate(today);
                  return (
                    <div key={day} onClick={() => openNewEvent(dateStr)} className={`cal-cell${isToday?" today":""}`}>
                      <div className={`cal-day-num${isToday?" today":""}`}>{day}</div>
                      {dayEvents.map(ev => (
                        <div key={ev.id} onClick={e => { e.stopPropagation(); openEditEvent(ev); }} className="cal-event" style={{ background:ev.color+"22", borderLeft:`2px solid ${ev.color}`, color:ev.color }}>
                          {ev.time && <span style={{ opacity:0.7 }}>{ev.time} </span>}{ev.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              {upcomingEvents.length > 0 && (
                <div style={{ marginTop:36 }}>
                  <div style={{ fontSize:10, letterSpacing:4, color:"#C9A84C", textTransform:"uppercase", marginBottom:16 }}>Próximos Eventos</div>
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} onClick={() => openEditEvent(ev)} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 16px", borderRadius:4, background:"#141210", marginBottom:8, cursor:"pointer", borderLeft:`3px solid ${ev.color}` }}>
                      <div style={{ minWidth:120, fontSize:12, color:"#888" }}>{formatDisplayDate(ev.date)}</div>
                      {ev.time && <div style={{ fontSize:12, color:ev.color, minWidth:44 }}>{ev.time}</div>}
                      <div style={{ fontSize:13, color:"#e8e0d0", flex:1 }}>{ev.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && view==="list" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <div style={{ fontSize:10, letterSpacing:4, color:"#C9A84C", textTransform:"uppercase" }}>Todos os Eventos ({allEvents.length})</div>
                <button onClick={() => { setSelectedDate(formatDate(today)); setEditingEvent(null); setForm({name:"",time:"",description:"",color:"#C9A84C"}); setShowModal(true); }} style={{ padding:"8px 18px", background:"transparent", border:"1px solid #C9A84C", color:"#C9A84C", borderRadius:3, fontSize:11, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>+ Novo Evento</button>
              </div>
              {allEvents.length===0 && <div style={{ textAlign:"center", color:"#444", padding:"60px 0", fontSize:14 }}>Nenhum evento cadastrado ainda.</div>}
              {allEvents.map(ev => (
                <div key={ev.id} style={{ padding:"16px 20px", borderRadius:4, background:"#141210", borderLeft:`3px solid ${ev.color}`, marginBottom:8, display:"flex", alignItems:"flex-start", gap:20 }}>
                  <div style={{ minWidth:130 }}>
                    <div style={{ fontSize:12, color:"#888" }}>{formatDisplayDate(ev.date)}</div>
                    {ev.time && <div style={{ fontSize:13, color:ev.color, marginTop:2 }}>{ev.time}</div>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, color:"#f0e8d8", marginBottom:4 }}>{ev.name}</div>
                    {ev.description && <div style={{ fontSize:12, color:"#666", lineHeight:1.5 }}>{ev.description}</div>}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => openEditEvent(ev)} style={{ background:"transparent", border:"none", color:"#666", fontSize:14, cursor:"pointer", padding:"4px 6px" }}>✎</button>
                    <button onClick={() => deleteEvent(ev.id)} style={{ background:"transparent", border:"none", color:"#E07B5A", fontSize:14, cursor:"pointer", padding:"4px 6px" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div style={{ position:"fixed", inset:0, background:"#000000cc", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }} onClick={() => setShowModal(false)}>
            <div style={{ background:"#1a1710", border:"1px solid #2a2620", borderRadius:6, padding:32, width:440, maxWidth:"90vw" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:10, letterSpacing:4, color:"#C9A84C", textTransform:"uppercase", marginBottom:20 }}>{editingEvent?"Editar Evento":"Novo Evento"}</div>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>Data</div>
              <input type="date" value={selectedDate||""} onChange={e => setSelectedDate(e.target.value)} style={inp}/>
              <div style={{ fontSize:12, color:"#888", marginBottom:4, marginTop:14 }}>Nome do Evento *</div>
              <input type="text" placeholder="Ex: Casamento Silva & Costa" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inp}/>
              <div style={{ fontSize:12, color:"#888", marginBottom:4, marginTop:14 }}>Horário</div>
              <input type="time" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} style={inp}/>
              <div style={{ fontSize:12, color:"#888", marginBottom:4, marginTop:14 }}>Descrição</div>
              <textarea placeholder="Detalhes do evento..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3} style={{...inp, resize:"vertical"}}/>
              <div style={{ fontSize:12, color:"#888", marginBottom:8, marginTop:14 }}>Cor</div>
              <div style={{ display:"flex", gap:8 }}>
                {EVENT_COLORS.map(c => <div key={c.value} onClick={() => setForm(f=>({...f,color:c.value}))} title={c.label} style={{ width:28, height:28, borderRadius:"50%", background:c.value, cursor:"pointer", border:form.color===c.value?"2px solid #fff":"2px solid transparent" }}/>)}
              </div>
              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <button onClick={saveEvent} style={{ flex:1, padding:"12px", background:"#C9A84C", color:"#0f0e0c", border:"none", borderRadius:3, fontSize:12, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" }}>Salvar</button>
                {editingEvent && <button onClick={() => deleteEvent(editingEvent.id)} style={{ padding:"12px 16px", background:"transparent", color:"#E07B5A", border:"1px solid #E07B5A44", borderRadius:3, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Excluir</button>}
                <button onClick={() => setShowModal(false)} style={{ padding:"12px 16px", background:"transparent", color:"#666", border:"1px solid #2a2620", borderRadius:3, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const inp = { width:"100%", padding:"10px 12px", background:"#0f0e0c", border:"1px solid #2a2620", borderRadius:3, color:"#e8e0d0", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
