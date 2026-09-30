import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  Activity,
  Archive,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  NotebookPen,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import { api, unwrapList } from "./services/api";

const navItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: ClipboardList },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/notes", label: "Notes", icon: NotebookPen },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/reminders", label: "Reminders", icon: Bell },
  { path: "/daily-plans", label: "Daily plans", icon: Target },
  { path: "/ai", label: "AI companion", icon: Sparkles },
  { path: "/analytics", label: "Analytics", icon: Activity },
];

const resourceConfig = {
  tasks: {
    title: "Tasks",
    eyebrow: "Your operating queue",
    singular: "task",
    endpoint: "/api/tasks",
    icon: ClipboardList,
    filters: true,
    fields: [
      { name: "title", label: "Task title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: ["low", "medium", "high"],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["pending", "in-progress", "completed"],
      },
      { name: "dueDate", label: "Due date", type: "date" },
      { name: "category", label: "Category", type: "text" },
    ],
    card: (item) => (
      <>
        <span className={`priority-dot ${item.priority}`} />
        <strong>{item.title}</strong>
        <small>{item.category || "general"}</small>
      </>
    ),
  },
  notes: {
    title: "Notes",
    eyebrow: "Your external brain",
    singular: "note",
    endpoint: "/api/notes",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "content", label: "Content", type: "textarea" },
      { name: "tags", label: "Tags", type: "text" },
    ],
    card: (item) => (
      <>
        <strong>{item.title}</strong>
        <small>{item.content || "No content yet"}</small>
        <em>{(item.tags || []).join("  ·  ")}</em>
      </>
    ),
  },
  projects: {
    title: "Projects",
    eyebrow: "Big rocks, made visible",
    singular: "project",
    endpoint: "/api/projects",
    fields: [
      { name: "name", label: "Project name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["planning", "active", "completed", "archived"],
      },
      { name: "deadline", label: "Deadline", type: "date" },
    ],
    card: (item) => (
      <>
        <strong>{item.name}</strong>
        <small>{item.description || "No description yet"}</small>
        <em>{item.status}</em>
      </>
    ),
  },
  reminders: {
    title: "Reminders",
    eyebrow: "Keep future-you honest",
    singular: "reminder",
    endpoint: "/api/reminders",
    fields: [
      { name: "title", label: "Reminder", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "remindAt", label: "Remind at", type: "datetime-local" },
      { name: "completed", label: "Completed", type: "checkbox" },
    ],
    card: (item) => (
      <>
        <strong>{item.title}</strong>
        <small>{item.description || "No details"}</small>
        <em>{item.completed ? "completed" : formatDate(item.remindAt)}</em>
      </>
    ),
  },
  events: {
    title: "Calendar",
    eyebrow: "Time is a design material",
    singular: "event",
    endpoint: "/api/events",
    fields: [
      { name: "title", label: "Event title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "startTime", label: "Starts", type: "datetime-local" },
      { name: "endTime", label: "Ends", type: "datetime-local" },
      { name: "location", label: "Location", type: "text" },
    ],
    card: (item) => (
      <>
        <strong>{item.title}</strong>
        <small>
          {formatDate(item.startTime)} - {formatDate(item.endTime)}
        </small>
        <em>{item.location || "No location"}</em>
      </>
    ),
  },
  "daily-plans": {
    title: "Daily plans",
    eyebrow: "Give the day a shape",
    singular: "daily plan",
    endpoint: "/api/daily-plans",
    fields: [
      { name: "title", label: "Plan title", type: "text", required: true },
      { name: "date", label: "Date", type: "date" },
    ],
    card: (item) => (
      <>
        <strong>{item.title}</strong>
        <small>{formatDate(item.date)}</small>
        <em>{item.tasks?.length || 0} scheduled tasks</em>
      </>
    ),
  },
};

function formatDate(value) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
function formatInputDate(value, type) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (part) => String(part).padStart(2, "0");
  const dateValue = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return type === "date"
    ? dateValue
    : `${dateValue}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#20231f",
            color: "#f8f3e9",
            border: "1px solid #3a4037",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<ResourcePage kind="tasks" />} />
            <Route path="/notes" element={<ResourcePage kind="notes" />} />
            <Route
              path="/projects"
              element={<ResourcePage kind="projects" />}
            />
            <Route
              path="/reminders"
              element={<ResourcePage kind="reminders" />}
            />
            <Route path="/calendar" element={<ResourcePage kind="events" />} />
            <Route
              path="/daily-plans"
              element={<ResourcePage kind="daily-plans" />}
            />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai" element={<AIPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await (isLogin
        ? login({ email: form.email, password: form.password })
        : register(form));
      toast.success(isLogin ? "Welcome back" : "Workspace created");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="brand-lockup">
          <span className="brand-mark">F</span>
          <span>flowpilot</span>
        </div>
        <div className="auth-art-copy">
          <p className="kicker">PERSONAL WORKFLOW SYSTEM</p>
          <h1>Make room for the work that matters.</h1>
          <p>Turn scattered intentions into a calm, intelligent rhythm.</p>
        </div>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="auth-quote">
          “The day gets lighter when the next right thing is visible.”
        </div>
      </div>
      <section className="auth-panel">
        <div className="mobile-brand">
          <span className="brand-mark">F</span> flowpilot
        </div>
        <p className="kicker">
          {isLogin ? "WELCOME BACK" : "START YOUR SYSTEM"}
        </p>
        <h2>{isLogin ? "Good to see you." : "Build your flow."}</h2>
        <p className="muted">
          {isLogin
            ? "Sign in to pick up where you left off."
            : "A focused workspace for plans, tasks, and ideas."}
        </p>
        <form onSubmit={submit} className="stack-form">
          {!isLogin && (
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              required
              minLength="6"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </label>
          <button className="primary-button wide" disabled={busy}>
            {busy
              ? "Working..."
              : isLogin
                ? "Enter workspace"
                : "Create workspace"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? "New to FlowPilot?" : "Already have a workspace?"}{" "}
          <button onClick={() => navigate(isLogin ? "/register" : "/login")}>
            {isLogin ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState(null);
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!search.trim()) return setResults(null);
    const timer = setTimeout(
      () =>
        api
          .get(`/api/search?q=${encodeURIComponent(search)}`)
          .then(setResults)
          .catch(() => setResults(null)),
      350,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const doLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">F</span>
          <span>flowpilot</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={location.pathname === path ? "active" : ""}
              onClick={() => navigate(path)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={location.pathname === "/profile" ? "active" : ""}
            onClick={() => navigate("/profile")}
          >
            <Settings2 size={18} />
            Settings
          </button>
          <button onClick={doLogout}>
            <LogOut size={18} />
            Sign out
          </button>
          <div className="user-chip">
            <span className="avatar">{user?.name?.[0]?.toUpperCase()}</span>
            <span>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </span>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <div className="global-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your workspace"
            />
            {results && (
              <SearchResults results={results} onClose={() => setSearch("")} />
            )}
          </div>
          <div className="top-actions">
            <span className="status-pill">
              <span className="status-dot" />
              Synced
            </span>
            <button
              className="icon-button"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              <UserRound size={19} />
            </button>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SearchResults({ results, onClose }) {
  const groups = ["tasks", "notes", "projects", "events", "reminders"];
  return (
    <div className="search-results">
      <div className="search-result-head">
        <span>Search results</span>
        <button onClick={onClose}>
          <X size={15} />
        </button>
      </div>
      {groups.map((group) =>
        results[group]?.length ? (
          <div key={group} className="result-group">
            <small>{group}</small>
            {results[group].slice(0, 3).map((item) => (
              <div key={item._id} className="result-item">
                <span>{item.title || item.name}</span>
                <ArrowUpRight size={14} />
              </div>
            ))}
          </div>
        ) : null,
      )}
      {!groups.some((group) => results[group]?.length) && (
        <p className="muted">No matching work found.</p>
      )}
    </div>
  );
}
function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
        {description && (
          <p className="muted header-description">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/dashboard"),
      api.get("/api/tasks?limit=5&status=pending"),
    ])
      .then(([stats, taskData]) => {
        setDashboard(stats);
        setTasks(unwrapList(taskData));
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const complete = (id) =>
    api
      .patch(`/api/tasks/${id}/status`, { status: "completed" })
      .then(load)
      .then(() => toast.success("Task completed"));
  const taskStats = dashboard?.tasks || {};
  const projectStats = dashboard?.projects || {};
  return (
    <>
      <PageHeader
        eyebrow="GOOD MORNING"
        title={`A clearer day, ${user?.name?.split(" ")[0] || "there"}.`}
        description="Here is the shape of your workflow right now."
        action={
          <button
            className="primary-button"
            onClick={() => (window.location.href = "/tasks")}
          >
            <Plus size={17} />
            New task
          </button>
        }
      />
      {loading ? (
        <LoadingState label="Loading your overview" />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              label="Open tasks"
              value={taskStats.pending || 0}
              note={`${taskStats.overdue || 0} overdue`}
              icon={ClipboardList}
            />
            <StatCard
              label="Completed"
              value={taskStats.completed || 0}
              note="Keep the momentum"
              icon={CheckCircle2}
              accent="mint"
            />
            <StatCard
              label="Active projects"
              value={projectStats.active || 0}
              note={`${projectStats.total || 0} total projects`}
              icon={FolderKanban}
              accent="sun"
            />
            <StatCard
              label="Next up"
              value={
                (dashboard?.upcomingEvents || 0) +
                (dashboard?.upcomingReminders || 0)
              }
              note="events + reminders"
              icon={Clock3}
              accent="coral"
            />
          </div>
          <div className="dashboard-grid">
            <section className="panel task-panel">
              <div className="panel-heading">
                <div>
                  <p className="kicker">IN THE QUEUE</p>
                  <h2>Today’s focus</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => (window.location.href = "/tasks")}
                >
                  View all <ArrowUpRight size={15} />
                </button>
              </div>
              {tasks.length ? (
                tasks.map((task) => (
                  <div className="task-row" key={task._id}>
                    <button
                      className="check-button"
                      onClick={() => complete(task._id)}
                      aria-label={`Complete ${task.title}`}
                    >
                      <Check size={14} />
                    </button>
                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {task.category || "General"} · {task.priority} priority
                      </small>
                    </div>
                    <span className="due-label">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState label="Your queue is clear." />
              )}
            </section>
            <section className="panel insight-panel">
              <div className="insight-icon">
                <Sparkles size={19} />
              </div>
              <p className="kicker">FLOWPILOT NOTE</p>
              <h2>Small clarity compounds.</h2>
              <p className="muted">
                You have {taskStats.pending || 0} open tasks and{" "}
                {dashboard?.upcomingEvents || 0} upcoming events. Choose one
                meaningful move before adding another.
              </p>
              <button
                className="secondary-button"
                onClick={() => (window.location.href = "/ai")}
              >
                Ask the companion <ArrowUpRight size={16} />
              </button>
            </section>
          </div>
        </>
      )}
    </>
  );
}
function StatCard({ label, value, note, icon: Icon, accent = "coral" }) {
  return (
    <div className={`stat-card ${accent}`}>
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function ResourcePage({ kind }) {
  const config = resourceConfig[kind];
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
  });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const load = useCallback((page = pagination.page) => {
    setLoading(true);
    const query = new URLSearchParams({ page, limit: 8 });
    Object.entries(filters).forEach(
      ([key, value]) => value && query.set(key, value),
    );
    api
      .get(`${config.endpoint}?${query}`)
      .then((data) => {
        setItems(unwrapList(data));
        setPagination(data.pagination || { page, totalPages: 1 });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [config.endpoint, filters, pagination.page]);
  useEffect(() => {
    const timer = setTimeout(() => load(1), 180);

    const handleDataChanged = () => load(1);

    window.addEventListener("flowpilot:data-changed", handleDataChanged);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("flowpilot:data-changed", handleDataChanged);
    };
  }, [kind, load]);
  const openForm = (item = null) => {
    const values = item
      ? {
          ...item,
          tags: Array.isArray(item.tags)
            ? item.tags.join(", ")
            : item.tags || "",
        }
      : { priority: "medium", status: "pending" };
    if (item)
      config.fields
        .filter(
          (field) => field.type === "date" || field.type === "datetime-local",
        )
        .forEach((field) => {
          values[field.name] = formatInputDate(item[field.name], field.type);
        });
    setEditing(item);
    setForm(values);
    setFormOpen(true);
  };
  const submit = async (event) => {
    event.preventDefault();
    try {
      const body = { ...form };
      if (kind === "notes" && typeof body.tags === "string")
        body.tags = body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      if (editing) await api.put(`${config.endpoint}/${editing._id}`, body);
      else await api.post(config.endpoint, body);
      toast.success(`${config.singular} ${editing ? "updated" : "created"}`);
      setFormOpen(false);
      load(editing ? pagination.page : 1);
    } catch (error) {
      toast.error(error.message);
    }
  };
  const remove = (id) => {
    if (!window.confirm(`Delete this ${config.singular}?`)) return;
    api
      .delete(`${config.endpoint}/${id}`)
      .then(() => {
        toast.success("Deleted");
        load();
      })
      .catch((e) => toast.error(e.message));
  };
  const updateTaskStatus = (item) =>
    api
      .patch(`/api/tasks/${item._id}/status`, {
        status: item.status === "completed" ? "pending" : "completed",
      })
      .then(() => load())
      .catch((e) => toast.error(e.message));
  return (
    <>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={
          kind === "tasks"
            ? "A practical list, with enough context to act."
            : `Keep your ${config.title.toLowerCase()} close and useful.`
        }
        action={
          <button className="primary-button" onClick={() => openForm()}>
            <Plus size={17} />
            New {config.singular}
          </button>
        }
      />
      {config.filters && (
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} />
            <input
              placeholder="Search tasks"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}
      {loading ? (
        <LoadingState label={`Loading ${config.title.toLowerCase()}`} />
      ) : items.length ? (
        <div className="resource-list">
          {items.map((item) => (
            <article
              className={`resource-card ${item.status === "completed" ? "is-complete" : ""}`}
              key={item._id}
            >
              <div className="resource-main">{config.card(item)}</div>
              <div className="resource-actions">
                {kind === "tasks" && (
                  <button
                    className="circle-action"
                    onClick={() => updateTaskStatus(item)}
                    aria-label="Toggle task completion"
                  >
                    <Check size={15} />
                  </button>
                )}
                <button
                  className="circle-action"
                  onClick={() => openForm(item)}
                  aria-label={`Edit ${config.singular}`}
                >
                  <Settings2 size={15} />
                </button>
                <button
                  className="circle-action danger"
                  onClick={() => remove(item._id)}
                  aria-label={`Delete ${config.singular}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          label={`No ${config.title.toLowerCase()} yet.`}
          action={() => openForm()}
        />
      )}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => load(pagination.page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {formOpen && (
        <ResourceModal
          config={config}
          form={form}
          setForm={setForm}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={submit}
        />
      )}
    </>
  );
}
function ResourceModal({ config, form, setForm, editing, onClose, onSubmit }) {
  return (
    <div className="modal-wrap">
      <button
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Close modal"
      />
      <form className="modal" onSubmit={onSubmit}>
        <div className="modal-heading">
          <div>
            <p className="kicker">
              {editing ? "EDIT" : "NEW"} {config.singular.toUpperCase()}
            </p>
            <h2>
              {editing
                ? `Refine this ${config.singular}`
                : `Add a ${config.singular}`}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {config.fields.map((field) => (
          <label key={field.name}>
            {field.label}
            {field.type === "textarea" ? (
              <textarea
                value={form[field.name] || ""}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.value })
                }
              />
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={form[field.name] || field.options[0]}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.value })
                }
              >
                {field.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                className="checkbox-input"
                type="checkbox"
                checked={Boolean(form[field.name])}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.checked })
                }
              />
            ) : (
              <input
                required={field.required}
                type={field.type}
                value={form[field.name] || ""}
                onChange={(e) =>
                  setForm({ ...form, [field.name]: e.target.value })
                }
              />
            )}
          </label>
        ))}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button">
            {editing ? "Save changes" : "Create"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function AnalyticsPage() {
  const [productivity, setProductivity] = useState(null);
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    Promise.all([
      api.get("/api/analytics/productivity"),
      api.get("/api/analytics/tasks"),
    ])
      .then(([a, b]) => {
        setProductivity(a);
        setTasks(b.data || []);
      })
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="SIGNALS, NOT NOISE"
        title="Your patterns, in view."
        description="A compact read on what is moving and what is waiting."
      />
      <div className="stat-grid">
        <StatCard
          label="Completion rate"
          value={`${productivity?.completionRate || 0}%`}
          note="Across all tasks"
          icon={Activity}
          accent="mint"
        />
        <StatCard
          label="Completed tasks"
          value={productivity?.tasksCompleted || 0}
          note="Total finished"
          icon={CheckCircle2}
        />
        <StatCard
          label="Overdue"
          value={productivity?.tasksOverdue || 0}
          note="Worth a decision"
          icon={Clock3}
          accent="sun"
        />
        <StatCard
          label="Events ahead"
          value={productivity?.upcomingEvents || 0}
          note="On your calendar"
          icon={CalendarDays}
          accent="coral"
        />
      </div>
      <section className="panel analytics-panel">
        <div className="panel-heading">
          <div>
            <p className="kicker">TASK MIX</p>
            <h2>Status and priority</h2>
          </div>
          <Zap size={20} className="accent-icon" />
        </div>
        <div className="analytics-bars">
          {tasks.map((group) => (
            <div
              className="bar-row"
              key={`${group._id.status}-${group._id.priority}`}
            >
              <span>
                {group._id.status} / {group._id.priority}
              </span>
              <div>
                <i
                  style={{ width: `${Math.min(group.count * 10 + 8, 100)}%` }}
                />
              </div>
              <strong>{group.count}</strong>
            </div>
          ))}
          {!tasks.length && (
            <EmptyState label="Complete a few tasks to see your patterns." />
          )}
        </div>
      </section>
    </>
  );
}

function AIPage() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() =>
    api
      .get("/api/ai/conversations")
      .then((data) => {
        setConversations(data);
        if (!active && data[0]) setActive(data[0]);
      })
      .catch((e) => toast.error(e.message)), [active]);
  useEffect(() => {
    load();
  }, [load]);
  const newChat = () =>
    api
      .post("/api/ai/conversations", { title: "New conversation" })
      .then((data) => {
        setConversations([data, ...conversations]);
        setActive(data);
      });
  const ensureConversation = async () => {
    if (active?._id) {
      return active;
    }

    const conversation = await api.post("/api/ai/conversations", {
      title: "New AI Conversation",
    });

    setActive(conversation);

    return conversation;
  };
  const reloadConversation = async (conversationId) => {
    const conversation = await api.get(
      `/api/ai/conversations/${conversationId}`,
    );

    setActive(conversation);

    return conversation;
  };
  const send = async (event) => {
  event.preventDefault();

  if (!prompt.trim() || busy) return;

  const text = prompt.trim();
  
  setPrompt("");
  setBusy(true);

  try {
    const conversation = await ensureConversation();
    const conversationId = conversation._id;
    const lower = text.toLowerCase();
    // Planning requests
    const isPlanningRequest =
      /\b(plan|planning|schedule|prepare|preparation|organize)\b/.test(lower) &&
      /\b(today|tomorrow|day|week|interview|work|tasks|schedule)\b/.test(
        lower,
      );

    // Action requests that should use the AI agent
    const isActionRequest =
      /\b(create|add|make|delete|remove|update|complete|finish|mark|remind|schedule)\b/.test(
        lower,
      ) &&
      /\b(task|tasks|reminder|reminders|event|events|project|projects|daily plan|plan)\b/.test(
        lower,
      );

    let data;
    let assistantText;

    if (isPlanningRequest) {
      // AI planning endpoint
      data = await api.post("/api/ai/plan", {
        prompt: text,
      });

      assistantText =
        data.message ||
        `Created "${data.plan?.title || "your daily plan"}" with ${
          data.tasks?.length || 0
        } tasks.`;

      // Refresh Tasks and Daily Plans pages
      window.dispatchEvent(new Event("flowpilot:data-changed"));
    } else if (isActionRequest) {
      // AI agent endpoint
      data = await api.post("/api/ai/agent", {
        prompt: text,
        conversationId,
      });

      assistantText =
        data.reply ||
        (data.tool
          ? `Completed action: ${data.tool}`
          : "I processed your request.");

      // Tool executed successfully
      if (data.tool && data.result) {
        const resultText =
          typeof data.result === "string"
            ? data.result
            : JSON.stringify(data.result, null, 2);

        assistantText += `\n\nAction: ${data.tool}\n${resultText}`;

        // Refresh Tasks, Projects, Reminders, Calendar and Daily Plans
        window.dispatchEvent(new Event("flowpilot:data-changed"));
      }
    } else {
      // Normal conversation
      data = await api.post("/api/ai/chat", {
        prompt: text,
        conversationId,
      });

      assistantText = data.response;
    }

    await reloadConversation(conversationId);

    await load();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setBusy(false);
  }
};
  return (
    <div className="ai-layout">
      <aside className="conversation-panel">
        <div className="conversation-head">
          <div>
            <p className="kicker">YOUR CONTEXT</p>
            <h2>Conversations</h2>
          </div>
          <button
            className="circle-action"
            onClick={newChat}
            aria-label="New conversation"
          >
            <Plus size={16} />
          </button>
        </div>
        {conversations.map((conversation) => (
          <button
            className={`conversation-item ${active?._id === conversation._id ? "active" : ""}`}
            key={conversation._id}
            onClick={() => setActive(conversation)}
          >
            <MessageSquareText size={16} />
            <span>{conversation.title}</span>
          </button>
        ))}
        {!conversations.length && (
          <p className="muted small-copy">
            Start a conversation to give your companion a memory.
          </p>
        )}
      </aside>
      <section className="chat-panel">
        <div className="chat-heading">
          <div className="ai-avatar">
            <Sparkles size={17} />
          </div>
          <div>
            <p className="kicker">FLOWPILOT AI</p>
            <h1>{active?.title || "A thinking partner for your day"}</h1>
          </div>
          <span className="live-label">
            <span className="status-dot" />
            Online
          </span>
        </div>
        <div className="messages">
          {!active?.messages?.length ? (
            <div className="chat-empty">
              <div className="large-ai-icon">
                <Sparkles size={25} />
              </div>
              <h2>What are you carrying?</h2>
              <p className="muted">
                Ask for a plan, turn an intention into tasks, or make sense of a
                busy week.
              </p>
              <div className="prompt-chips">
                <button
                  onClick={() =>
                    setPrompt("Plan my most important work for today")
                  }
                >
                  Plan my day
                </button>
                <button
                  onClick={() => setPrompt("Help me prioritize my open tasks")}
                >
                  Prioritize tasks
                </button>
                <button
                  onClick={() =>
                    setPrompt("Create a high priority task for tomorrow")
                  }
                >
                  Create a task
                </button>
              </div>
            </div>
          ) : (
            active.messages.map((message, index) => (
              <div
                className={`message ${message.role}`}
                key={`${message.createdAt || "message"}-${index}`}
              >
                <span className="message-label">
                  {message.role === "user" ? "YOU" : "FLOWPILOT"}
                </span>
                <p>{message.content}</p>
              </div>
            ))
          )}
          {busy && (
            <div className="message assistant">
              <span className="message-label">FLOWPILOT</span>
              <p className="typing">
                <i />
                <i />
                <i />
              </p>
            </div>
          )}
        </div>
        <form className="chat-input" onSubmit={send}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask FlowPilot anything about your workflow..."
          />
          <button className="send-button" aria-label="Send message">
            <Send size={17} />
          </button>
        </form>
      </section>
    </div>
  );
}

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const saveProfile = (e) => {
    e.preventDefault();
    updateProfile(profile)
      .then(() => toast.success("Profile updated"))
      .catch((e) => toast.error(e.message));
  };
  const savePassword = (e) => {
    e.preventDefault();
    changePassword(passwords)
      .then(() => {
        setPasswords({ currentPassword: "", newPassword: "" });
        toast.success("Password changed");
      })
      .catch((e) => toast.error(e.message));
  };
  return (
    <>
      <PageHeader
        eyebrow="PERSONAL SETTINGS"
        title="Keep your details current."
        description="Your workspace identity and access controls."
      />
      <div className="settings-grid">
        <form className="panel stack-form" onSubmit={saveProfile}>
          <div className="panel-heading">
            <div>
              <p className="kicker">PROFILE</p>
              <h2>Identity</h2>
            </div>
            <UserRound size={19} />
          </div>
          <label>
            Name
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
          </label>
          <button className="primary-button">
            Save profile <Check size={16} />
          </button>
        </form>
        <form className="panel stack-form" onSubmit={savePassword}>
          <div className="panel-heading">
            <div>
              <p className="kicker">SECURITY</p>
              <h2>Change password</h2>
            </div>
            <Settings2 size={19} />
          </div>
          <label>
            Current password
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
            />
          </label>
          <label>
            New password
            <input
              minLength="6"
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
            />
          </label>
          <button className="secondary-button">
            Update password <Check size={16} />
          </button>
        </form>
      </div>
    </>
  );
}

function LoadingState({ label }) {
  return (
    <div className="loading-state">
      <span className="spinner" />
      {label}
    </div>
  );
}
function EmptyState({ label, action }) {
  return (
    <div className="empty-state">
      <Archive size={19} />
      <p>{label}</p>
      {action && (
        <button className="text-button" onClick={action}>
          Create one <Plus size={14} />
        </button>
      )}
    </div>
  );
}

export default App;
