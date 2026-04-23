import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import api from "./services/api";
import logoImage from "./img/logo.jpeg";

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
const VALOR_CREDITO_ARS = 5000;
const PACKS_MENSUALES = [
  {
    id: "pack_2x_semana",
    nombre: "2 veces por semana",
    creditos: 9,
    precioARS: 45000
  },
  {
    id: "pack_3x_semana",
    nombre: "3 veces por semana",
    creditos: 10,
    precioARS: 50000
  }
];
const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" }
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

function getCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayWeekday() {
  return new Date().getDay();
}

function getDiaLabel(diaSemana) {
  const found = DIAS_SEMANA.find((dia) => dia.value === Number(diaSemana));
  return found?.label || "";
}

function buildDiasLabel(diasSemana = []) {
  return diasSemana.map((dia) => getDiaLabel(dia)).join(" / ");
}

function getHorariosDisponiblesPorDia(diaSemana) {
  const horariosPorDia = {
    1: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
    2: ["08:00", "09:00", "10:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    3: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
    4: ["08:00", "09:00", "10:00", "18:00", "19:00", "20:00", "21:00", "22:00"],
    5: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
  };

  return horariosPorDia[Number(diaSemana)] || [];
}

function getHorariosDisponiblesPorDias(diasSemana = []) {
  if (!diasSemana.length) {
    return [];
  }

  const horariosPorDia = diasSemana.map((dia) => getHorariosDisponiblesPorDia(dia));
  return horariosPorDia.reduce((acc, horariosActuales) =>
    acc.filter((hora) => horariosActuales.includes(hora))
  );
}

function getUserInitials(user) {
  if (!user?.nombre) {
    return "LF";
  }

  const parts = user.nombre.trim().split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "LF";
}

function getMetricData({ clases, misClases, rutinaDeHoy, user, esAdmin }) {
  const disponiblesHoy = clases.filter((clase) => clase.diasSemana?.includes(getTodayWeekday())).length;
  const packLabel = user?.packActivo?.nombre || "Sin pack activo";

  return [
    {
      title: "Clases semanales",
      value: String(clases.length),
      subtitle: "Agenda recurrente activa",
      accent: "#22c55e"
    },
    {
      title: "Tus reservas",
      value: String(misClases.length),
      subtitle: misClases[0]?.horario || "Sin reservas activas",
      accent: "#f472b6"
    },
    {
      title: "Creditos",
      value: String(user?.creditos || 0),
      subtitle: packLabel,
      accent: "#facc15"
    },
    {
      title: "Rutina de hoy",
      value: rutinaDeHoy?.foco || "Libre",
      subtitle: rutinaDeHoy?.titulo || "Todavia no hay plan cargado",
      accent: "#38bdf8"
    },
    {
      title: esAdmin ? "Modo actual" : "Agenda de hoy",
      value: esAdmin ? "Admin" : `${disponiblesHoy}`,
      subtitle: esAdmin ? "Gestion semanal activa" : "Bloques disponibles hoy",
      accent: "#fb7185"
    }
  ];
}

function formatClaseResumen(clase) {
  if (!clase) {
    return "Ninguna";
  }

  return `${clase.nombre} - ${clase.diasLabel || buildDiasLabel(clase.diasSemana)} - ${clase.hora}`;
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

function BrandLogo({ compact = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <img
        src={logoImage}
        alt="LOLIFIT"
        style={{
          width: compact ? "36px" : "42px",
          height: compact ? "36px" : "42px",
          borderRadius: compact ? "12px" : "14px",
          objectFit: "cover",
          boxShadow: "0 14px 30px rgba(244,114,182,0.24)",
          display: "block"
        }}
      />
      <div>
        <div
          style={{
            fontSize: compact ? "22px" : "26px",
            fontWeight: "900",
            letterSpacing: "1px",
            background: "linear-gradient(135deg, #f472b6, #ffffff 75%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          LOLIFIT
        </div>
        <div style={{ fontSize: compact ? "10px" : "12px", opacity: 0.72, letterSpacing: compact ? "1.4px" : "2px", textTransform: "uppercase" }}>
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

function MobileDisclosure({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden"
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          textAlign: "left",
          fontWeight: "800"
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.72, fontSize: "18px", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {children}
        </div>
      )}
    </div>
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
        padding: "22px",
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

function ScrollHint({ text }) {
  return (
    <div
      style={{
        marginBottom: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
      }}
    >
      <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.6 }}>
        {text}
      </p>
      <Badge text="Desliza horizontalmente" color="#38bdf8" background="rgba(56,189,248,0.14)" />
    </div>
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
  const [diasSemanaClase, setDiasSemanaClase] = useState([]);
  const [horaClase, setHoraClase] = useState("");
  const [cupoMaximo, setCupoMaximo] = useState("");
  const [creditosCosto, setCreditosCosto] = useState("9");

  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoProfesor, setNuevoProfesor] = useState("");
  const [nuevoDiasSemanaClase, setNuevoDiasSemanaClase] = useState([]);
  const [nuevaHoraClase, setNuevaHoraClase] = useState("");
  const [nuevoCupoMaximo, setNuevoCupoMaximo] = useState("");
  const [nuevoCreditosCosto, setNuevoCreditosCosto] = useState("9");

  const [loadingReservaId, setLoadingReservaId] = useState(null);
  const [clases, setClases] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [emailVerificar, setEmailVerificar] = useState("");
  const [objetivoUsuario, setObjetivoUsuario] = useState(user?.objetivo || "mantenimiento");
  const [planMensual, setPlanMensual] = useState(null);
  const [guardandoObjetivo, setGuardandoObjetivo] = useState(false);
  const [comprandoPackId, setComprandoPackId] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [adminUsuarios, setAdminUsuarios] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [adminPackId, setAdminPackId] = useState("");
  const [adminCreditosManual, setAdminCreditosManual] = useState("");
  const [adminMotivo, setAdminMotivo] = useState("pago efectivo");
  const [asignandoCreditos, setAsignandoCreditos] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(PACKS_MENSUALES[0].id);
  const [customCreditos, setCustomCreditos] = useState("1");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const isSmallMobile = viewportWidth < 480;
  const isTablet = viewportWidth < 1100;
  const minutos = Math.floor(tiempo / 60);
  const segundos = tiempo % 60;
  const horariosDisponibles = getHorariosDisponiblesPorDias(diasSemanaClase);
  const nuevosHorariosDisponibles = getHorariosDisponiblesPorDias(nuevoDiasSemanaClase);
  const misClases = clases.filter((clase) =>
    clase.inscritos?.some((inscripto) => inscripto._id === user?._id)
  );
  const metricasDashboard = getMetricData({ clases, misClases, rutinaDeHoy, user, esAdmin });
  const metricasDashboardVisibles = isSmallMobile
    ? metricasDashboard.slice(0, 4)
    : isMobile
      ? metricasDashboard
      : metricasDashboard;
  const clasesDeHoy = clases.filter((clase) => clase.diasSemana?.includes(getTodayWeekday()));
  const selectedPack = PACKS_MENSUALES.find((pack) => pack.id === selectedPackId) || PACKS_MENSUALES[0];
  const selectedAdminUser = adminUsuarios.find((usuario) => usuario._id === adminUserId);
  const customCreditosNumber = Math.max(Number(customCreditos) || 0, 0);
  const customMontoARS = customCreditosNumber * VALOR_CREDITO_ARS;

  const syncStoredUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const fetchMovimientos = async () => {
    if (!user?._id) {
      return;
    }

    try {
      const res = await api.get("/mis-movimientos");
      setMovimientos(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAdminUsuarios = async () => {
    if (!user?._id || !esAdmin) {
      return;
    }

    try {
      const res = await api.get("/admin/usuarios");
      setAdminUsuarios(res.data);
    } catch (err) {
      console.log(err);
    }
  };

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
    if (!user?._id) {
      return;
    }

    api.get("/perfil-plan")
      .then((res) => {
        setObjetivoUsuario(res.data.user.objetivo || "mantenimiento");
        setPlanMensual(res.data.planMensual);
        setUser((prevUser) => {
          const nextUser = {
            ...(prevUser || {}),
            ...res.data.user
          };
          localStorage.setItem("user", JSON.stringify(nextUser));
          return nextUser;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) {
      setMovimientos([]);
      setAdminUsuarios([]);
      return;
    }

    api.get("/mis-movimientos")
      .then((res) => {
        setMovimientos(res.data);
      })
      .catch((err) => {
        console.log(err);
      });

    if (esAdmin) {
      api.get("/admin/usuarios")
        .then((res) => {
          setAdminUsuarios(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setAdminUsuarios([]);
    }
  }, [user?._id, esAdmin]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const mpStatus = params.get("status") || params.get("collection_status");
    const paymentId = params.get("payment_id") || params.get("collection_id");

    if (!mpStatus && !paymentId) {
      return;
    }

    api.get("/mis-movimientos")
      .then((res) => {
        setMovimientos(res.data);
      })
      .catch((err) => {
        console.log(err);
      });

    api.get("/perfil-plan")
      .then((res) => {
        setUser((prevUser) => {
          const nextUser = {
            ...(prevUser || {}),
            ...res.data.user
          };
          localStorage.setItem("user", JSON.stringify(nextUser));
          return nextUser;
        });
        setPlanMensual(res.data.planMensual);
      })
      .catch((err) => {
        console.log(err);
      });

    if (mpStatus === "approved") {
      toast.success("Pago recibido. Tus creditos se actualizaran automaticamente.");
    } else if (mpStatus === "pending") {
      toast("Pago pendiente. Te avisaremos cuando se acredite.");
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [user?._id]);

  useEffect(() => {
    if (user && Object.values(VISTAS_PUBLICAS).includes(vista)) {
      setVista(VISTAS_PRIVADAS.DASHBOARD);
    }
  }, [user, vista]);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, vista]);

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
    setDiasSemanaClase([]);
    setHoraClase("");
    setCupoMaximo("");
    setCreditosCosto("9");
  };

  const toggleDiaSemana = (dia, setter) => {
    setter((prev) => {
      const existe = prev.includes(dia);
      const next = existe ? prev.filter((item) => item !== dia) : [...prev, dia];
      return next.sort((a, b) => a - b);
    });
  };

  const login = async () => {
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      syncStoredUser(res.data.user);
      setVista(VISTAS_PRIVADAS.DASHBOARD);
      toast.success("Sesion iniciada");
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

  const iniciarPagoMercadoPago = async ({ tipo, pack = null, cantidadCreditos = null }) => {
    try {
      const compraId = pack?.id || tipo;
      setComprandoPackId(compraId);

      const payload = { tipo };

      if (tipo === "custom") {
        if (!cantidadCreditos || Number(cantidadCreditos) <= 0) {
          toast.error("Ingresa una cantidad valida de creditos");
          return;
        }

        payload.cantidadCreditos = Number(cantidadCreditos);
      }

      const res = await api.post("/crear-pago", payload);
      const checkoutUrl = res.data.url || res.data.init_point || res.data.sandbox_init_point;

      if (!checkoutUrl) {
        toast.error("No se recibio la URL de pago");
        console.log("RESPUESTA MP SIN URL:", res.data);
        return;
      }

      setCreditModalOpen(false);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.log("ERROR FRONT MP:", err.response?.data || err);
      toast.error(
        err.response?.data?.error ||
        err.response?.data?.mensaje ||
        "No se pudo realizar el pago con Mercado Pago"
      );
    } finally {
      setComprandoPackId(null);
    }
  };

  const asignarCreditosManual = async () => {
    try {
      setAsignandoCreditos(true);
      const payload = {
        userId: adminUserId,
        motivo: adminMotivo
      };

      if (adminPackId) {
        payload.packId = adminPackId;
      } else {
        payload.creditos = Number(adminCreditosManual);
      }

      const res = await api.post("/admin/ajustar-creditos", payload);
      toast.success("Creditos asignados");

      if (String(user?._id) === String(adminUserId)) {
        syncStoredUser({
          ...user,
          ...res.data.user
        });
      }

      setAdminUserId("");
      setAdminPackId("");
      setAdminCreditosManual("");
      setAdminMotivo("pago efectivo");
      await fetchAdminUsuarios();
      await fetchMovimientos();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudieron asignar los creditos");
    } finally {
      setAsignandoCreditos(false);
    }
  };

  const reservar = async (claseId) => {
    if (!user?._id) {
      toast.error("Tenes que iniciar sesion");
      return;
    }

    try {
      setLoadingReservaId(claseId);
      const res = await api.post("/reservar", { claseId });
      syncStoredUser({
        ...user,
        ...res.data.user
      });
      toast.success("Reserva mensual confirmada");
      await fetchClases();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo reservar la clase");
    } finally {
      setLoadingReservaId(null);
    }
  };

  const eliminarClase = async (id) => {
    setConfirmDialog({
      open: true,
      title: "Eliminar clase",
      message: "Esta accion eliminara la plantilla semanal y sus reservas activas del mes.",
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
        setNuevoDiasSemanaClase([]);
        setNuevaHoraClase("");
        setNuevoCupoMaximo("");
        setNuevoCreditosCosto("9");
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
      await api.put(`/clases/${id}`, {
        nombre: nuevoNombre,
        profesor: nuevoProfesor,
        diasSemana: nuevoDiasSemanaClase,
        hora: nuevaHoraClase,
        cupoMaximo: Number(nuevoCupoMaximo),
        creditosCosto: Number(nuevoCreditosCosto)
      });

      setEditandoId(null);
      setNuevoNombre("");
      setNuevoProfesor("");
      setNuevoDiasSemanaClase([]);
      setNuevaHoraClase("");
      setNuevoCupoMaximo("");
      setNuevoCreditosCosto("9");
      toast.success("Clase semanal actualizada");
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
        diasSemana: diasSemanaClase,
        hora: horaClase,
        cupoMaximo: Number(cupoMaximo),
        creditosCosto: Number(creditosCosto)
      });
      toast.success("Clase semanal creada");
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
      syncStoredUser({
        ...user,
        ...res.data.user
      });
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
    setNuevoDiasSemanaClase(clase.diasSemana || []);
    setNuevaHoraClase(clase.hora || "");
    setNuevoCupoMaximo(String(clase.cupoMaximo || ""));
    setNuevoCreditosCosto(String(clase.creditosCosto || 9));
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoNombre("");
    setNuevoProfesor("");
    setNuevoDiasSemanaClase([]);
    setNuevaHoraClase("");
    setNuevoCupoMaximo("");
    setNuevoCreditosCosto("9");
  };

  const renderClaseCard = (clase, { mostrarAdmin = false } = {}) => {
    const yaInscripto = clase.inscritos?.some((inscripto) => inscripto._id === user?._id);
    const inscritos = clase.inscritos || [];
    const costoClase = Number(clase.creditosCosto || 9);
    const sinCreditos = (user?.creditos || 0) < costoClase;

    return (
      <div
        key={clase._id}
        style={{
          ...softPanelStyle,
          padding: isSmallMobile ? "16px" : isMobile ? "18px" : "22px",
          display: "flex",
          flexDirection: "column",
          gap: isSmallMobile ? "16px" : "18px",
          transition: "all 0.25s ease",
          minWidth: 0,
          flex: "0 0 auto",
          width: isSmallMobile ? "88vw" : isMobile ? "78vw" : "360px",
          maxWidth: "100%",
          scrollSnapAlign: "start"
        }}
        onMouseEnter={handleCardHoverEnter}
        onMouseLeave={handleCardHoverLeave}
      >
        {editandoId === clase._id ? (
          <div
            style={{
              display: "grid",
              gap: "10px",
              padding: isSmallMobile ? "12px" : isMobile ? "14px" : "18px",
              borderRadius: "18px",
              background: "rgba(2,6,23,0.84)",
              border: "1px solid rgba(255,255,255,0.08)",
              minWidth: 0
            }}
          >
            <input
              placeholder="Nombre de la clase"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            />

            <input
              placeholder="Profesora o entrenador"
              value={nuevoProfesor}
              onChange={(e) => setNuevoProfesor(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            />

            <div style={{ marginBottom: "12px" }}>
              <p style={{ marginTop: 0, marginBottom: "10px", opacity: 0.72 }}>Dias recurrentes</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {DIAS_SEMANA.map((dia) => {
                  const activo = nuevoDiasSemanaClase.includes(dia.value);
                  return (
                    <button
                      key={dia.value}
                      type="button"
                      onClick={() => {
                        toggleDiaSemana(dia.value, setNuevoDiasSemanaClase);
                        setNuevaHoraClase("");
                      }}
                      style={{
                        ...actionBtnStyle,
                        background: activo ? "rgba(244,114,182,0.18)" : "rgba(255,255,255,0.05)",
                        color: "white",
                        border: activo ? "1px solid rgba(244,114,182,0.35)" : "1px solid rgba(255,255,255,0.06)"
                      }}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>

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
              placeholder="Cupo maximo"
              value={nuevoCupoMaximo}
              onChange={(e) => setNuevoCupoMaximo(e.target.value)}
              style={inputStyle}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
            />

            <input
              type="number"
              placeholder="Costo en creditos"
              value={nuevoCreditosCosto}
              onChange={(e) => setNuevoCreditosCosto(e.target.value)}
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
                  Reserva este bloque recurrente y quedas anotado automaticamente en todos los turnos del mes para {clase.diasLabel?.toLowerCase()} a las {clase.hora}.
                </p>
              </div>
              <Badge text={`${clase.cuposDisponibles} cupos libres`} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isSmallMobile
                  ? "1fr"
                  : isMobile
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "12px"
              }}
            >
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Dias</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {clase.diasLabel || buildDiasLabel(clase.diasSemana)}
                </strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Hora</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {clase.hora}
                </strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Reservas</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {clase.reservasCount}/{clase.cupoMaximo}
                </strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <p style={{ margin: 0, opacity: 0.65, fontSize: "12px", textTransform: "uppercase" }}>Costo</p>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  {costoClase} creditos
                </strong>
              </div>
            </div>

            {!mostrarAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => reservar(clase._id)}
                  disabled={loadingReservaId === clase._id || yaInscripto || clase.cuposDisponibles === 0 || sinCreditos}
                  style={{
                    ...btnStyle,
                    width: "100%",
                    background: yaInscripto
                      ? "#16a34a"
                      : sinCreditos
                        ? "#334155"
                        : "linear-gradient(135deg, #22c55e, #4ade80)",
                    cursor: loadingReservaId === clase._id || yaInscripto || clase.cuposDisponibles === 0 || sinCreditos ? "not-allowed" : "pointer",
                    opacity: loadingReservaId === clase._id || clase.cuposDisponibles === 0 || sinCreditos ? 0.85 : 1
                  }}
                  onMouseEnter={loadingReservaId === clase._id || yaInscripto || clase.cuposDisponibles === 0 || sinCreditos ? undefined : handlePrimaryMouseEnter}
                  onMouseLeave={loadingReservaId === clase._id || yaInscripto || clase.cuposDisponibles === 0 || sinCreditos ? undefined : handlePrimaryMouseLeave}
                >
                  {loadingReservaId === clase._id ? "Reservando..." : yaInscripto ? "Reserva mensual activa" : `Reservar - ${costoClase} creditos`}
                </button>
                {sinCreditos && !yaInscripto && (
                  <p style={{ margin: 0, opacity: 0.72, color: "#facc15" }}>
                    No tienes creditos suficientes para reservar esta clase.
                  </p>
                )}
              </>
            )}

            {mostrarAdmin && (
              <>
                {isMobile ? (
                  <MobileDisclosure title={`Personas inscriptas (${inscritos.length})`}>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {inscritos.length > 0 ? (
                        inscritos.map((inscripto) => (
                          <div
                            key={inscripto._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              flexDirection: "column",
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
                          Todavia no hay reservas activas para esta clase.
                        </p>
                      )}
                    </div>
                  </MobileDisclosure>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                      <strong>Personas inscriptas este mes</strong>
                      <Badge text={`${inscritos.length} reservas`} />
                    </div>
                    <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                      {inscritos.length > 0 ? (
                        inscritos.map((inscripto) => (
                          <div
                            key={inscripto._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              flexDirection: "row",
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
                          Todavia no hay reservas activas para esta clase.
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
    <div style={{ width: "100%", maxWidth: "1180px", margin: "0 auto", padding: isSmallMobile ? "14px 12px 44px" : isMobile ? "18px 14px 56px" : "28px 24px 80px", boxSizing: "border-box" }}>
      <header
        style={{
          ...glassCardStyle,
          padding: isSmallMobile ? "14px 12px" : isMobile ? "16px" : "18px 24px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: isSmallMobile ? "14px" : "18px",
          position: "sticky",
          top: isMobile ? "12px" : "20px",
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
          minHeight: isMobile ? "auto" : "82vh",
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.2fr 0.8fr",
          gap: isSmallMobile ? "18px" : isMobile ? "22px" : "26px",
          alignItems: "center",
          paddingTop: isSmallMobile ? "18px" : isMobile ? "26px" : "36px"
        }}
      >
        <div style={{ display: "grid", gap: isSmallMobile ? "18px" : "26px" }}>
          <div>
            <Badge text="Studio boutique femenino" color="#f9a8d4" background="rgba(244,114,182,0.14)" />
            <h1
              style={{
                marginTop: "22px",
                marginBottom: "16px",
                fontSize: isSmallMobile ? "clamp(42px, 17vw, 62px)" : isMobile ? "clamp(52px, 18vw, 84px)" : "clamp(58px, 10vw, 118px)",
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
            <p style={{ margin: 0, fontSize: isSmallMobile ? "20px" : isMobile ? "22px" : "28px", fontWeight: "800" }}>
              Transforma tu cuerpo
            </p>
            <p style={{ marginTop: isSmallMobile ? "14px" : "18px", marginBottom: 0, maxWidth: "620px", opacity: 0.82, lineHeight: isSmallMobile ? 1.7 : 1.8, fontSize: isSmallMobile ? "14px" : "16px" }}>
              Una experiencia fitness boutique con agenda semanal inteligente, packs mensuales
              y un panel privado pensado para alumnas y administracion.
            </p>
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
            <button
              type="button"
              onClick={() => setVista(VISTAS_PUBLICAS.REGISTRO)}
              style={{
                background: "linear-gradient(135deg, #f472b6, #ec4899)",
                border: "none",
                padding: isSmallMobile ? "14px 18px" : "15px 28px",
                borderRadius: "999px",
                color: "white",
                fontWeight: "bold",
                fontSize: isSmallMobile ? "15px" : "16px",
                width: isSmallMobile ? "100%" : "auto",
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
          </div>
        </div>

        <div style={{ display: "grid", gap: "18px" }}>
          <div
            style={{
              ...softPanelStyle,
              padding: isSmallMobile ? "18px" : "22px",
              minHeight: isSmallMobile ? "auto" : "230px",
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
              Agenda inteligente
            </p>
            <h3 style={{ marginTop: "18px", marginBottom: "12px", fontSize: isSmallMobile ? "24px" : "30px", lineHeight: 1.15 }}>
              Sistema de creditos: elegi tu pack mensual y reserva tus clases recurrentes segun el costo de cada turno.
            </h3>
            <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.7, fontSize: isSmallMobile ? "14px" : "16px" }}>
              Los packs mensuales se acreditan en tu cuenta y se usan para reservar tus clases recurrentes con una experiencia mas profesional.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "18px"
            }}
          >
            <StatCard title="Bloques semanales" value="L a V" subtitle="Agenda fija con horas validadas" accent="#22c55e" />
            <StatCard title="Sistema de creditos" value="9 o 10" subtitle="Cada pack mensual acredita 9 o 10 creditos segun el plan" accent="#f472b6" />
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.05fr 0.95fr",
          gap: isSmallMobile ? "18px" : "26px",
          marginTop: isSmallMobile ? "18px" : "26px"
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
              height: isSmallMobile ? "240px" : isMobile ? "300px" : "360px",
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
        padding: isSmallMobile ? "18px 12px" : isMobile ? "28px 16px" : "40px 20px"
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
            padding: isSmallMobile ? "22px 16px" : isMobile ? "28px 22px" : "42px",
            background: "linear-gradient(160deg, rgba(244,114,182,0.18), rgba(15,23,42,0.2))",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: isSmallMobile ? "20px" : "28px"
          }}
        >
          <BrandLogo />
          <div>
            <Badge text="Acceso privado" color="#f9a8d4" background="rgba(244,114,182,0.14)" />
            <h2 style={{ marginTop: "18px", marginBottom: "12px", fontSize: isMobile ? "32px" : "42px", lineHeight: 1.05 }}>
              Gestiona tus reservas, tus creditos y tu progreso en una sola app.
            </h2>
            <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.8 }}>
              Una experiencia clara, elegante y funcional para alumnas y administracion del studio.
            </p>
          </div>
          {!isSmallMobile && (
            <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Agenda semanal</strong>
              <p style={{ marginBottom: 0, opacity: 0.72, lineHeight: 1.6 }}>
                Bloques recurrentes por dia y hora, sin crear eventos uno por uno.
              </p>
            </div>
            <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <strong>Packs mensuales</strong>
              <p style={{ marginBottom: 0, opacity: 0.72, lineHeight: 1.6 }}>
                Los packs mensuales se acreditan en tu cuenta y se usan para reservar tus clases recurrentes.
              </p>
            </div>
            </div>
          )}
        </div>

        <div style={{ padding: isSmallMobile ? "22px 14px" : isMobile ? "28px 18px" : "42px", minWidth: 0 }}>
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
    <div style={{ display: "grid", gap: isSmallMobile ? "18px" : "26px" }}>
      <section
        style={{
          ...glassCardStyle,
          padding: isSmallMobile ? "18px 14px" : isMobile ? "22px 18px" : "30px",
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "1.1fr 0.9fr",
          gap: isSmallMobile ? "16px" : "22px"
        }}
      >
        <div>
          <Badge text="Panel privado" color="#f9a8d4" background="rgba(244,114,182,0.14)" />
          <h1 style={{ marginTop: "18px", marginBottom: "14px", fontSize: isMobile ? "34px" : "42px" }}>
            Inicio
          </h1>
          <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.8, maxWidth: "680px" }}>
            Bienvenida {user?.nombre}. Desde aqui puedes ver tu agenda semanal, tus creditos,
            tu rutina del dia y el estado general del studio en una vista clara y profesional.
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
            Pack y creditos
          </p>
          <h3 style={{ marginTop: "12px", marginBottom: "8px", fontSize: "34px" }}>
            {user?.creditos || 0}
          </h3>
          <p style={{ margin: 0, opacity: 0.82, lineHeight: 1.8 }}>
            {user?.packActivo?.nombre
              ? `Pack activo: ${user.packActivo.nombre} (${user.packActivo.creditos} creditos por $${user.packActivo.precioARS.toLocaleString("es-AR")})`
              : "Todavia no tienes un pack activo este mes."}
          </p>
          <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCreditModalOpen(true)}
              style={{
                ...actionBtnStyle,
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
              onMouseEnter={handleSecondaryHoverEnter}
              onMouseLeave={handleSecondaryHoverLeave}
            >
              Mis creditos
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isSmallMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(210px, 1fr))",
          gap: isSmallMobile ? "12px" : "18px"
        }}
      >
        {metricasDashboardVisibles.map((metrica) => (
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
          title="Tus reservas mensuales"
          subtitle={`Mes activo: ${getCurrentMonthKey()}. Cada reserva cubre todo el bloque semanal.`}
        >
          <div style={{ display: "grid", gap: "12px" }}>
            {misClases.length > 0 ? (
              misClases.slice(0, 4).map((clase) => (
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
                      {clase.diasLabel} - {clase.hora}
                    </p>
                  </div>
                  <Badge text={clase.profesor || "A definir"} />
                </div>
              ))
            ) : (
              <p style={{ margin: 0, opacity: 0.74 }}>
                Todavia no tienes reservas activas este mes.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Agenda de hoy"
          subtitle="Vista rapida de los bloques disponibles para el dia actual."
        >
          <div style={{ display: "grid", gap: "12px" }}>
            {clasesDeHoy.length > 0 ? (
              clasesDeHoy.map((clase) => (
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
                    {clase.profesor} - {clase.diasLabel} - {clase.hora}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, opacity: 0.74 }}>
                Hoy no hay bloques configurados en la agenda.
              </p>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );

  const renderClases = () => (
    (() => {
      const clasesLunesMiercolesViernes = clases.filter((clase) => {
        const dias = clase.diasSemana || [];
        return dias.includes(1) || dias.includes(3) || dias.includes(5);
      });

      const clasesMartesJueves = clases.filter((clase) => {
        const dias = clase.diasSemana || [];
        return dias.includes(2) || dias.includes(4);
      });

      const renderFilaClases = (items) => (
        <div
          style={{
            display: "flex",
            gap: isSmallMobile ? "14px" : "18px",
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: "10px",
            scrollSnapType: "x proximity",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {items.length > 0 ? (
            items.map((clase) => renderClaseCard(clase))
          ) : (
            <div
              style={{
                ...softPanelStyle,
                padding: "18px",
                minWidth: isSmallMobile ? "88vw" : isMobile ? "78vw" : "320px"
              }}
            >
              No hay clases cargadas en este grupo todavia.
            </div>
          )}
        </div>
      );

      return (
        <div style={{ display: "grid", gap: "24px" }}>
          <SectionCard
            title="Agenda semanal"
            subtitle="Reserva un bloque recurrente y quedas anotada automaticamente en todas las clases del mes para ese conjunto de dias y horario."
          >
            <div style={{ display: "grid", gap: isSmallMobile ? "16px" : "26px" }}>
              {isMobile ? (
                <>
                  <MobileDisclosure title="Lunes / Miercoles / Viernes" defaultOpen>
                    <div style={{ marginTop: "4px" }}>
                      <ScrollHint text="Clases agrupadas para el bloque Lunes / Miercoles / Viernes." />
                      {renderFilaClases(clasesLunesMiercolesViernes)}
                    </div>
                  </MobileDisclosure>
                  <MobileDisclosure title="Martes / Jueves">
                    <div style={{ marginTop: "4px" }}>
                      <ScrollHint text="Clases agrupadas para el bloque Martes / Jueves." />
                      {renderFilaClases(clasesMartesJueves)}
                    </div>
                  </MobileDisclosure>
                </>
              ) : (
                <>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "22px" }}>
                      Lunes / Miercoles / Viernes
                    </h3>
                    <ScrollHint text="Clases agrupadas para el bloque Lunes / Miercoles / Viernes." />
                    {renderFilaClases(clasesLunesMiercolesViernes)}
                  </div>

                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "22px" }}>
                      Martes / Jueves
                    </h3>
                    <ScrollHint text="Clases agrupadas para el bloque Martes / Jueves." />
                    {renderFilaClases(clasesMartesJueves)}
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </div>
      );
    })()
  );

  const renderPerfil = () => (
    <div style={{ display: "grid", gap: isSmallMobile ? "18px" : "24px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "0.9fr 1.1fr",
          gap: "22px"
        }}
      >
        <SectionCard title="Perfil" subtitle="Tus datos principales dentro de la plataforma LOLIFIT.">
          <div style={{ display: "grid", gap: isSmallMobile ? "12px" : "14px" }}>
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
              <p style={{ margin: 0, opacity: 0.65 }}>Creditos</p>
              <strong style={{ fontSize: "22px" }}>{user?.creditos || 0}</strong>
              <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                Valor estimado: ${(user?.creditos || 0) * VALOR_CREDITO_ARS} ARS
              </p>
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.65 }}>Pack activo</p>
              <strong>{user?.packActivo?.nombre || "Sin pack mensual"}</strong>
            </div>
            <div>
              <p style={{ margin: 0, opacity: 0.65 }}>Reservas activas</p>
              <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
                {misClases.length > 0 ? (
                  misClases.slice(0, isSmallMobile ? 3 : misClases.length).map((clase) => (
                    <div key={clase._id} style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                      {formatClaseResumen(clase)}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)" }}>
                    Reserva activa: Ninguna
                  </div>
              )}
              {isSmallMobile && misClases.length > 3 && (
                <p style={{ margin: 0, opacity: 0.7 }}>
                  +{misClases.length - 3} reservas mas activas.
                </p>
              )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Objetivo, rutina y pack"
          subtitle="Gestiona tu objetivo y compra tu pack mensual sin salir del panel."
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

          <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCreditModalOpen(true)}
              style={{
                ...actionBtnStyle,
                background: "rgba(255,255,255,0.06)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
              onMouseEnter={handleSecondaryHoverEnter}
              onMouseLeave={handleSecondaryHoverLeave}
            >
              Mis creditos
            </button>
          </div>

          {isMobile ? (
            <>
              <div style={{ marginTop: "18px" }}>
                <MobileDisclosure title="Historial reciente">
                  <div style={{ display: "grid", gap: "10px" }}>
                    {movimientos.length > 0 ? (
                      movimientos.slice(0, isSmallMobile ? 3 : 5).map((movimiento) => (
                        <div
                          key={movimiento._id}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.05)"
                          }}
                        >
                          <strong>{movimiento.descripcion || movimiento.tipo}</strong>
                          <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                            {movimiento.creditos > 0 ? "+" : ""}{movimiento.creditos} creditos
                            {movimiento.montoARS ? ` - $${movimiento.montoARS.toLocaleString("es-AR")}` : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, opacity: 0.72 }}>Todavia no hay movimientos cargados.</p>
                    )}
                  </div>
                </MobileDisclosure>
              </div>

              <div style={{ marginTop: "18px" }}>
                <MobileDisclosure title={`Rutina de hoy: ${rutinaDeHoy?.titulo || "Pendiente"}`} defaultOpen>
                  <div
                    style={{
                      padding: "2px 0 0"
                    }}
                  >
                    <p style={{ marginTop: 0, opacity: 0.82, lineHeight: 1.8 }}>
                      {rutinaDeHoy?.detalle || "Actualiza tu objetivo para generar o renovar tu plan mensual."}
                    </p>
                    <div style={{ marginTop: "12px" }}>
                      <Badge text={`Foco: ${rutinaDeHoy?.foco || "Pendiente"}`} />
                    </div>
                  </div>
                </MobileDisclosure>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "20px" }}>Historial reciente</h3>
                {movimientos.length > 0 ? (
                  movimientos.slice(0, 5).map((movimiento) => (
                    <div
                      key={movimiento._id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.05)"
                      }}
                    >
                      <strong>{movimiento.descripcion || movimiento.tipo}</strong>
                      <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                        {movimiento.creditos > 0 ? "+" : ""}{movimiento.creditos} creditos
                        {movimiento.montoARS ? ` - $${movimiento.montoARS.toLocaleString("es-AR")}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, opacity: 0.72 }}>Todavia no hay movimientos cargados.</p>
                )}
              </div>

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
            </>
          )}
        </SectionCard>
      </section>
    </div>
  );

  const renderAdmin = () => (
    <div style={{ display: "grid", gap: isSmallMobile ? "18px" : "24px" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "0.92fr 1.08fr",
          gap: "22px"
        }}
      >
        <SectionCard
          title="Panel de administracion"
          subtitle="Crea plantillas semanales en vez de eventos por fecha. Cada bloque representa una clase recurrente."
        >
          <input
            placeholder="Nombre de la clase"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <input
            placeholder="Nombre de quien dicta la clase"
            value={profesor}
            onChange={(e) => setProfesor(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <div style={{ marginBottom: "12px" }}>
            <p style={{ marginTop: 0, marginBottom: "10px", opacity: 0.72 }}>Dias recurrentes</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {DIAS_SEMANA.map((dia) => {
                const activo = diasSemanaClase.includes(dia.value);
                return (
                  <button
                    key={dia.value}
                    type="button"
                    onClick={() => {
                      toggleDiaSemana(dia.value, setDiasSemanaClase);
                      setHoraClase("");
                    }}
                    style={{
                      ...actionBtnStyle,
                      background: activo ? "rgba(244,114,182,0.18)" : "rgba(255,255,255,0.05)",
                      color: "white",
                      border: activo ? "1px solid rgba(244,114,182,0.35)" : "1px solid rgba(255,255,255,0.06)"
                    }}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

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
            placeholder="Cupo maximo"
            value={cupoMaximo}
            onChange={(e) => setCupoMaximo(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <input
            type="number"
            placeholder="Costo en creditos"
            value={creditosCosto}
            onChange={(e) => setCreditosCosto(e.target.value)}
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
            Crear clase semanal
          </button>
        </SectionCard>

        {isMobile ? (
          <MobileDisclosure title="Reglas de agenda" defaultOpen>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Lunes, miercoles y viernes</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>07:00 a 10:00 y 14:00 a 19:00</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Martes y jueves</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>08:00 a 10:00 y 18:00 a 22:00</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Modelo de reserva</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>Cada alumna reserva un bloque semanal y descuenta 9, 10 o el costo en creditos definido por esa clase.</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Packs mensuales</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>2 veces por semana: 9 creditos por $45.000. 3 veces por semana: 10 creditos por $50.000.</p>
              </div>
            </div>
          </MobileDisclosure>
        ) : (
          <SectionCard
            title="Reglas de agenda"
            subtitle="La administracion trabaja sobre una grilla semanal fija y packs mensuales."
          >
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Lunes, miercoles y viernes</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>07:00 a 10:00 y 14:00 a 19:00</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Martes y jueves</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>08:00 a 10:00 y 18:00 a 22:00</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Modelo de reserva</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>Cada alumna reserva un bloque semanal y descuenta 9, 10 o el costo en creditos definido por esa clase.</p>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Packs mensuales</strong>
                <p style={{ marginBottom: 0, opacity: 0.72 }}>2 veces por semana: 9 creditos por $45.000. 3 veces por semana: 10 creditos por $50.000.</p>
              </div>
            </div>
          </SectionCard>
        )}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "0.95fr 1.05fr",
          gap: "22px"
        }}
      >
        <SectionCard
          title="Carga manual de creditos"
          subtitle="Asigna o descuenta creditos a alumnas que pagan en efectivo, promociones o ajustes."
        >
          <input
            placeholder="Buscar alumna por nombre o email"
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <select
            value={adminUserId}
            onChange={(e) => setAdminUserId(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          >
            <option value="">Selecciona una alumna</option>
            {adminUsuarios
              .filter((usuario) =>
                `${usuario.nombre} ${usuario.email}`.toLowerCase().includes(adminSearch.toLowerCase())
              )
              .map((usuario) => (
                <option key={usuario._id} value={usuario._id}>
                  {usuario.nombre} - {usuario.email}
                </option>
              ))}
          </select>

          <select
            value={adminPackId}
            onChange={(e) => setAdminPackId(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          >
            <option value="">Sin pack, asignar creditos manuales</option>
            {PACKS_MENSUALES.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.nombre} - {pack.creditos} creditos
              </option>
            ))}
          </select>

          {!adminPackId && (
            <>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {(isSmallMobile ? [1, 2, 5, -1, -2] : [1, 2, 5, 9, 10, -1, -2, -5]).map((cantidad) => (
                  <button
                    key={cantidad}
                    type="button"
                    onClick={() => setAdminCreditosManual(String(cantidad))}
                    style={{
                      ...actionBtnStyle,
                      background: cantidad > 0 ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                    onMouseEnter={handleSecondaryHoverEnter}
                    onMouseLeave={handleSecondaryHoverLeave}
                  >
                    {cantidad > 0 ? `+${cantidad}` : cantidad}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Cantidad manual de creditos"
                value={adminCreditosManual}
                onChange={(e) => setAdminCreditosManual(e.target.value)}
                style={inputStyle}
                onMouseEnter={handleInputMouseEnter}
                onMouseLeave={handleInputMouseLeave}
              />
            </>
          )}

          {selectedAdminUser && (
            <div style={{ marginBottom: "12px", padding: "14px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
              <strong>{selectedAdminUser.nombre}</strong>
              <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                Creditos actuales: {selectedAdminUser.creditos || 0} | Pack: {selectedAdminUser.packActivo?.nombre || "Sin pack"}
              </p>
            </div>
          )}

          <input
            placeholder="Motivo: pago efectivo, ajuste, promocion..."
            value={adminMotivo}
            onChange={(e) => setAdminMotivo(e.target.value)}
            style={inputStyle}
            onMouseEnter={handleInputMouseEnter}
            onMouseLeave={handleInputMouseLeave}
          />

          <button
            type="button"
            onClick={asignarCreditosManual}
            disabled={asignandoCreditos}
            style={{ ...btnStyle, width: "100%", marginTop: 0 }}
            onMouseEnter={handlePrimaryMouseEnter}
            onMouseLeave={handlePrimaryMouseLeave}
          >
            {asignandoCreditos ? "Asignando..." : "Asignar creditos"}
          </button>
        </SectionCard>

        {isMobile ? (
          <MobileDisclosure title="Estado de alumnas">
            <div style={{ display: "grid", gap: "10px" }}>
              {adminUsuarios
                .filter((usuario) =>
                  `${usuario.nombre} ${usuario.email}`.toLowerCase().includes(adminSearch.toLowerCase())
                )
                .slice(0, isSmallMobile ? 4 : 6)
                .map((usuario) => (
                  <div
                    key={usuario._id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    <strong>{usuario.nombre}</strong>
                    <p style={{ margin: "6px 0 0", opacity: 0.72 }}>{usuario.email}</p>
                    <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                      Creditos: {usuario.creditos || 0} | Pack: {usuario.packActivo?.nombre || "Sin pack"}
                    </p>
                  </div>
                ))}
            </div>
          </MobileDisclosure>
        ) : (
          <SectionCard
            title="Estado de alumnas"
            subtitle="Vista rapida de creditos y pack activo para facilitar la atencion en el local."
          >
            <div style={{ display: "grid", gap: "10px" }}>
              {adminUsuarios
                .filter((usuario) =>
                  `${usuario.nombre} ${usuario.email}`.toLowerCase().includes(adminSearch.toLowerCase())
                )
                .slice(0, 8)
                .map((usuario) => (
                  <div
                    key={usuario._id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    <strong>{usuario.nombre}</strong>
                    <p style={{ margin: "6px 0 0", opacity: 0.72 }}>{usuario.email}</p>
                    <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                      Creditos: {usuario.creditos || 0} | Pack: {usuario.packActivo?.nombre || "Sin pack"}
                    </p>
                  </div>
                ))}
            </div>
          </SectionCard>
        )}
      </section>

      {isMobile ? (
        <MobileDisclosure title="Gestion de clases">
          <div style={{ marginTop: "4px" }}>
            <ScrollHint text="La gestion usa scroll lateral para mantener la administracion compacta y facil de navegar." />
            <div
              style={{
                display: "flex",
                gap: "18px",
                overflowX: "auto",
                overflowY: "hidden",
                paddingBottom: "10px",
                scrollSnapType: "x proximity",
                WebkitOverflowScrolling: "touch"
              }}
            >
              {clases.map((clase) => renderClaseCard(clase, { mostrarAdmin: true }))}
            </div>
          </div>
        </MobileDisclosure>
      ) : (
        <SectionCard
          title="Gestion de clases"
          subtitle="Edita, elimina o revisa las personas inscriptas en cada plantilla semanal."
        >
          <ScrollHint text="La gestion usa scroll lateral para mantener la administracion compacta y facil de navegar." />
          <div
            style={{
              display: "flex",
              gap: "18px",
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: "10px",
              scrollSnapType: "x proximity",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {clases.map((clase) => renderClaseCard(clase, { mostrarAdmin: true }))}
          </div>
        </SectionCard>
      )}
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

  const renderCreditModal = () => (
    creditModalOpen && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(2, 6, 23, 0.78)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 60
        }}
        >
          <div
            style={{
              ...glassCardStyle,
              width: "100%",
              maxWidth: isSmallMobile ? "100%" : "760px",
              maxHeight: isMobile ? "88vh" : "none",
              overflowY: isMobile ? "auto" : "visible",
              padding: isSmallMobile ? "18px 14px" : isMobile ? "22px 18px" : "28px",
              display: "grid",
              gridTemplateColumns: isTablet ? "1fr" : "0.95fr 1.05fr",
              gap: isSmallMobile ? "16px" : "20px"
            }}
          >
            <div>
              <p style={{ marginTop: 0, color: "#f9a8d4", fontWeight: "900", letterSpacing: "0.6px" }}>
                MIS CREDITOS
              </p>
              <h3 style={{ marginTop: "10px", marginBottom: "10px", fontSize: "30px" }}>
                Compra con Mercado Pago
              </h3>
              <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.7 }}>
                Comprá tu pack mensual o créditos personalizados y reservá tus clases desde la app.
                Tus créditos se acreditan automáticamente cuando el pago se aprueba.
              </p>

              <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
                <div style={{ padding: "14px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                  <strong>Creditos actuales</strong>
                <p style={{ margin: "6px 0 0", opacity: 0.72 }}>{user?.creditos || 0}</p>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                <strong>Pack activo</strong>
                <p style={{ margin: "6px 0 0", opacity: 0.72 }}>{user?.packActivo?.nombre || "Sin pack activo"}</p>
              </div>
                <div style={{ padding: "14px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                  <strong>Referencia</strong>
                  <p style={{ margin: "6px 0 0", opacity: 0.72 }}>1 credito equivale a ${VALOR_CREDITO_ARS.toLocaleString("es-AR")} ARS</p>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }}>
                  <strong>Pago seguro</strong>
                  <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                    El checkout se hace directamente en Mercado Pago. LOLIFIT no pide ni guarda datos de tarjeta.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
              {PACKS_MENSUALES.map((pack) => {
                const active = selectedPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPackId(pack.id)}
                    style={{
                      ...softPanelStyle,
                      padding: "16px",
                      textAlign: "left",
                      cursor: "pointer",
                      border: active ? "1px solid rgba(244,114,182,0.34)" : "1px solid rgba(255,255,255,0.08)",
                      background: active ? "linear-gradient(180deg, rgba(244,114,182,0.12), rgba(2,6,23,0.92))" : softPanelStyle.background
                    }}
                  >
                    <strong style={{ display: "block", fontSize: "18px" }}>{pack.nombre}</strong>
                    <p style={{ margin: "8px 0 0", opacity: 0.76 }}>{pack.creditos} creditos - ${pack.precioARS.toLocaleString("es-AR")}</p>
                  </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => iniciarPagoMercadoPago({
                  tipo: selectedPack.id === "pack_2x_semana" ? "pack_9" : "pack_10",
                  pack: selectedPack
                })}
                style={{
                  ...btnStyle,
                  width: "100%",
                  marginTop: 0
                }}
                onMouseEnter={handlePrimaryMouseEnter}
                onMouseLeave={handlePrimaryMouseLeave}
              >
                {comprandoPackId === selectedPack.id
                  ? "Redirigiendo..."
                  : `Pagar pack ${selectedPack.creditos} creditos con Mercado Pago`}
              </button>

              <div
                style={{
                  ...softPanelStyle,
                  marginTop: "16px",
                  padding: "18px"
                }}
              >
                <strong style={{ display: "block", marginBottom: "10px" }}>
                  Creditos personalizados
                </strong>
                <p style={{ marginTop: 0, marginBottom: "12px", opacity: 0.74, lineHeight: 1.6 }}>
                  También podés comprar la cantidad exacta de créditos que necesites.
                </p>
                <input
                  type="number"
                  min="1"
                  placeholder="Cantidad de creditos"
                  value={customCreditos}
                  onChange={(e) => setCustomCreditos(e.target.value)}
                  style={inputStyle}
                  onMouseEnter={handleInputMouseEnter}
                  onMouseLeave={handleInputMouseLeave}
                />
                <div style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", marginBottom: "12px" }}>
                  <strong>Total estimado</strong>
                  <p style={{ margin: "6px 0 0", opacity: 0.72 }}>
                    {customCreditosNumber || 0} creditos - ${customMontoARS.toLocaleString("es-AR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => iniciarPagoMercadoPago({
                    tipo: "custom",
                    cantidadCreditos: customCreditosNumber
                  })}
                  style={{
                    ...btnStyle,
                    width: "100%",
                    marginTop: 0
                  }}
                  onMouseEnter={handlePrimaryMouseEnter}
                  onMouseLeave={handlePrimaryMouseLeave}
                >
                  {comprandoPackId === "custom"
                    ? "Redirigiendo..."
                    : "Pagar creditos personalizados con Mercado Pago"}
                </button>
              </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexDirection: isSmallMobile ? "column" : "row" }}>
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
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
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      <Toaster />
      {renderCreditModal()}

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
              padding: isSmallMobile ? "18px 14px" : "24px",
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

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexDirection: isSmallMobile ? "column" : "row" }}>
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
            right: isSmallMobile ? "14px" : "24px",
            bottom: isSmallMobile ? "14px" : "24px",
            zIndex: 20,
            background: "#22c55e",
            color: "white",
            textDecoration: "none",
            width: isSmallMobile ? "52px" : "58px",
            height: isSmallMobile ? "52px" : "58px",
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
          <div style={{ width: "100%", maxWidth: "1380px", margin: "0 auto", padding: isSmallMobile ? "10px 10px 34px" : isMobile ? "16px 12px 48px" : "20px 24px 60px", boxSizing: "border-box" }}>
            <header
              style={{
                ...glassCardStyle,
                padding: isSmallMobile ? "12px 10px" : isMobile ? "16px" : "18px 24px",
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto 1fr",
                alignItems: "center",
                gap: isSmallMobile ? "12px" : "18px",
                position: "sticky",
                top: isSmallMobile ? "8px" : "20px",
                zIndex: 8
              }}
            >
              <div style={{ justifySelf: "start", minWidth: 0 }}>
                <BrandLogo compact={isMobile} />
              </div>

              {!isMobile && (
                <nav style={{ display: "flex", alignItems: "center", gap: isSmallMobile ? "8px" : "10px", flexWrap: "wrap", justifyContent: "center", minWidth: 0 }}>
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
              )}

              <div style={{ display: "flex", alignItems: "center", gap: isSmallMobile ? "8px" : "10px", justifySelf: isMobile ? "center" : "end", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setCreditModalOpen(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer"
                  }}
                >
                  <Badge text={`${user?.creditos || 0} creditos`} color="#facc15" background="rgba(250,204,21,0.14)" />
                </button>
                <button
                  type="button"
                  onClick={() => setVista(VISTAS_PRIVADAS.PERFIL)}
                  style={{
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
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    style={{
                      width: isSmallMobile ? "42px" : "46px",
                      height: isSmallMobile ? "42px" : "46px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "20px",
                      fontWeight: "900"
                    }}
                  >
                    {mobileMenuOpen ? "×" : "☰"}
                  </button>
                )}
              </div>

              {isMobile && mobileMenuOpen && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "grid",
                    gap: "10px",
                    paddingTop: "6px"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                    <NavButton
                      label="Inicio"
                      active={vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD}
                      onClick={() => {
                        setVista(VISTAS_PRIVADAS.DASHBOARD);
                        setMobileMenuOpen(false);
                      }}
                    />
                    <NavButton
                      label="Clases"
                      active={vistaPrivadaActiva === VISTAS_PRIVADAS.CLASES}
                      onClick={() => {
                        setVista(VISTAS_PRIVADAS.CLASES);
                        setMobileMenuOpen(false);
                      }}
                    />
                    <NavButton
                      label="Perfil"
                      active={vistaPrivadaActiva === VISTAS_PRIVADAS.PERFIL}
                      onClick={() => {
                        setVista(VISTAS_PRIVADAS.PERFIL);
                        setMobileMenuOpen(false);
                      }}
                    />
                    {esAdmin && (
                      <NavButton
                        label="Admin"
                        active={vistaPrivadaActiva === VISTAS_PRIVADAS.ADMIN}
                        onClick={() => {
                          setVista(VISTAS_PRIVADAS.ADMIN);
                          setMobileMenuOpen(false);
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
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

            <main style={{ marginTop: isSmallMobile ? "16px" : "22px" }}>
              {renderPrivateContent()}
            </main>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
