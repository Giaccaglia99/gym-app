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

const menuBtn = {
  background: "transparent",
  border: "none",
  color: "white",
  textAlign: "left",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "0.2s"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  background: "#020617",
  color: "white",
  border: "1px solid #1e293b"
};

const btnStyle = {
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
  width: "100%"
};

const actionBtnStyle = {
  border: "none",
  padding: "6px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "all 0.2s ease"
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

function handleInputMouseEnter(e) {
  e.currentTarget.style.borderColor = "#4ade80";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.12)";
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
  e.currentTarget.style.opacity = "0.85";
  e.currentTarget.style.transform = "translateY(-1px)";
}

function handleSecondaryHoverLeave(e) {
  e.currentTarget.style.opacity = "1";
  e.currentTarget.style.transform = "translateY(0)";
}

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [vista, setVista] = useState(VISTAS_PUBLICAS.INICIO);
  const [tiempo, setTiempo] = useState(TIEMPO_VERIFICACION);

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

  const minutos = Math.floor(tiempo / 60);
  const segundos = tiempo % 60;
  const horariosDisponibles = getHorariosDisponiblesPorFecha(fechaClase);
  const nuevosHorariosDisponibles = getHorariosDisponiblesPorFecha(nuevaFechaClase);

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
      message: "¿Quieres cerrar sesion y salir de tu cuenta?",
      confirmLabel: "Cerrar sesion",
      variant: "primary",
      onConfirm: () => {
        setUser(null);
        setVista(VISTAS_PUBLICAS.INICIO);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.replace("/");
        }, 50);
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

  const misClases = clases.filter((clase) =>
    clase.inscritos?.some((inscripto) => inscripto._id === user?._id)
  );

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

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px"
              }}
            >
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
            boxShadow: "0 20px 40px rgba(34,197,94,0.35)"
          }}
        >
          WA
        </a>
      )}

      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #020617, #0f172a, #020617)",
          color: "white",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        {user && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              padding: "18px 30px",
              background: "rgba(2,6,23,0.88)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid #1e293b"
            }}
          >
            <div
              style={{
                fontSize: "26px",
                fontWeight: "900",
                color: "#f9a8d4",
                letterSpacing: "1px",
                justifySelf: "start"
              }}
            >
              LOLIFIT
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "22px"
              }}
            >
              <button
                style={menuBtn}
                onClick={() => setVista(VISTAS_PRIVADAS.DASHBOARD)}
              >
                Inicio
              </button>

              <button
                style={menuBtn}
                onClick={() => setVista(VISTAS_PRIVADAS.CLASES)}
              >
                Clases
              </button>

              {esAdmin && (
                <button
                  style={menuBtn}
                  onClick={() => setVista(VISTAS_PRIVADAS.ADMIN)}
                >
                  Admin
                </button>
              )}
            </div>

            <button
              style={{
                justifySelf: "end",
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                border: "1px solid rgba(249,168,212,0.35)",
                background: "linear-gradient(135deg, #f472b6, #ec4899)",
                color: "white",
                fontWeight: "900",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 12px 24px rgba(236,72,153,0.2)"
              }}
              onClick={() => setVista(VISTAS_PRIVADAS.PERFIL)}
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
          </div>
        )}

        <div style={{ padding: "30px" }}>
          {!user ? (
            <div
              style={vista === VISTAS_PUBLICAS.INICIO ? {
                width: "100%",
                maxWidth: "1100px",
                margin: "0 auto"
              } : {
                maxWidth: "400px",
                margin: "auto",
                marginTop: "100px",
                background: "#020617",
                padding: "30px",
                borderRadius: "10px"
              }}
            >
              {vista === VISTAS_PUBLICAS.INICIO && (
                <div
                  style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    gap: "48px",
                    paddingBottom: "50px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "40px"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: "900",
                        color: "#f9a8d4",
                        letterSpacing: "1px"
                      }}
                    >
                      LOLIFIT
                    </div>

                    <button
                      onClick={() => setVista(VISTAS_PUBLICAS.LOGIN)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "white",
                        padding: "10px 18px",
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
                        e.currentTarget.style.color = "white";
                      }}
                    >
                      Entrar
                    </button>
                  </div>

                  <div
                    style={{
                      minHeight: "72vh",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      padding: "20px 0"
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        fontSize: "clamp(56px, 12vw, 120px)",
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

                    <p
                      style={{
                        marginTop: "24px",
                        marginBottom: "24px",
                        color: "white",
                        fontWeight: "800",
                        fontSize: "24px"
                      }}
                    >
                      Transforma tu cuerpo
                    </p>

                    <button
                      style={{
                        background: "linear-gradient(135deg, #f472b6, #ec4899)",
                        border: "none",
                        padding: "14px 28px",
                        borderRadius: "999px",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "16px",
                        cursor: "pointer",
                        boxShadow: "0 18px 40px rgba(236,72,153,0.28)",
                        transition: "all 0.2s ease"
                      }}
                      onClick={() => setVista(VISTAS_PUBLICAS.REGISTRO)}
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

                  <div
                    style={{
                      background: "rgba(15,23,42,0.88)",
                      border: "1px solid rgba(244,114,182,0.18)",
                      borderRadius: "28px",
                      padding: "32px",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.28)"
                    }}
                  >
                    <h2
                      style={{
                        marginTop: 0,
                        marginBottom: "18px",
                        fontSize: "clamp(28px, 5vw, 48px)",
                        color: "#fff"
                      }}
                    >
                      Un estudio pensado para tu mejor version
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        lineHeight: 1.8,
                        fontSize: "17px",
                        color: "rgba(255,255,255,0.9)"
                      }}
                    >
                      LOLI FIT Studio es un estudio boutique femenino ubicado en el corazon de Arroyito.
                      Creamos un espacio exclusivo para mujeres comprometidas con su bienestar, su crecimiento
                      y su mejor version. Trabajamos con grupos reducidos y acompanamiento personalizado porque
                      entendemos que los resultados reales requieren disciplina y decision. Elegimos calidad
                      antes que cantidad, proceso antes que improvisacion y compromiso antes que excusas.
                      Este es un lugar para mujeres que priorizan, invierten en si mismas y buscan superarse
                      permanentemente. Bienvenida a tu mejor version y a tu estandar mas alto.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(15,23,42,0.88)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "28px",
                      padding: "16px"
                    }}
                  >
                    <div
                      style={{
                        borderRadius: "18px",
                        overflow: "hidden",
                        height: "420px",
                        minHeight: "420px",
                        background: "#0f172a",
                        border: "1px solid #1e293b"
                      }}
                    >
                      <iframe
                        title="Mapa LOLIFIT"
                        src="https://www.google.com/maps?q=25%20de%20Mayo%201020%2C%20Arroyito%2C%20Cordoba%2C%20Argentina&z=16&output=embed"
                        style={{
                          border: 0,
                          width: "100%",
                          height: "100%",
                          display: "block"
                        }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                </div>
              )}

              {vista === VISTAS_PUBLICAS.LOGIN && (
                <div
                  style={{
                    maxWidth: "400px",
                    margin: "auto",
                    background: "rgba(2,6,23,0.8)",
                    backdropFilter: "blur(10px)",
                    padding: "40px",
                    borderRadius: "16px",
                    border: "1px solid #1e293b"
                  }}
                >
                  <h2 style={{ marginBottom: "20px" }}>Bienvenido</h2>

                  <input
                    placeholder="Email"
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onMouseEnter={handleInputMouseEnter}
                    onMouseLeave={handleInputMouseLeave}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onMouseEnter={handleInputMouseEnter}
                    onMouseLeave={handleInputMouseLeave}
                  />

                  <button
                    style={btnStyle}
                    onClick={login}
                    onMouseEnter={handlePrimaryMouseEnter}
                    onMouseLeave={handlePrimaryMouseLeave}
                  >
                    Ingresar
                  </button>

                  <p
                    onClick={() => setVista(VISTAS_PUBLICAS.REGISTRO)}
                    style={{ cursor: "pointer", marginTop: "14px" }}
                  >
                    Crear cuenta
                  </p>
                </div>
              )}

              {vista === VISTAS_PUBLICAS.REGISTRO && (
                <div>
                  <h2>Registro</h2>

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
                    style={btnStyle}
                    onClick={registro}
                    onMouseEnter={handlePrimaryMouseEnter}
                    onMouseLeave={handlePrimaryMouseLeave}
                  >
                    Registrarse
                  </button>

                  <p
                    onClick={() => setVista(VISTAS_PUBLICAS.LOGIN)}
                    style={{ cursor: "pointer" }}
                  >
                    Ya tengo cuenta
                  </p>
                </div>
              )}

              {vista === VISTAS_PUBLICAS.VERIFICAR && (
                <div>
                  <h2>Verificar cuenta</h2>

                  <p>
                    Tiempo restante: {minutos}:{segundos.toString().padStart(2, "0")}
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
                    style={btnStyle}
                    onClick={verificarCuenta}
                    onMouseEnter={handlePrimaryMouseEnter}
                    onMouseLeave={handlePrimaryMouseLeave}
                  >
                    Verificar
                  </button>
                  <button
                    style={btnStyle}
                    onClick={reenviarCodigo}
                    onMouseEnter={handlePrimaryMouseEnter}
                    onMouseLeave={handlePrimaryMouseLeave}
                  >
                    Reenviar codigo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "16px"
                  }}
                >
                  <button
                    style={{
                      ...btnStyle,
                      width: "auto",
                      minWidth: "140px",
                      marginTop: 0
                    }}
                    onClick={cerrarSesion}
                    onMouseEnter={handlePrimaryMouseEnter}
                    onMouseLeave={handlePrimaryMouseLeave}
                  >
                    Logout
                  </button>
                </div>
              )}

              {vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD && (
                <>
                  <h1>Inicio</h1>
                  <p>Bienvenido {user.nombre}</p>
                  <p>Tenes {misClases.length} clases reservadas.</p>
                </>
              )}

              {vistaPrivadaActiva === VISTAS_PRIVADAS.PERFIL && (
                <>
                  <h1>Perfil</h1>
                  <p>Nombre: {user.nombre}</p>
                  <p>Email: {user.email}</p>
                  <p>Rol: {user.rol}</p>
                  {misClases.length > 0 ? (
                    misClases.map((clase) => (
                      <p key={clase._id}>
                        Clase reservada: {clase.nombre} - {clase.fecha || "Fecha sin asignar"} - {clase.hora || "Hora sin asignar"}
                      </p>
                    ))
                  ) : (
                    <p>Clase reservada: Ninguna</p>
                  )}

                  <div
                    style={{
                      marginTop: "30px",
                      padding: "24px",
                      background: "rgba(2,6,23,0.75)",
                      borderRadius: "16px",
                      border: "1px solid #1e293b"
                    }}
                  >
                    <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#22c55e" }}>
                      Plan segun tu objetivo
                    </h2>
                    <p style={{ opacity: 0.8 }}>
                      Elegi tu objetivo y vas a tener una rutina sugerida para hoy dentro de tu plan del mes.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "12px",
                        alignItems: "end",
                        marginTop: "18px"
                      }}
                    >
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", opacity: 0.85 }}>
                          Objetivo
                        </label>
                        <select
                          style={inputStyle}
                          value={objetivoUsuario}
                          onChange={(e) => setObjetivoUsuario(e.target.value)}
                          onMouseEnter={handleInputMouseEnter}
                          onMouseLeave={handleInputMouseLeave}
                        >
                          {OBJETIVOS_USUARIO.map((objetivo) => (
                            <option key={objetivo.value} value={objetivo.value}>
                              {objetivo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        style={btnStyle}
                        onClick={actualizarObjetivo}
                        disabled={guardandoObjetivo}
                        onMouseEnter={handlePrimaryMouseEnter}
                        onMouseLeave={handlePrimaryMouseLeave}
                      >
                        {guardandoObjetivo ? "Guardando..." : "Actualizar objetivo"}
                      </button>
                    </div>

                    {planMensual && rutinaDeHoy && (
                      <div style={{ marginTop: "24px" }}>
                        <p style={{ marginBottom: "14px", opacity: 0.85 }}>
                          Rutina de hoy: {rutinaDeHoy.fecha}
                        </p>

                        <div
                          style={{
                            background: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "14px",
                            padding: "18px"
                          }}
                        >
                          <p style={{ margin: "0 0 10px", color: "#4ade80", fontWeight: "bold" }}>
                            {rutinaDeHoy.titulo}
                          </p>
                          <p style={{ margin: "0 0 10px", opacity: 0.85 }}>
                            {rutinaDeHoy.detalle}
                          </p>
                          <p style={{ margin: 0, fontSize: "13px", opacity: 0.75 }}>
                            Foco del dia: {rutinaDeHoy.foco}
                          </p>
                        </div>

                        <p style={{ marginTop: "14px", opacity: 0.7 }}>
                          Plan mensual activo: {planMensual.monthKey}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {(vistaPrivadaActiva === VISTAS_PRIVADAS.CLASES ||
                vistaPrivadaActiva === VISTAS_PRIVADAS.ADMIN ||
                vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD) && (
                <>
                  {esAdmin && vistaPrivadaActiva === VISTAS_PRIVADAS.ADMIN && (
                    <div
                      style={{
                        marginBottom: "30px",
                        padding: "20px",
                        background: "#020617",
                        borderRadius: "12px",
                        border: "1px solid #1e293b"
                      }}
                    >
                      <h2 style={{ marginBottom: "15px", color: "#22c55e" }}>
                        Panel de Administracion
                      </h2>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap"
                        }}
                      >
                        <select
                          style={inputStyle}
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          onMouseEnter={handleInputMouseEnter}
                          onMouseLeave={handleInputMouseLeave}
                        >
                          <option value="">Seleccionar clase</option>
                          {CLASES_DISPONIBLES.map((clase) => (
                            <option key={clase} value={clase}>
                              {clase}
                            </option>
                          ))}
                        </select>

                        <input
                          placeholder="Profesor o profesora"
                          value={profesor}
                          onChange={(e) => setProfesor(e.target.value)}
                          style={inputStyle}
                          onMouseEnter={handleInputMouseEnter}
                          onMouseLeave={handleInputMouseLeave}
                        />

                        <input
                          type="date"
                          style={inputStyle}
                          value={fechaClase}
                          onChange={(e) => {
                            setFechaClase(e.target.value);
                            setHoraClase("");
                          }}
                          onMouseEnter={handleInputMouseEnter}
                          onMouseLeave={handleInputMouseLeave}
                        />

                        <select
                          style={inputStyle}
                          value={horaClase}
                          onChange={(e) => setHoraClase(e.target.value)}
                          onMouseEnter={handleInputMouseEnter}
                          onMouseLeave={handleInputMouseLeave}
                        >
                          <option value="">Seleccionar hora</option>
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
                          style={btnStyle}
                          onClick={crearClase}
                          onMouseEnter={handlePrimaryMouseEnter}
                          onMouseLeave={handlePrimaryMouseLeave}
                        >
                          Crear clase
                        </button>
                      </div>
                      {fechaClase && (
                        <p style={{ marginTop: "8px", opacity: 0.75 }}>
                          Dia elegido: {getDiaLabel(fechaClase) || "No disponible"}.
                          {!horariosDisponibles.length && " Solo se puede crear de lunes a viernes."}
                        </p>
                      )}
                    </div>
                  )}

                  <h2 style={{ marginTop: "30px" }}>Clases</h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "20px",
                      marginTop: "20px"
                    }}
                  >
                    {clases.map((clase) => {
                      const yaInscripto = clase.inscritos?.some(
                        (inscripto) => inscripto._id === user._id
                      );

                      return (
                        <div
                          key={clase._id}
                          style={{
                            background: "rgba(2,6,23,0.7)",
                            backdropFilter: "blur(10px)",
                            padding: "20px",
                            borderRadius: "16px",
                            border: "1px solid #1e293b",
                            transition: "all 0.3s ease",
                            boxShadow: "0 12px 30px rgba(2,6,23,0.22)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {editandoId === clase._id ? (
                            <div
                              style={{
                                marginTop: "10px",
                                padding: "10px",
                                background: "#020617",
                                borderRadius: "8px",
                                border: "1px solid #1e293b",
                                width: "100%",
                                boxSizing: "border-box",
                                overflow: "hidden"
                              }}
                            >
                              <select
                                value={nuevoNombre}
                                onChange={(e) => setNuevoNombre(e.target.value)}
                                style={inputStyle}
                                onMouseEnter={handleInputMouseEnter}
                                onMouseLeave={handleInputMouseLeave}
                              >
                                <option value="">Seleccionar clase</option>
                                {CLASES_DISPONIBLES.map((claseOpcion) => (
                                  <option key={claseOpcion} value={claseOpcion}>
                                    {claseOpcion}
                                  </option>
                                ))}
                              </select>

                              <input
                                placeholder="Profesor o profesora"
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
                                <option value="">Seleccionar horario</option>
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

                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  marginTop: "10px"
                                }}
                              >
                                <button
                                  onClick={() => editarClase(clase._id)}
                                  style={{
                                    flex: 1,
                                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                    border: "none",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                  }}
                                  onMouseEnter={handlePrimaryMouseEnter}
                                  onMouseLeave={handlePrimaryMouseLeave}
                                >
                                  Guardar
                                </button>

                                <button
                                  onClick={() => {
                                    setEditandoId(null);
                                    setNuevoNombre("");
                                    setNuevoProfesor("");
                                    setNuevaFechaClase("");
                                    setNuevaHoraClase("");
                                    setNuevosCupos("");
                                  }}
                                  style={{
                                    flex: 1,
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    color: "white",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
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
                              <h3 style={{ fontSize: "18px", marginBottom: "5px" }}>
                                {clase.nombre}
                              </h3>

                              <p style={{ opacity: 0.8 }}>
                                Profesor: {clase.profesor || "Sin asignar"}
                              </p>

                              <p style={{ opacity: 0.8 }}>
                                Fecha: {clase.fecha || "Sin asignar"}
                              </p>

                              <p style={{ opacity: 0.8 }}>
                                Hora: {clase.hora || "Sin asignar"}
                              </p>

                              <p style={{ opacity: 0.7 }}>Cupos: {clase.cupos}</p>

                              <button
                                onClick={() => reservar(clase._id)}
                                disabled={loading || yaInscripto || clase.cupos === 0}
                                style={{
                                  marginTop: "10px",
                                  width: "100%",
                                  background: yaInscripto
                                    ? "#16a34a"
                                    : "linear-gradient(135deg, #22c55e, #4ade80)",
                                  border: "none",
                                  padding: "12px",
                                  borderRadius: "10px",
                                  color: "white",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  transition: "0.2s"
                                }}
                                onMouseEnter={handlePrimaryMouseEnter}
                                onMouseLeave={handlePrimaryMouseLeave}
                              >
                                {loading ? "Cargando..." : yaInscripto ? "Reservado" : "Reservar"}
                              </button>
                            </>
                          )}

                          {esAdmin && (
                            <div style={{ marginTop: "10px" }}>
                              <p style={{ fontSize: "12px", opacity: 0.7 }}>
                                Inscritos: {clase.inscritos?.length || 0}
                              </p>

                              {clase.inscritos?.length > 0 && (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    padding: "10px",
                                    background: "#0f172a",
                                    borderRadius: "10px",
                                    border: "1px solid #1e293b"
                                  }}
                                >
                                  {clase.inscritos.map((inscripto, index) => (
                                    <div
                                      key={inscripto._id || index}
                                      style={{
                                        paddingBottom: index === clase.inscritos.length - 1 ? 0 : "8px",
                                        marginBottom: index === clase.inscritos.length - 1 ? 0 : "8px",
                                        borderBottom: index === clase.inscritos.length - 1
                                          ? "none"
                                          : "1px solid rgba(148, 163, 184, 0.15)"
                                      }}
                                    >
                                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold" }}>
                                        {inscripto.nombre || "Usuario"}
                                      </p>
                                      <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.75 }}>
                                        {inscripto.email || "Sin email"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {esAdmin && (
                            <div
                              style={{
                                marginTop: "10px",
                                display: "flex",
                                gap: "10px"
                              }}
                            >
                              <button
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

                              <button
                                onClick={() => {
                                  setEditandoId(clase._id);
                                  setNuevoNombre(clase.nombre);
                                  setNuevoProfesor(clase.profesor || "");
                                  setNuevaFechaClase(clase.fecha || "");
                                  setNuevaHoraClase(clase.hora || "");
                                  setNuevosCupos(String(clase.cupos));
                                }}
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
