import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import api from "./services/api";

const VISTAS_PUBLICAS = {
  INICIO: "inicio",
  LOGIN: "login",
  REGISTRO: "registro",
  VERIFICAR: "verificar"
};

const VISTAS_PRIVADAS = {
  DASHBOARD: "dashboard",
  CLASES: "clases",
  PERFIL: "perfil",
  ADMIN: "admin"
};

const TIEMPO_VERIFICACION = 300;
const CLASES_DISPONIBLES = [
  "Musculacion",
  "Cardio",
  "Clases personalizadas"
];

const OBJETIVOS_USUARIO = [
  { value: "perdida_peso", label: "Perdida de peso" },
  { value: "masa_muscular", label: "Ganancia de masa muscular" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "mente_cuerpo", label: "Mente y cuerpo" }
];

const WHATSAPP_LINK = "https://wa.me/+5493576477453";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  marginBottom: "12px",
  borderRadius: "14px",
  background: "#020617",
  color: "white",
  border: "1px solid #1e293b",
  outline: "none",
  transition: "all 0.2s ease"
};

const btnStyle = {
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "none",
  padding: "12px 16px",
  borderRadius: "14px",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
  transition: "all 0.2s ease"
};

const actionBtnStyle = {
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontWeight: "700"
};

const pageShellStyle = {
  minHeight: "100vh",
  background: [
    "radial-gradient(circle at top left, rgba(244,114,182,0.16), transparent 22%)",
    "radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 18%)",
    "linear-gradient(135deg, #020617, #0f172a 52%, #020617)"
  ].join(", "),
  color: "white",
  fontFamily: "system-ui, sans-serif"
};

const glassCardStyle = {
  background: "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.94))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
  minWidth: 0
};

const softPanelStyle = {
  background: "rgba(15,23,42,0.84)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "22px",
  boxShadow: "0 18px 45px rgba(2,6,23,0.2)",
  minWidth: 0
};

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
}

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function getHorariosDisponiblesPorFecha(fecha) {
  if (!fecha) {
    return [];
  }

  const dia = new Date(`${fecha}T00:00:00`).getDay();
  const horariosPorDia = {
    1: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
    2: ["09:00", "10:00", "11:00", "12:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
    3: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
    4: ["09:00", "10:00", "11:00", "12:00", "17:00", "18:00", "19:00", "20:00", "21:00"],
    5: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
  };

  return horariosPorDia[dia] || [];
}

function getDiaLabel(fecha) {
  if (!fecha) {
    return "";
  }

  const dias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  return dias[dia] || "";
}

function getUserInitials(user) {
  if (!user?.nombre) {
    return "LF";
  }

  const parts = user.nombre.trim().split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "LF";
}

function getMetricData({ clases, misClases, rutinaDeHoy, user, esAdmin }) {
  const disponiblesHoy = clases.filter((clase) => clase.fecha === getTodayKey()).length;

  return [
    {
      title: "Clases activas",
      value: String(clases.length),
      subtitle: "Agenda general disponible",
      accent: "#22c55e"
    },
    {
      title: "Tus reservas",
      value: String(misClases.length),
      subtitle: misClases[0]?.nombre || "Sin reservas activas",
      accent: "#f472b6"
    },
    {
      title: "Rutina de hoy",
      value: rutinaDeHoy?.foco || "Libre",
      subtitle: rutinaDeHoy?.titulo || "Todavia no hay plan cargado",
      accent: "#38bdf8"
    },
    {
      title: esAdmin ? "Modo actual" : "Bienestar",
      value: esAdmin ? "Admin" : "Fitness",
      subtitle: user?.objetivo ? user.objetivo.replaceAll("_", " ") : "Seguimiento activo",
      accent: "#facc15"
    },
    {
      title: "Clases de hoy",
      value: String(disponiblesHoy),
      subtitle: "Agenda del dia actual",
      accent: "#fb7185"
    }
  ];
}

function formatClaseResumen(clase) {
  if (!clase) {
    return "Ninguna";
  }

  const fechaTexto = clase.fecha ? `${getDiaLabel(clase.fecha)} ${clase.fecha}` : "Fecha a confirmar";
  const horaTexto = clase.hora || "Horario a confirmar";
  return `${clase.nombre} - ${fechaTexto} - ${horaTexto}`;
}

function handleInputMouseEnter(e) {
  e.currentTarget.style.borderColor = "#4ade80";
  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(74,222,128,0.12)";
}

function handleInputMouseLeave(e) {
  e.currentTarget.style.borderColor = "#1e293b";
  e.currentTarget.style.boxShadow = "none";
}

function handlePrimaryMouseEnter(e) {
  e.currentTarget.style.transform = "translateY(-2px)";
  e.currentTarget.style.boxShadow = "0 14px 28px rgba(34,197,94,0.25)";
}

function handlePrimaryMouseLeave(e) {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = "none";
}

function handleSecondaryHoverEnter(e) {
  e.currentTarget.style.opacity = "0.88";
  e.currentTarget.style.transform = "translateY(-1px)";
}

function handleSecondaryHoverLeave(e) {
  e.currentTarget.style.opacity = "1";
  e.currentTarget.style.transform = "translateY(0)";
}

function handleCardHoverEnter(e) {
  e.currentTarget.style.transform = "translateY(-4px)";
  e.currentTarget.style.borderColor = "rgba(244,114,182,0.2)";
  e.currentTarget.style.boxShadow = "0 24px 55px rgba(2,6,23,0.26)";
}

function handleCardHoverLeave(e) {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
  e.currentTarget.style.boxShadow = "0 18px 45px rgba(2,6,23,0.2)";
}

function BrandLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #f472b6, #ffffff 82%)",
          boxShadow: "0 14px 30px rgba(244,114,182,0.24)"
        }}
      />
      <div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: "900",
            letterSpacing: "1px",
            background: "linear-gradient(135deg, #f472b6, #ffffff 75%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          LOLIFIT
        </div>
        <div style={{ fontSize: "12px", opacity: 0.72, letterSpacing: "2px", textTransform: "uppercase" }}>
          Boutique Fitness
        </div>
      </div>
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(244,114,182,0.16)" : "transparent",
        border: active ? "1px solid rgba(244,114,182,0.32)" : "1px solid transparent",
        color: "white",
        padding: "12px 18px",
        borderRadius: "999px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontWeight: active ? "800" : "600"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = active ? "rgba(244,114,182,0.22)" : "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? "rgba(244,114,182,0.16)" : "transparent";
      }}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, subtitle, accent }) {
  return (
    <div
      style={{
        ...softPanelStyle,
        padding: "22px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s ease"
      }}
      onMouseEnter={handleCardHoverEnter}
      onMouseLeave={handleCardHoverLeave}
    >
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-20px",
          width: "110px",
          height: "110px",
          borderRadius: "999px",
          background: `radial-gradient(circle, ${accent}40, transparent 65%)`
        }}
      />
      <p style={{ margin: 0, opacity: 0.68, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.2px" }}>
        {title}
      </p>
      <h3 style={{ marginTop: "14px", marginBottom: "8px", fontSize: "28px" }}>
        {value}
      </h3>
      <p style={{ margin: 0, opacity: 0.84, lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children, style }) {
  return (
    <div
      style={{
        ...softPanelStyle,
        padding: "24px",
        minWidth: 0,
        ...style
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "18px"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "24px" }}>{title}</h2>
          {subtitle && (
            <p style={{ marginTop: "8px", marginBottom: 0, opacity: 0.72, lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Badge({ text, color = "#22c55e", background = "rgba(34,197,94,0.14)" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "999px",
        color,
        background,
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "0.3px"
      }}
    >
      {text}
    </span>
  );
}

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [vista, setVista] = useState(VISTAS_PUBLICAS.INICIO);
  const [tiempo, setTiempo] = useState(TIEMPO_VERIFICACION);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [profesor, setProfesor] = useState("");
  const [fechaClase, setFechaClase] = useState("");
  const [horaClase, setHoraClase] = useState("");
  const [cupos, setCupos] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoProfesor, setNuevoProfesor] = useState("");
  const [nuevaFechaClase, setNuevaFechaClase] = useState("");
  const [nuevaHoraClase, setNuevaHoraClase] = useState("");
  const [nuevosCupos, setNuevosCupos] = useState("");

  const [loading, setLoading] = useState(false);
  const [clases, setClases] = useState([]);

  const [codigo, setCodigo] = useState("");
  const [emailVerificar, setEmailVerificar] = useState("");
  const [objetivoUsuario, setObjetivoUsuario] = useState(user?.objetivo || "mantenimiento");
  const [planMensual, setPlanMensual] = useState(null);
  const [guardandoObjetivo, setGuardandoObjetivo] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    variant: "primary",
    onConfirm: null
  });

  const rutinaDeHoy = planMensual?.entries?.find((entry) => entry.fecha === getTodayKey());
  const esAdmin = user?.rol === "admin";
  const userInitials = getUserInitials(user);
  const vistaPrivadaActiva = Object.values(VISTAS_PRIVADAS).includes(vista)
    ? vista
    : VISTAS_PRIVADAS.DASHBOARD;
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1100;
  const minutos = Math.floor(tiempo / 60);
  const segundos = tiempo % 60;
  const horariosDisponibles = getHorariosDisponiblesPorFecha(fechaClase);
  const nuevosHorariosDisponibles = getHorariosDisponiblesPorFecha(nuevaFechaClase);
  const misClases = clases.filter((clase) =>
    clase.inscritos?.some((inscripto) => inscripto._id === user?._id)
  );
  const metricasDashboard = getMetricData({ clases, misClases, rutinaDeHoy, user, esAdmin });

  const fetchClases = async () => {
    try {
      const res = await api.get("/clases");
      setClases(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchClases();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    api.get("/perfil-plan")
      .then((res) => {
        setObjetivoUsuario(res.data.user.objetivo || "mantenimiento");
        setPlanMensual(res.data.planMensual);
        localStorage.setItem("user", JSON.stringify({
          ...user,
          objetivo: res.data.user.objetivo
        }));
      })
      .catch((err) => {
        console.log(err);
      });
  }, [user]);

  useEffect(() => {
    if (user && Object.values(VISTAS_PUBLICAS).includes(vista)) {
      setVista(VISTAS_PRIVADAS.DASHBOARD);
    }
  }, [user, vista]);

  useEffect(() => {
    if (vista !== VISTAS_PUBLICAS.VERIFICAR) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTiempo((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error("Codigo expirado");
          setVista(VISTAS_PUBLICAS.REGISTRO);
          return TIEMPO_VERIFICACION;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [vista]);

  const limpiarFormularioClase = () => {
    setNombre("");
    setProfesor("");
    setFechaClase("");
    setHoraClase("");
    setCupos("");
  };

  const login = async () => {
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo iniciar sesion");
    }
  };

  const registro = async () => {
    try {
      await api.post("/registro", { nombre, email, password });
      toast.success("Usuario creado");
      setEmailVerificar(email);
      setCodigo("");
      setTiempo(TIEMPO_VERIFICACION);
      setVista(VISTAS_PUBLICAS.VERIFICAR);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo completar el registro");
    }
  };

  const verificarCuenta = async () => {
    try {
      await api.post("/verificar", {
        email: emailVerificar || email,
        codigo
      });

      toast.success("Cuenta verificada");
      setCodigo("");
      setTiempo(TIEMPO_VERIFICACION);
      setVista(VISTAS_PUBLICAS.LOGIN);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo verificar la cuenta");
    }
  };

  const reenviarCodigo = async () => {
    try {
      await api.post("/reenviar-codigo", {
        email: emailVerificar || email
      });
      setTiempo(TIEMPO_VERIFICACION);
      toast.success("Codigo reenviado");
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo reenviar el codigo");
    }
  };

  const reservar = async (claseId) => {
    if (!user?._id) {
      toast.error("Tenes que iniciar sesion");
      return;
    }

    try {
      setLoading(true);
      await api.post("/reservar", {
        claseId,
        userId: user._id
      });
      toast.success("Reserva confirmada");
      await fetchClases();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo reservar la clase");
    } finally {
      setLoading(false);
    }
  };

  const eliminarClase = async (id) => {
    setConfirmDialog({
      open: true,
      title: "Eliminar clase",
      message: "Esta accion eliminara la clase y no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/clases/${id}`);
          toast.success("Clase eliminada");
          await fetchClases();
        } catch (err) {
          toast.error(err.response?.data?.mensaje || "No se pudo eliminar la clase");
        }
      }
    });
  };

  const cerrarSesion = () => {
    setConfirmDialog({
      open: true,
      title: "Cerrar sesion",
      message: "Quieres cerrar sesion y salir de tu cuenta?",
      confirmLabel: "Cerrar sesion",
      variant: "primary",
      onConfirm: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setPlanMensual(null);
        setObjetivoUsuario("mantenimiento");
        setEditandoId(null);
        setNuevoNombre("");
        setNuevoProfesor("");
        setNuevaFechaClase("");
        setNuevaHoraClase("");
        setNuevosCupos("");
        setCodigo("");
        setEmail("");
        setPassword("");
        setEmailVerificar("");
        setUser(null);
        setVista(VISTAS_PUBLICAS.INICIO);
      }
    });
  };

  const cerrarConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      confirmLabel: "Confirmar",
      variant: "primary",
      onConfirm: null
    });
  };

  const ejecutarConfirmacion = async () => {
    const action = confirmDialog.onConfirm;
    cerrarConfirmDialog();

    if (action) {
      await action();
    }
  };

  const editarClase = async (id) => {
    try {
      const response = await api.put(`/clases/${id}`, {
        nombre: nuevoNombre,
        profesor: nuevoProfesor,
        fecha: nuevaFechaClase,
        hora: nuevaHoraClase,
        cupos: nuevosCupos
      });

      setClases((prevClases) =>
        prevClases.map((clase) =>
          clase._id === id
            ? {
                ...clase,
                ...response.data
              }
            : clase
        )
      );

      setEditandoId(null);
      setNuevoNombre("");
      setNuevoProfesor("");
      setNuevaFechaClase("");
      setNuevaHoraClase("");
      setNuevosCupos("");
      toast.success("Clase actualizada");
      await fetchClases();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo actualizar la clase");
    }
  };

  const crearClase = async () => {
    try {
      await api.post("/crear-clase", {
        nombre,
        profesor,
        fecha: fechaClase,
        hora: horaClase,
        cupos
      });
      toast.success("Clase creada");
      limpiarFormularioClase();
      await fetchClases();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo crear la clase");
    }
  };

  const actualizarObjetivo = async () => {
    try {
      setGuardandoObjetivo(true);
      const res = await api.put("/perfil-objetivo", {
        objetivo: objetivoUsuario
      });

      setPlanMensual(res.data.planMensual);
      localStorage.setItem("user", JSON.stringify({
        ...user,
        objetivo: res.data.user.objetivo
      }));
      toast.success("Objetivo actualizado");
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo actualizar el objetivo");
    } finally {
      setGuardandoObjetivo(false);
    }
  };

  const comenzarEdicion = (clase) => {
    setEditandoId(clase._id);
    setNuevoNombre(clase.nombre || "");
    setNuevoProfesor(clase.profesor || "");
    setNuevaFechaClase(clase.fecha || "");
    setNuevaHoraClase(clase.hora || "");
    setNuevosCupos(clase.cupos || "");
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoNombre("");
    setNuevoProfesor("");
    setNuevaFechaClase("");
    setNuevaHoraClase("");
    setNuevosCupos("");
  };

  const renderClaseCard = (clase, { mostrarAdmin = false } = {}) => {
    const yaInscripto = clase.inscritos?.some((inscripto) => inscripto._id === user?._id);
    const inscritos = clase.inscritos || [];

    return (
      <div
        key={clase._id}
        style={{
          ...softPanelStyle,
          padding: isMobile ? "18px" : "22px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          transition: "all 0.25s ease",
          minWidth: 0
        }}
        onMouseEnter={handleCardHoverEnter}
        onMouseLeave={handleCardHoverLeave}
      >
        {editandoId === clase._id ? (
          <div
            style={{
              display: "grid",
              gap: "10px",
              padding: isMobile ? "14px" : "18px",
              borderRadius: "18px",
              background: "rgba(2,6,23,0.84)",
              border: "1px solid rgba(255,255,255,0.08)",
              minWidth: 0
            }}
          >
            <select
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            >
              <option value="">Selecciona una clase</option>
              {CLASES_DISPONIBLES.map((tipoClase) => (
                <option key={tipoClase} value={tipoClase}>
                  {tipoClase}
                </option>
              ))}
            </select>

            <input
              placeholder="Profesora o entrenador"
              value={nuevoProfesor}
              onChange={(e) => setNuevoProfesor(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            />

            <input
              type="date"
              value={nuevaFechaClase}
              onChange={(e) => {
                setNuevaFechaClase(e.target.value);
                setNuevaHoraClase("");
              }}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            />

            <select
              value={nuevaHoraClase}
              onChange={(e) => setNuevaHoraClase(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            >
              <option value="">Selecciona un horario</option>
              {nuevosHorariosDisponibles.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cupos"
              value={nuevosCupos}
              onChange={(e) => setNuevosCupos(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            />

            <div style={{ display: "flex", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
              <button
                type="button"
                onClick={() => editarClase(clase._id)}
                style={{
                  ...btnStyle,
                  flex: 1,
                  width: "auto",
                  marginTop: 0
                }}
                onMouseEnter={handlePrimaryMouseEnter}
                onMouseLeave={handlePrimaryMouseLeave}
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={cancelarEdicion}
                style={{
                  ...actionBtnStyle,
                  flex: 1,
                  background: "#111827",
                  color: "white",
                  border: "1px solid #334155"
                }}
                onMouseEnter={handleSecondaryHoverEnter}
                onMouseLeave={handleSecondaryHoverLeave}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
              <div>
                <Badge text={clase.nombre} color="#f9a8d4" background="rgba(244,114,182,0.14)" />
                <h3 style={{ marginTop: "14px", marginBottom: "8px", fontSize: isMobile ? "22px" : "25px", wordBreak: "break-word" }}>
                  {clase.profesor || "Profesora a definir"}
                </h3>
                <p style={{ margin: 0, opacity: 0.76, lineHeight: 1.6 }}>
                  Clase guiada con acompanamiento personalizado y foco claro en resultados.
                </p>
              </div>
              <Badge text={clase.cupos > 0 ? `${clase.cupos} cupos` : "Sin cupos"} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "12px"
              }}
            >
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Dia</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {clase.fecha ? getDiaLabel(clase.fecha) : "A confirmar"}
                </strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Fecha</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {clase.fecha || "A confirmar"}
                </strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Hora</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {clase.hora || "A confirmar"}
                </strong>
              </div>
            </div>

            {!mostrarAdmin && (
              <button
                type="button"
                onClick={() => reservar(clase._id)}
                disabled={loading || yaInscripto || clase.cupos === 0}
                style={{
                  ...btnStyle,
                  width: "100%",
                  background: yaInscripto
                    ? "#16a34a"
                    : "linear-gradient(135deg, #22c55e, #4ade80)",
                  cursor: loading || yaInscripto || clase.cupos === 0 ? "not-allowed" : "pointer",
                  opacity: loading || clase.cupos === 0 ? 0.8 : 1
                }}
                onMouseEnter={loading || yaInscripto || clase.cupos === 0 ? undefined : handlePrimaryMouseEnter}
                onMouseLeave={loading || yaInscripto || clase.cupos === 0 ? undefined : handlePrimaryMouseLeave}
              >
                {loading ? "Cargando..." : yaInscripto ? "Reservado" : "Reservar clase"}
              </button>
            )}

            {mostrarAdmin && (
              <>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                    <strong>Personas inscriptas</strong>
                    <Badge text={`${inscritos.length} registradas`} />
                  </div>
                  <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                    {inscritos.length > 0 ? (
                      inscritos.map((inscripto) => (
                        <div
                          key={inscripto._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            flexDirection: isMobile ? "column" : "row",
                            gap: "12px",
                            padding: "12px 14px",
                            borderRadius: "14px",
                            background: "rgba(2,6,23,0.65)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            wordBreak: "break-word"
                          }}
                        >
                          <span>{inscripto.nombre}</span>
                          <span style={{ opacity: 0.7 }}>{inscripto.email}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, opacity: 0.72 }}>
                        Todavia no hay inscriptas en esta clase.
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => comenzarEdicion(clase)}
                    style={{
                      ...actionBtnStyle,
                      background: "#f59e0b",
                      color: "black"
                    }}
                    onMouseEnter={handleSecondaryHoverEnter}
                    onMouseLeave={handleSecondaryHoverLeave}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarClase(clase._id)}
                    style={{
                      ...actionBtnStyle,
                      background: "#dc2626",
                      color: "white"
                    }}
                    onMouseEnter={handleSecondaryHoverEnter}
                    onMouseLeave={handleSecondaryHoverLeave}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const renderPublicLanding = () => (
    <div style={{ width: "100%", maxWidth: "1180px", margin: "0 auto", padding: isMobile ? "18px 14px 64px" : "28px 24px 80px", boxSizing: "border-box" }}>
      <header
        style={{
          ...glassCardStyle,
          padding: isMobile ? "16px" : "18px 24px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "18px",
          position: "sticky",
          top: "20px",
          zIndex: 5
        }}
      >
        <BrandLogo />
        <button
          type="button"
          onClick={() => setVista(VISTAS_PUBLICAS.LOGIN)}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white",
            padding: "12px 22px",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.color = "#000000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#ffffff";
          }}
        >
          Entrar
        </button>
      </header>

      <section
        style={{
          minHeight: "82vh",
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.2fr 0.8fr",
          gap: "26px",
          alignItems: "center",
          paddingTop: isMobile ? "26px" : "36px"
        }}
      >
        <div style={{ display: "grid", gap: "26px" }}>
          <div>
            <Badge text="Studio boutique femenino" color="#f9a8d4" background="rgba(244,114,182,0.14)" />
            <h1
              style={{
                marginTop: "22px",
                marginBottom: "16px",
                fontSize: isMobile ? "clamp(52px, 18vw, 84px)" : "clamp(58px, 10vw, 118px)",
                lineHeight: 0.9,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "2px",
                background: "linear-gradient(135deg, #f472b6, #ffffff 65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Loli Fit
            </h1>
            <p style={{ margin: 0, fontSize: isMobile ? "22px" : "28px", fontWeight: "800" }}>
              Transforma tu cuerpo
            </p>
            <p style={{ marginTop: "18px", marginBottom: 0, maxWidth: "620px", opacity: 0.82, lineHeight: 1.8 }}>
              Una experiencia femenina fitness boutique con seguimiento real, agenda clara,
              profesoras dedicadas y una plataforma privada para entrenar, reservar y sostener tu progreso.
            </p>
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
            <button
              type="button"
              onClick={() => setVista(VISTAS_PUBLICAS.REGISTRO)}
              style={{
                background: "linear-gradient(135deg, #f472b6, #ec4899)",
                border: "none",
                padding: "15px 28px",
                borderRadius: "999px",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 18px 40px rgba(236,72,153,0.28)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #facc15, #d4a017)";
                e.currentTarget.style.boxShadow = "0 18px 40px rgba(250,204,21,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #f472b6, #ec4899)";
                e.currentTarget.style.boxShadow = "0 18px 40px rgba(236,72,153,0.28)";
              }}
            >
              Unirme a la plataforma
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 820, behavior: "smooth" })}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "15px 24px",
                borderRadius: "999px",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={handleSecondaryHoverEnter}
              onMouseLeave={handleSecondaryHoverLeave}
            >
              Conocer el studio
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "18px" }}>
          <div
            style={{
              ...softPanelStyle,
              padding: "22px",
              minHeight: "230px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "auto -40px -30px auto",
                width: "180px",
                height: "180px",
                borderRadius: "999px",
                background: "radial-gradient(circle, rgba(244,114,182,0.26), transparent 60%)"
              }}
            />
            <p style={{ margin: 0, opacity: 0.68, textTransform: "uppercase", letterSpacing: "1.1px" }}>
              Experiencia privada
            </p>
            <h3 style={{ marginTop: "18px", marginBottom: "12px", fontSize: "30px" }}>
              Gestiona tus clases, tu objetivo y tu progreso en un solo lugar.
            </h3>
            <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.7 }}>
              Reservas claras, panel admin profesional y una experiencia visual premium pensada para LOLIFIT.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "18px"
            }}
          >
            <StatCard title="Clases centrales" value="3" subtitle="Musculacion, cardio y personalizadas" accent="#22c55e" />
            <StatCard title="Horarios activos" value="L a V" subtitle="Franjas configuradas segun cada dia" accent="#f472b6" />
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.05fr 0.95fr",
          gap: "26px",
          marginTop: "26px"
        }}
      >
        <SectionCard
          title="Un estudio pensado para tu mejor version"
          subtitle="Calidad, disciplina y acompanamiento real para mujeres que buscan un estandar alto."
        >
          <p style={{ margin: 0, lineHeight: 1.9, opacity: 0.9, wordBreak: "break-word" }}>
            LOLI FIT Studio es un estudio boutique femenino ubicado en el corazon de Arroyito.
            Creamos un espacio exclusivo para mujeres comprometidas con su bienestar, su crecimiento
            y su mejor version. Trabajamos con grupos reducidos y acompanamiento personalizado porque
            entendemos que los resultados reales requieren disciplina y decision. Elegimos calidad
            antes que cantidad, proceso antes que improvisacion y compromiso antes que excusas.
            Este es un lugar para mujeres que priorizan, invierten en si mismas y buscan superarse
            permanentemente. Bienvenida a tu mejor version y a tu estandar mas alto.
          </p>
        </SectionCard>

        <SectionCard
          title="Donde encontrarnos"
          subtitle="25 de Mayo 1020, Arroyito, Cordoba"
        >
          <div
            style={{
              borderRadius: "18px",
              overflow: "hidden",
              height: isMobile ? "300px" : "360px",
              background: "#0f172a",
              border: "1px solid #1e293b"
            }}
          >
            <iframe
              title="Mapa LOLIFIT"
              src="https://www.google.com/maps?q=25%20de%20Mayo%201020%2C%20Arroyito%2C%20Cordoba%2C%20Argentina&z=16&output=embed"
              style={{ border: 0, width: "100%", height: "100%", display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </SectionCard>
      </section>
    </div>
  );

  const renderAuth = () => (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px"
      }}
    >
      <div
        style={{
          ...glassCardStyle,
          width: "100%",
          maxWidth: "1040px",
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "0.95fr 1.05fr",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: isMobile ? "28px 22px" : "42px",
            background: "linear-gradient(160deg, rgba(244,114,182,0.18), rgba(15,23,42,0.2))",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "28px"
          }}
        >
          <BrandLogo />
          <div>
            <Badge text="Acceso privado" color="#f9a8d4" background="rgba(244,114,182,0.14)" />
            <h2 style={{ marginTop: "18px", marginBottom: "12px", fontSize: isMobile ? "32px" : "42px", lineHeight: 1.05 }}>
              Gestiona tus reservas, tu plan y tu progreso en una sola app.
            </h2>
            <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.8 }}>
              Una experiencia clara, elegante y funcional para alumnas y administracion del studio.
            </p>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Reservas organizadas</strong>
              <p style={{ marginBottom: 0, opacity: 0.72, lineHeight: 1.6 }}>
                Visualiza clases, horarios exactos y profesoras sin perder contexto.
              </p>
            </div>
            <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Seguimiento personal</strong>
              <p style={{ marginBottom: 0, opacity: 0.72, lineHeight: 1.6 }}>
                Tu objetivo y tu rutina diaria quedan visibles y accesibles.
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? "28px 18px" : "42px", minWidth: 0 }}>
          {vista === VISTAS_PUBLICAS.LOGIN && (
            <>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? "30px" : "34px" }}>Bienvenido</h2>
              <p style={{ marginTop: "8px", opacity: 0.74, lineHeight: 1.7 }}>
                Inicia sesion para entrar a tu panel privado LOLIFIT.
              </p>
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
              <button
                type="button"
                style={{ ...btnStyle, width: "100%" }}
                onClick={login}
                onMouseEnter={handlePrimaryMouseEnter}
                onMouseLeave={handlePrimaryMouseLeave}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => setVista(VISTAS_PUBLICAS.REGISTRO)}
                style={{
                  marginTop: "14px",
                  background: "transparent",
                  color: "white",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: "700"
                }}
              >
                Crear cuenta
              </button>
            </>
          )}

          {vista === VISTAS_PUBLICAS.REGISTRO && (
            <>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? "30px" : "34px" }}>Registro</h2>
              <p style={{ marginTop: "8px", opacity: 0.74, lineHeight: 1.7 }}>
                Crea tu cuenta y accede al panel privado del studio.
              </p>
              <input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
              <button
                type="button"
                style={{ ...btnStyle, width: "100%" }}
                onClick={registro}
                onMouseEnter={handlePrimaryMouseEnter}
                onMouseLeave={handlePrimaryMouseLeave}
              >
                Registrarse
              </button>
              <button
                type="button"
                onClick={() => setVista(VISTAS_PUBLICAS.LOGIN)}
                style={{
                  marginTop: "14px",
                  background: "transparent",
                  color: "white",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontWeight: "700"
                }}
              >
                Ya tengo cuenta
              </button>
            </>
          )}

          {vista === VISTAS_PUBLICAS.VERIFICAR && (
            <>
              <h2 style={{ marginTop: 0, fontSize: isMobile ? "30px" : "34px" }}>Verificar cuenta</h2>
              <p style={{ marginTop: "8px", opacity: 0.74, lineHeight: 1.7 }}>
                Ingresa el codigo enviado a tu email. Tiempo restante: {minutos}:{segundos.toString().padStart(2, "0")}
              </p>
              <input
                placeholder="Codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
              <button
                type="button"
                style={{ ...btnStyle, width: "100%" }}
                onClick={verificarCuenta}
                onMouseEnter={handlePrimaryMouseEnter}
                onMouseLeave={handlePrimaryMouseLeave}
              >
                Verificar
              </button>
              <button
                type="button"
                style={{
                  ...actionBtnStyle,
                  width: "100%",
                  marginTop: "10px",
                  background: "#111827",
                  color: "white",
                  border: "1px solid #334155"
                }}
                onClick={reenviarCodigo}
                onMouseEnter={handleSecondaryHoverEnter}
                onMouseLeave={handleSecondaryHoverLeave}
              >
                Reenviar codigo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div style={{ display: "grid", gap: "26px" }}>
      <section
        style={{
          ...glassCardStyle,
          padding: isMobile ? "22px 18px" : "30px",
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.1fr 0.9fr",
          gap: "22px"
        }}
      >
        <div>
          <Badge text="Panel privado" color="#f9a8d4" background="rgba(244,114,182,0.14)" />
          <h1 style={{ marginTop: "18px", marginBottom: "14px", fontSize: isMobile ? "34px" : "42px" }}>
            Inicio
          </h1>
          <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.8, maxWidth: "680px" }}>
            Bienvenida {user?.nombre}. Desde aqui puedes ver tu agenda, tu objetivo actual,
            las clases disponibles y el estado del studio en una vista clara y profesional.
          </p>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(244,114,182,0.14), rgba(34,197,94,0.12))",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <p style={{ marginTop: 0, opacity: 0.74, textTransform: "uppercase", letterSpacing: "1px" }}>
            Resumen del dia
          </p>
          <h3 style={{ marginTop: "12px", marginBottom: "8px", fontSize: "28px" }}>
            {rutinaDeHoy?.titulo || "Tu siguiente paso empieza hoy"}
          </h3>
          <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.8 }}>
            {rutinaDeHoy?.detalle || "Define tu objetivo en perfil para activar una rutina personalizada del dia."}
          </p>
          <div style={{ marginTop: "18px" }}>
            <Badge
              text={`Foco: ${rutinaDeHoy?.foco || "Organizacion"}`}
              color="#22c55e"
              background="rgba(34,197,94,0.14)"
            />
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "18px"
        }}
      >
        {metricasDashboard.map((metrica) => (
          <StatCard
            key={metrica.title}
            title={metrica.title}
            value={metrica.value}
            subtitle={metrica.subtitle}
            accent={metrica.accent}
          />
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.1fr 0.9fr",
          gap: "22px"
        }}
      >
        <SectionCard
          title="Tus clases reservadas"
          subtitle="Acceso rapido a las clases que ya tienes confirmadas."
          action={
            <button
              type="button"
              onClick={() => setVista(VISTAS_PRIVADAS.CLASES)}
              style={{
                ...actionBtnStyle,
                background: "rgba(255,255,255,0.06)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
              onMouseEnter={handleSecondaryHoverEnter}
              onMouseLeave={handleSecondaryHoverLeave}
            >
              Ver clases
            </button>
          }
        >
          <div style={{ display: "grid", gap: "12px" }}>
            {misClases.length > 0 ? (
              misClases.slice(0, 3).map((clase) => (
                <div
                  key={clase._id}
                  style={{
                    padding: "16px 18px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    minWidth: 0
                  }}
                >
                  <div>
                    <strong>{clase.nombre}</strong>
                    <p style={{ marginBottom: 0, opacity: 0.72 }}>
                      {getDiaLabel(clase.fecha)} {clase.fecha} - {clase.hora}
                    </p>
                  </div>
                  <Badge text={clase.profesor || "A definir"} />
                </div>
              ))
            ) : (
              <p style={{ margin: 0, opacity: 0.74 }}>
                Todavia no tienes reservas activas.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Agenda del studio"
          subtitle="Vista rapida de las proximas clases publicadas."
        >
          <div style={{ display: "grid", gap: "12px" }}>
            {clases.slice(0, 4).map((clase) => (
              <div
                key={clase._id}
                style={{
                  padding: "14px 16px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <strong>{clase.nombre}</strong>
                <p style={{ margin: "8px 0 0", opacity: 0.72, lineHeight: 1.6 }}>
                  {clase.profesor || "Profesora a definir"} - {clase.fecha || "Fecha a confirmar"} - {clase.hora || "Hora a confirmar"}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );

  const renderClases = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <SectionCard
        title="Clases"
        subtitle="Reserva facilmente y visualiza toda la agenda del studio con fechas y horarios exactos."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px"
          }}
        >
          {clases.map((clase) => renderClaseCard(clase))}
        </div>
      </SectionCard>
    </div>
  );

  const renderPerfil = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "0.9fr 1.1fr",
          gap: "22px"
        }}
      >
        <SectionCard title="Perfil" subtitle="Tus datos principales dentro de la plataforma LOLIFIT.">
          <div style={{ display: "grid", gap: "14px" }}>
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f472b6, #ec4899)",
                fontWeight: "900",
                fontSize: "26px",
                boxShadow: "0 18px 35px rgba(236,72,153,0.26)"
              }}
            >
              {userInitials}
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.65 }}>Nombre</p>
              <strong style={{ fontSize: "22px" }}>{user?.nombre}</strong>
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.65 }}>Email</p>
              <strong>{user?.email}</strong>
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.65 }}>Clase reservada</p>
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                {misClases.length > 0 ? (
                  misClases.map((clase) => (
                    <div key={clase._id} style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                      {formatClaseResumen(clase)}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                    Clase reservada: Ninguna
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Objetivo y rutina diaria"
          subtitle="Elige tu enfoque y mantene visible tu plan del dia."
        >
          <select
            value={objetivoUsuario}
            onChange={(e) => setObjetivoUsuario(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          >
            {OBJETIVOS_USUARIO.map((objetivo) => (
              <option key={objetivo.value} value={objetivo.value}>
                {objetivo.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={actualizarObjetivo}
            style={{ ...btnStyle, width: "100%", marginTop: 0 }}
            onMouseEnter={handlePrimaryMouseEnter}
            onMouseLeave={handlePrimaryMouseLeave}
            disabled={guardandoObjetivo}
          >
            {guardandoObjetivo ? "Guardando..." : "Guardar objetivo"}
          </button>

          <div
            style={{
              marginTop: "18px",
              padding: "18px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <p style={{ marginTop: 0, opacity: 0.65, textTransform: "uppercase", fontSize: "12px" }}>
              Rutina de hoy
            </p>
            <h3 style={{ marginTop: "10px", marginBottom: "10px", fontSize: "28px" }}>
              {rutinaDeHoy?.titulo || "Sin rutina generada"}
            </h3>
            <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.8 }}>
              {rutinaDeHoy?.detalle || "Actualiza tu objetivo para generar o renovar tu plan mensual."}
            </p>
            <div style={{ marginTop: "16px" }}>
              <Badge text={`Foco: ${rutinaDeHoy?.foco || "Pendiente"}`} />
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );

  const renderAdmin = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "0.92fr 1.08fr",
          gap: "22px"
        }}
      >
        <SectionCard
          title="Panel de administracion"
          subtitle="Publica clases con fecha exacta, profesora responsable y horario valido segun la franja configurada."
        >
          <select
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          >
            <option value="">Selecciona una clase</option>
            {CLASES_DISPONIBLES.map((tipoClase) => (
              <option key={tipoClase} value={tipoClase}>
                {tipoClase}
              </option>
            ))}
          </select>

          <input
            placeholder="Nombre de quien dicta la clase"
            value={profesor}
            onChange={(e) => setProfesor(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <input
            type="date"
            value={fechaClase}
            onChange={(e) => {
              setFechaClase(e.target.value);
              setHoraClase("");
            }}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <select
            value={horaClase}
            onChange={(e) => setHoraClase(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          >
            <option value="">Selecciona un horario</option>
            {horariosDisponibles.map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Cupos"
            value={cupos}
            onChange={(e) => setCupos(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <button
            type="button"
            onClick={crearClase}
            style={{ ...btnStyle, width: "100%", marginTop: 0 }}
            onMouseEnter={handlePrimaryMouseEnter}
            onMouseLeave={handlePrimaryMouseLeave}
          >
            Crear clase
          </button>
        </SectionCard>

        <SectionCard
          title="Reglas de agenda"
          subtitle="La plataforma ya controla automaticamente las franjas permitidas."
        >
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Lunes, miercoles y viernes</strong>
              <p style={{ marginBottom: 0, opacity: 0.72 }}>07:00 a 10:00 y 14:00 a 19:00</p>
            </div>
            <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Martes y jueves</strong>
              <p style={{ marginBottom: 0, opacity: 0.72 }}>09:00 a 12:00 y 17:00 a 21:00</p>
            </div>
            <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Clases principales</strong>
              <p style={{ marginBottom: 0, opacity: 0.72 }}>Musculacion, Cardio y Clases personalizadas</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Gestion de clases"
        subtitle="Edita, elimina o revisa las personas inscriptas en cada clase publicada."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "18px"
          }}
        >
          {clases.map((clase) => renderClaseCard(clase, { mostrarAdmin: true }))}
        </div>
      </SectionCard>
    </div>
  );

  const renderPrivateContent = () => {
    if (vistaPrivadaActiva === VISTAS_PRIVADAS.PERFIL) {
      return renderPerfil();
    }

    if (vistaPrivadaActiva === VISTAS_PRIVADAS.CLASES) {
      return renderClases();
    }

    if (vistaPrivadaActiva === VISTAS_PRIVADAS.ADMIN && esAdmin) {
      return renderAdmin();
    }

    return renderDashboard();
  };

  return (
    <>
      <Toaster />

      {confirmDialog.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 50
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)"
            }}
          >
            <p style={{ margin: 0, color: "#f9a8d4", fontWeight: "900", letterSpacing: "0.6px" }}>
              LOLIFIT
            </p>
            <h3 style={{ marginTop: "14px", marginBottom: "10px", fontSize: "24px" }}>
              {confirmDialog.title}
            </h3>
            <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.7 }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={cerrarConfirmDialog}
                style={{
                  flex: 1,
                  background: "#111827",
                  border: "1px solid #334155",
                  padding: "12px",
                  borderRadius: "12px",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={handleSecondaryHoverEnter}
                onMouseLeave={handleSecondaryHoverLeave}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={ejecutarConfirmacion}
                style={{
                  flex: 1,
                  background: confirmDialog.variant === "danger"
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  padding: "12px",
                  borderRadius: "12px",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={handlePrimaryMouseEnter}
                onMouseLeave={handlePrimaryMouseLeave}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {!user && vista === VISTAS_PUBLICAS.INICIO && (
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 20,
            background: "#22c55e",
            color: "white",
            textDecoration: "none",
            width: "58px",
            height: "58px",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "900",
            boxShadow: "0 20px 40px rgba(34,197,94,0.35)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={handlePrimaryMouseEnter}
          onMouseLeave={handlePrimaryMouseLeave}
        >
          WA
        </a>
      )}

      <div style={{ ...pageShellStyle, overflowX: "hidden" }}>
        {!user ? (
          <>
            {vista === VISTAS_PUBLICAS.INICIO && renderPublicLanding()}
            {vista !== VISTAS_PUBLICAS.INICIO && renderAuth()}
          </>
        ) : (
          <div style={{ width: "100%", maxWidth: "1380px", margin: "0 auto", padding: isMobile ? "16px 12px 48px" : "20px 24px 60px", boxSizing: "border-box" }}>
            <header
              style={{
                ...glassCardStyle,
                padding: isMobile ? "16px" : "18px 24px",
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr",
                alignItems: "center",
                gap: "18px",
                position: "sticky",
                top: "20px",
                zIndex: 8
              }}
            >
              <div style={{ justifySelf: isMobile ? "center" : "start" }}>
                <BrandLogo />
              </div>

              <nav style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "center", minWidth: 0 }}>
                <NavButton
                  label="Inicio"
                  active={vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD}
                  onClick={() => setVista(VISTAS_PRIVADAS.DASHBOARD)}
                />
                <NavButton
                  label="Clases"
                  active={vistaPrivadaActiva === VISTAS_PRIVADAS.CLASES}
                  onClick={() => setVista(VISTAS_PRIVADAS.CLASES)}
                />
                <NavButton
                  label="Perfil"
                  active={vistaPrivadaActiva === VISTAS_PRIVADAS.PERFIL}
                  onClick={() => setVista(VISTAS_PRIVADAS.PERFIL)}
                />
                {esAdmin && (
                  <NavButton
                    label="Admin"
                    active={vistaPrivadaActiva === VISTAS_PRIVADAS.ADMIN}
                    onClick={() => setVista(VISTAS_PRIVADAS.ADMIN)}
                  />
                )}
              </nav>

              <button
                type="button"
                onClick={() => setVista(VISTAS_PRIVADAS.PERFIL)}
                style={{
                  justifySelf: isMobile ? "center" : "end",
                  width: "50px",
                  height: "50px",
                  borderRadius: "999px",
                  border: "1px solid rgba(249,168,212,0.35)",
                  background: "linear-gradient(135deg, #f472b6, #ec4899)",
                  color: "white",
                  fontWeight: "900",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 12px 24px rgba(236,72,153,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 16px 28px rgba(236,72,153,0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(236,72,153,0.2)";
                }}
              >
                {userInitials}
              </button>
            </header>

            {vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD && (
              <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={cerrarSesion}
                  style={{
                    ...actionBtnStyle,
                    background: "#111827",
                    color: "white",
                    border: "1px solid #334155"
                  }}
                  onMouseEnter={handleSecondaryHoverEnter}
                  onMouseLeave={handleSecondaryHoverLeave}
                >
                  Logout
                </button>
              </div>
            )}

            <main style={{ marginTop: "22px" }}>
              {renderPrivateContent()}
            </main>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
