import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, MapPin, Users, Plus, LogOut, Ticket, LayoutDashboard,
  CalendarCheck, Pencil, Trash2, Search, X, CheckCircle2, Clock3,
  ShieldCheck, Sparkles, ArrowRight, UserRound, Mail, LockKeyhole
} from "lucide-react";

const KEYS = {
  users: "ems_users",
  events: "ems_events",
  registrations: "ems_registrations",
  session: "ems_current_user",
};

const seedEvents = [
  {
    id: "evt_1",
    title: "Tech Innovation Summit",
    date: "2027-01-18",
    time: "10:00",
    venue: "KL University, Seminar Hall",
    category: "Technology",
    capacity: 120,
    description: "A day of ideas, demos and conversations about emerging technology and innovation.",
  },
  {
    id: "evt_2",
    title: "Creative Arts Festival",
    date: "2027-02-06",
    time: "09:30",
    venue: "University Open Auditorium",
    category: "Arts & Culture",
    capacity: 80,
    description: "Celebrate creativity with performances, exhibitions and interactive activities.",
  },
  {
    id: "evt_3",
    title: "Entrepreneurship Connect",
    date: "2027-02-21",
    time: "11:00",
    venue: "Innovation and Incubation Centre",
    category: "Business",
    capacity: 100,
    description: "Learn how ideas become ventures through talks, networking and student showcases.",
  },
];

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function initStorage() {
  if (!localStorage.getItem(KEYS.users)) {
    localStorage.setItem(KEYS.users, JSON.stringify([{
      id: "admin_1",
      name: "Event Admin",
      email: "admin@evently.com",
      password: "admin123",
      role: "admin",
    }]));
  }
  if (!localStorage.getItem(KEYS.events)) {
    localStorage.setItem(KEYS.events, JSON.stringify(seedEvents));
  }
  if (!localStorage.getItem(KEYS.registrations)) {
    localStorage.setItem(KEYS.registrations, JSON.stringify([]));
  }
}

function formatDate(date) {
  if (!date) return "Date to be announced";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function App() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("login");
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    initStorage();
    setUsers(read(KEYS.users, []));
    setEvents(read(KEYS.events, []));
    setRegistrations(read(KEYS.registrations, []));
    const session = read(KEYS.session, null);
    if (session) {
      setCurrentUser(session);
      setPage(session.role === "admin" ? "admin" : "user");
    }
  }, []);

  function persistUsers(next) {
    setUsers(next);
    localStorage.setItem(KEYS.users, JSON.stringify(next));
  }
  function persistEvents(next) {
    setEvents(next);
    localStorage.setItem(KEYS.events, JSON.stringify(next));
  }
  function persistRegistrations(next) {
    setRegistrations(next);
    localStorage.setItem(KEYS.registrations, JSON.stringify(next));
  }
  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function signup({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      flash("An account with this email already exists.");
      return;
    }
    const user = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user",
    };
    persistUsers([...users, user]);
    localStorage.setItem(KEYS.session, JSON.stringify(user));
    setCurrentUser(user);
    setPage("user");
    flash("Account created. Welcome to Evently!");
  }

  function login({ email, password }) {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!user) {
      flash("Incorrect email or password. Please try again.");
      return;
    }
    localStorage.setItem(KEYS.session, JSON.stringify(user));
    setCurrentUser(user);
    setPage(user.role === "admin" ? "admin" : "user");
    flash(`Welcome back, ${user.name}!`);
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
    setCurrentUser(null);
    setPage("login");
    setAuthMode("login");
    flash("You have been logged out.");
  }

  function saveEvent(form) {
    if (Number(form.capacity) < 1) {
      flash("Capacity must be at least 1.");
      return;
    }
    if (editingEvent) {
      persistEvents(events.map((event) => event.id === editingEvent.id
        ? { ...form, id: editingEvent.id, capacity: Number(form.capacity) } : event));
      flash("Event updated successfully.");
    } else {
      persistEvents([{ ...form, id: `evt_${Date.now()}`, capacity: Number(form.capacity) }, ...events]);
      flash("New event published successfully.");
    }
    setShowEventForm(false);
    setEditingEvent(null);
  }

  function deleteEvent(id) {
    if (!window.confirm("Delete this event? Its registrations will also be removed.")) return;
    persistEvents(events.filter((event) => event.id !== id));
    persistRegistrations(registrations.filter((r) => r.eventId !== id));
    flash("Event deleted.");
  }

  function register(event) {
    const already = registrations.some((r) => r.eventId === event.id && r.userId === currentUser.id);
    const count = registrations.filter((r) => r.eventId === event.id).length;
    if (already) return flash("You are already registered for this event.");
    if (count >= event.capacity) return flash("Sorry, this event is full.");
    persistRegistrations([...registrations, {
      id: `reg_${Date.now()}`, eventId: event.id, userId: currentUser.id,
      registeredAt: new Date().toISOString(),
    }]);
    flash("Registration successful. See you at the event!");
  }

  function cancelRegistration(id) {
    persistRegistrations(registrations.filter((r) => r.id !== id));
    flash("Registration cancelled.");
  }

  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesSearch = `${event.title} ${event.venue} ${event.description}`
      .toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All" || event.category === category);
  }), [events, search, category]);

  if (!currentUser || !["admin", "user"].includes(currentUser.role)) {
    return (
      <AuthScreen mode={authMode} setMode={setAuthMode} onLogin={login} onSignup={signup} notice={notice} />
    );
  }

  const isAdmin = currentUser.role === "admin";
  const myRegistrations = registrations.filter((r) => r.userId === currentUser.id);
  const categories = ["All", ...new Set(events.map((e) => e.category).filter(Boolean))];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage(isAdmin ? "admin" : "user")}>
          <span className="brand-mark"><CalendarDays size={21} /></span>
          <span>evently<span className="brand-dot">.</span><small>EVENT MANAGEMENT</small></span>
        </button>
        <div className="side-label">WORKSPACE</div>
        {isAdmin ? (
          <>
            <SideLink icon={<LayoutDashboard size={18}/>} label="Dashboard" active={page === "admin"} onClick={() => setPage("admin")} />
            <SideLink icon={<CalendarDays size={18}/>} label="Manage events" active={page === "manage"} onClick={() => setPage("manage")} />
            <SideLink icon={<Users size={18}/>} label="Participants" active={page === "participants"} onClick={() => setPage("participants")} />
          </>
        ) : (
          <>
            <SideLink icon={<CalendarDays size={18}/>} label="Explore events" active={page === "user"} onClick={() => setPage("user")} />
            <SideLink icon={<Ticket size={18}/>} label="My registrations" active={page === "registrations"} onClick={() => setPage("registrations")} />
          </>
        )}
        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
            <div className="profile-info"><strong>{currentUser.name}</strong><span>{isAdmin ? "Administrator" : "Event member"}</span></div>
          </div>
          <button className="logout-btn" onClick={logout}><LogOut size={17}/> Log out</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">evently<span>.</span></div>
          <div className="breadcrumb">Workspace <span>/</span> {pageLabel(page)}</div>
          <div className="topbar-right"><span className="role-pill"><ShieldCheck size={14}/>{isAdmin ? "ADMIN" : "USER"}</span><div className="avatar small">{currentUser.name.charAt(0).toUpperCase()}</div></div>
        </header>

        <div className="content">
          {page === "admin" && isAdmin && (
            <AdminDashboard events={events} registrations={registrations} users={users} onManage={() => setPage("manage")} />
          )}
          {page === "manage" && isAdmin && (
            <section>
              <PageHeading eyebrow="ADMIN MODULE" title="Manage events" subtitle="Create and maintain the events available to your community."
                action={<button className="btn btn-primary" onClick={() => { setEditingEvent(null); setShowEventForm(true); }}><Plus size={17}/> Create event</button>} />
              <div className="event-list">
                {events.length ? events.map((event) => (
                  <AdminEventRow key={event.id} event={event}
                    count={registrations.filter((r) => r.eventId === event.id).length}
                    onEdit={() => { setEditingEvent(event); setShowEventForm(true); }}
                    onDelete={() => deleteEvent(event.id)} />
                )) : <EmptyState title="No events yet" detail="Create your first event to get started." />}
              </div>
            </section>
          )}
          {page === "participants" && isAdmin && (
            <Participants events={events} registrations={registrations} users={users} />
          )}
          {page === "user" && !isAdmin && (
            <section>
              <div className="welcome-banner">
                <div><div className="eyebrow light">YOUR NEXT EXPERIENCE STARTS HERE</div><h1>Discover something<br/>worth showing up for.</h1><p>Find events, meet people and make every moment count.</p></div>
                <div className="banner-art"><div className="art-circle"><CalendarDays size={56}/></div><Sparkles className="sparkle s1"/><Sparkles className="sparkle s2"/></div>
              </div>
              <PageHeading eyebrow="EVENT DISCOVERY" title="Explore events" subtitle="Find your next opportunity to learn, connect and celebrate." />
              <div className="filter-bar">
                <div className="search-box"><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events or venues..." /></div>
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="event-grid">
                {filteredEvents.map((event, index) => <EventCard key={event.id} event={event}
                  count={registrations.filter((r) => r.eventId === event.id).length}
                  registered={registrations.some((r) => r.eventId === event.id && r.userId === currentUser.id)}
                  onRegister={() => register(event)} onDetails={() => setSelectedEvent(event)} index={index}/>)}
              </div>
              {!filteredEvents.length && <EmptyState title="No matching events" detail="Try a different search or category."/>}
            </section>
          )}
          {page === "registrations" && !isAdmin && (
            <section>
              <PageHeading eyebrow="YOUR ACTIVITY" title="My registrations" subtitle="All the events you have signed up for, in one place." />
              <div className="event-list">
                {myRegistrations.length ? myRegistrations.map((reg) => {
                  const event = events.find((e) => e.id === reg.eventId);
                  return event ? <RegistrationRow key={reg.id} event={event} onCancel={() => cancelRegistration(reg.id)} /> : null;
                }) : <EmptyState title="No registrations yet" detail="Explore events and register for something you like." action={<button className="btn btn-primary" onClick={() => setPage("user")}>Explore events <ArrowRight size={16}/></button>} />}
              </div>
            </section>
          )}
        </div>
      </main>

      {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}</div>}
      {showEventForm && <EventModal event={editingEvent} onClose={() => { setShowEventForm(false); setEditingEvent(null); }} onSave={saveEvent}/>}
      {selectedEvent && <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} onRegister={() => { register(selectedEvent); setSelectedEvent(null); }}/>}
    </div>
  );
}

function pageLabel(page) {
  return ({ admin: "Dashboard", manage: "Manage events", participants: "Participants", user: "Explore events", registrations: "My registrations" })[page] || "Dashboard";
}

function SideLink({ icon, label, active, onClick }) {
  return <button className={`side-link ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span>{active && <span className="active-indicator"/>}</button>;
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>;
}

function AdminDashboard({ events, registrations, users, onManage }) {
  const upcoming = events.filter((e) => new Date(`${e.date}T23:59:59`) >= new Date()).length;
  return <section>
    <PageHeading eyebrow="OVERVIEW" title="Good day, Admin" subtitle="Here is what's happening with your events." action={<button className="btn btn-primary" onClick={onManage}><Plus size={17}/> Manage events</button>}/>
    <div className="stats-grid">
      <StatCard icon={<CalendarDays/>} label="Total events" value={events.length} note="All published events"/>
      <StatCard icon={<Clock3/>} label="Upcoming events" value={upcoming} note="Scheduled ahead"/>
      <StatCard icon={<Ticket/>} label="Registrations" value={registrations.length} note="Total attendee sign-ups"/>
      <StatCard icon={<Users/>} label="Registered users" value={users.filter((u) => u.role === "user").length} note="Community members"/>
    </div>
    <div className="section-title-row"><div><h3>Recently added events</h3><p>Your latest published activities</p></div><button className="text-btn" onClick={onManage}>View all <ArrowRight size={15}/></button></div>
    <div className="event-list">
      {events.slice(0, 4).map((event) => <AdminEventRow key={event.id} event={event} count={registrations.filter((r) => r.eventId === event.id).length} compact/>)}
      {!events.length && <EmptyState title="No events published" detail="Create an event to see it here."/>}
    </div>
  </section>;
}

function StatCard({ icon, label, value, note }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-trend">LIVE</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-note">{note}</div></div>;
}

function AdminEventRow({ event, count, onEdit, onDelete, compact }) {
  return <div className="admin-event-row"><div className="date-tile"><span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-IN",{month:"short"})}</span><strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong></div><div className="row-event-info"><strong>{event.title}</strong><span><MapPin size={14}/>{event.venue}</span></div><div className="row-meta"><Users size={15}/>{count}/{event.capacity} joined</div>{!compact && <div className="row-actions"><button className="icon-btn" title="Edit event" onClick={onEdit}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete event" onClick={onDelete}><Trash2 size={16}/></button></div>}</div>;
}

function EventCard({ event, count, registered, onRegister, onDetails, index }) {
  const colors = ["violet", "blue", "orange", "green"];
  const color = colors[index % colors.length];
  return <article className="event-card"><div className={`event-visual ${color}`}><span className="category-chip">{event.category || "Community"}</span><div className="visual-icon"><CalendarDays size={42}/></div><span className="visual-date">{formatDate(event.date)}</span></div><div className="event-card-body"><h3>{event.title}</h3><p className="event-description">{event.description}</p><div className="event-detail"><MapPin size={15}/>{event.venue}</div><div className="event-detail"><Clock3 size={15}/>{event.time || "Time to be announced"} · {count} / {event.capacity} spots filled</div><div className="card-actions"><button className="btn btn-outline" onClick={onDetails}>Details</button><button className="btn btn-primary" disabled={registered || count >= event.capacity} onClick={onRegister}>{registered ? "Registered" : count >= event.capacity ? "Full" : "Register"}{registered && <CheckCircle2 size={15}/>}</button></div></div></article>;
}

function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event || { title:"", date:"", time:"10:00", venue:"", category:"Technology", capacity:100, description:"" });
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal"><div className="modal-head"><div><div className="eyebrow">EVENT SETUP</div><h2>{event ? "Edit event" : "Create an event"}</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div><form className="event-form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
    <label>Event title<input required maxLength="70" value={form.title} onChange={(e) => update("title",e.target.value)} placeholder="e.g. Annual Tech Fest"/></label>
    <div className="form-two"><label>Date<input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={(e) => update("date",e.target.value)}/></label><label>Time<input required type="time" value={form.time} onChange={(e) => update("time",e.target.value)}/></label></div>
    <label>Venue<input required value={form.venue} onChange={(e) => update("venue",e.target.value)} placeholder="Event location"/></label>
    <div className="form-two"><label>Category<select value={form.category} onChange={(e) => update("category",e.target.value)}>{["Technology","Arts & Culture","Business","Education","Sports","Community"].map((c)=><option key={c}>{c}</option>)}</select></label><label>Capacity<input required type="number" min="1" max="10000" value={form.capacity} onChange={(e) => update("capacity",e.target.value)}/></label></div>
    <label>Description<textarea required rows="3" maxLength="300" value={form.description} onChange={(e) => update("description",e.target.value)} placeholder="Tell people what this event is about..."/></label>
    <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit">{event ? "Save changes" : "Publish event"}</button></div>
  </form></div></div>;
}

function Participants({ events, registrations, users }) {
  return <section><PageHeading eyebrow="ADMIN MODULE" title="Participants" subtitle="Review the people registered for each event."/>
    {events.map((event) => {
      const rows = registrations.filter((r) => r.eventId === event.id);
      return <div className="participant-panel" key={event.id}><div className="participant-head"><div><h3>{event.title}</h3><p>{formatDate(event.date)} · {event.venue}</p></div><span className="count-pill">{rows.length} / {event.capacity}</span></div>
        {rows.length ? <div className="table-wrap"><table><thead><tr><th>Participant</th><th>Email</th><th>Registered on</th></tr></thead><tbody>{rows.map((r) => { const u = users.find((x) => x.id === r.userId); return <tr key={r.id}><td>{u?.name || "Unknown user"}</td><td>{u?.email || "—"}</td><td>{new Date(r.registeredAt).toLocaleDateString("en-IN")}</td></tr>; })}</tbody></table></div> : <div className="no-participants">No registrations for this event yet.</div>}
      </div>;
    })}
    {!events.length && <EmptyState title="No events available" detail="Create an event before reviewing participants."/>}
  </section>;
}

function RegistrationRow({ event, onCancel }) {
  return <div className="admin-event-row registration-row"><div className="date-tile"><span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-IN",{month:"short"})}</span><strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong></div><div className="row-event-info"><strong>{event.title}</strong><span><MapPin size={14}/>{event.venue}</span></div><span className="registered-label"><CheckCircle2 size={15}/> Registered</span><button className="btn btn-outline cancel-btn" onClick={onCancel}>Cancel registration</button></div>;
}

function EventDetails({ event, onClose, onRegister }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal details-modal"><div className="modal-head"><div><div className="eyebrow">EVENT DETAILS</div><h2>{event.title}</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div><div className="details-content"><div className="detail-line"><CalendarDays/>{formatDate(event.date)} at {event.time}</div><div className="detail-line"><MapPin/>{event.venue}</div><div className="detail-line"><Users/>{event.capacity} participant capacity</div><p>{event.description}</p></div><div className="modal-actions"><button className="btn btn-outline" onClick={onClose}>Close</button><button className="btn btn-primary" onClick={onRegister}>Register now</button></div></div></div>;
}

function EmptyState({ title, detail, action }) {
  return <div className="empty-state"><div className="empty-icon"><CalendarDays size={26}/></div><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

function AuthScreen({ mode, setMode, onLogin, onSignup, notice }) {
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const isSignup = mode === "signup";
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  function submit(e) {
    e.preventDefault();
    setError("");
    if (isSignup) {
      if (form.password.length < 6) return setError("Password must be at least 6 characters.");
      if (form.password !== form.confirm) return setError("Passwords do not match.");
      onSignup(form);
    } else onLogin(form);
  }
  return <div className="auth-layout"><div className="auth-left"><div className="auth-brand"><span className="brand-mark"><CalendarDays size={22}/></span>evently<span>.</span></div><div className="auth-hero"><div className="eyebrow light">PLAN. CONNECT. CELEBRATE.</div><h1>Make every<br/>event <em>memorable.</em></h1><p>One simple space to discover events, bring people together and create moments that matter.</p><div className="auth-feature"><span><CalendarCheck/></span><div><strong>Everything in one place</strong><small>Events, attendees and registrations made simple.</small></div></div></div><div className="auth-footer">EVENT MANAGEMENT SYSTEM <span>•</span> REACT + VITE</div></div>
    <div className="auth-right"><div className="auth-card"><div className="auth-card-top"><div className="eyebrow">WELCOME TO EVENTLY</div><h2>{isSignup ? "Create your account" : "Welcome back"}</h2><p>{isSignup ? "Sign up to discover and join exciting events." : "Enter your details to access your workspace."}</p></div>
      <div className="auth-tabs"><button className={!isSignup ? "selected" : ""} onClick={() => {setMode("login");setError("");}}>Log in</button><button className={isSignup ? "selected" : ""} onClick={() => {setMode("signup");setError("");}}>Sign up</button></div>
      <form className="auth-form" onSubmit={submit}>
        {isSignup && <label>Full name<div className="input-wrap"><UserRound size={17}/><input required value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="Enter your name"/></div></label>}
        <label>Email address<div className="input-wrap"><Mail size={17}/><input required type="email" value={form.email} onChange={(e)=>update("email",e.target.value)} placeholder="name@example.com"/></div></label>
        <label>Password<div className="input-wrap"><LockKeyhole size={17}/><input required type="password" value={form.password} onChange={(e)=>update("password",e.target.value)} placeholder="Enter your password" minLength={isSignup ? 6 : undefined}/></div></label>
        {isSignup && <label>Confirm password<div className="input-wrap"><LockKeyhole size={17}/><input required type="password" value={form.confirm} onChange={(e)=>update("confirm",e.target.value)} placeholder="Re-enter your password"/></div></label>}
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary auth-submit" type="submit">{isSignup ? "Create account" : "Log in to workspace"} <ArrowRight size={17}/></button>
      </form>
      {!isSignup && <div className="demo-credentials"><strong>Admin demo access</strong><span>admin@evently.com</span><span>admin123</span></div>}
      <div className="auth-legal">By continuing, you agree to use this academic demo responsibly.</div>
      {notice && <div className="auth-notice">{notice}</div>}
    </div></div></div>;
}

export default App;