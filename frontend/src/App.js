import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import api from "./services/api";

const VISTAS_PUBLICAS = {
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

const HORARIOS_DISPONIBLES = [
  "Lunes, miercoles y viernes de 7:00 a 10:00",
  "Lunes, miercoles y viernes de 14:00 a 19:00",
  "Martes y jueves de 9:00 a 12:00",
  "Martes y jueves de 17:00 a 21:00"
];

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

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
}

function App() {
  const [vista, setVista] = useState(VISTAS_PUBLICAS.LOGIN);
  const [tiempo, setTiempo] = useState(TIEMPO_VERIFICACION);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [profesor, setProfesor] = useState("");
  const [horario, setHorario] = useState("");
  const [cupos, setCupos] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoProfesor, setNuevoProfesor] = useState("");
  const [nuevoHorario, setNuevoHorario] = useState("");
  const [nuevosCupos, setNuevosCupos] = useState("");

  const [loading, setLoading] = useState(false);
  const [clases, setClases] = useState([]);

  const [codigo, setCodigo] = useState("");
  const [emailVerificar, setEmailVerificar] = useState("");

  const user = getStoredUser();
  const esAdmin = user?.rol === "admin";
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

  const limpiarFormularioClase = () => {
    setNombre("");
    setProfesor("");
    setHorario("");
    setCupos("");
  };

  const login = async () => {
    try {
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
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
    try {
      await api.delete(`/clases/${id}`);
      toast.success("Clase eliminada");
      await fetchClases();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo eliminar la clase");
    }
  };

  const editarClase = async (id) => {
    try {
      const response = await api.put(`/clases/${id}`, {
        nombre: nuevoNombre,
        profesor: nuevoProfesor,
        horario: nuevoHorario,
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
      setNuevoHorario("");
      setNuevosCupos("");
      toast.success("Clase actualizada");
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo actualizar la clase");
    }
  };

  const crearClase = async () => {
    try {
      await api.post("/crear-clase", { nombre, profesor, horario, cupos });
      toast.success("Clase creada");
      limpiarFormularioClase();
      await fetchClases();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "No se pudo crear la clase");
    }
  };

  const misClases = clases.filter((clase) =>
    clase.inscritos?.some((inscripto) => inscripto._id === user?._id)
  );

  return (
    <>
      <Toaster />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          background: "linear-gradient(135deg, #020617, #0f172a, #020617)",
          color: "white",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        {user && (
          <div
            style={{
              width: "240px",
              background: "rgba(2,6,23,0.9)",
              backdropFilter: "blur(10px)",
              padding: "25px",
              borderRight: "1px solid #1e293b"
            }}
          >
            <h2 style={{ color: "#22c55e", fontWeight: "bold", fontSize: "22px" }}>
              LOLIFIT
            </h2>

            <button
              style={menuBtn}
              onClick={() => setVista(VISTAS_PRIVADAS.PERFIL)}
            >
              Perfil
            </button>

            <div
              style={{
                marginTop: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "15px"
              }}
            >
              <button
                style={menuBtn}
                onClick={() => setVista(VISTAS_PRIVADAS.DASHBOARD)}
              >
                Dashboard
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
          </div>
        )}

        <div style={{ flex: 1, padding: "30px" }}>
          {!user ? (
            <div
              style={{
                maxWidth: "400px",
                margin: "auto",
                marginTop: "100px",
                background: "#020617",
                padding: "30px",
                borderRadius: "10px"
              }}
            >
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
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button style={btnStyle} onClick={login}>
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
                  />
                  <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />

                  <button style={btnStyle} onClick={registro}>
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
                  />

                  <button style={btnStyle} onClick={verificarCuenta}>
                    Verificar
                  </button>
                  <button style={btnStyle} onClick={reenviarCodigo}>
                    Reenviar codigo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {vistaPrivadaActiva === VISTAS_PRIVADAS.DASHBOARD && (
                <>
                  <h1>Dashboard</h1>
                  <p>Bienvenido {user.nombre}</p>
                  <p>Tenes {misClases.length} clases reservadas.</p>

                  <button
                    style={btnStyle}
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    Logout
                  </button>
                </>
              )}

              {vistaPrivadaActiva === VISTAS_PRIVADAS.PERFIL && (
                <>
                  <h1>Perfil</h1>
                  <p>Nombre: {user.nombre}</p>
                  <p>Email: {user.email}</p>
                  <p>Rol: {user.rol}</p>
                  <p>Clases reservadas: {misClases.length}</p>
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
                        />

                        <select
                          style={inputStyle}
                          value={horario}
                          onChange={(e) => setHorario(e.target.value)}
                        >
                          <option value="">Seleccionar horario</option>
                          {HORARIOS_DISPONIBLES.map((opcionHorario) => (
                            <option key={opcionHorario} value={opcionHorario}>
                              {opcionHorario}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Cupos"
                          value={cupos}
                          onChange={(e) => setCupos(e.target.value)}
                          style={inputStyle}
                        />

                        <button style={btnStyle} onClick={crearClase}>
                          Crear clase
                        </button>
                      </div>
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
                            transition: "all 0.3s ease"
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
                              />

                              <select
                                value={nuevoHorario}
                                onChange={(e) => setNuevoHorario(e.target.value)}
                                style={inputStyle}
                              >
                                <option value="">Seleccionar horario</option>
                                {HORARIOS_DISPONIBLES.map((opcionHorario) => (
                                  <option key={opcionHorario} value={opcionHorario}>
                                    {opcionHorario}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="number"
                                placeholder="Cupos"
                                value={nuevosCupos}
                                onChange={(e) => setNuevosCupos(e.target.value)}
                                style={inputStyle}
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
                                    cursor: "pointer"
                                  }}
                                >
                                  Guardar
                                </button>

                                <button
                                  onClick={() => {
                                    setEditandoId(null);
                                    setNuevoNombre("");
                                    setNuevoProfesor("");
                                    setNuevoHorario("");
                                    setNuevosCupos("");
                                  }}
                                  style={{
                                    flex: 1,
                                    background: "#1e293b",
                                    border: "1px solid #334155",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    color: "white",
                                    cursor: "pointer"
                                  }}
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
                                Horario: {clase.horario || "Sin asignar"}
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
                                  background: "#dc2626",
                                  color: "white",
                                  border: "none",
                                  padding: "6px",
                                  borderRadius: "6px",
                                  cursor: "pointer"
                                }}
                              >
                                Eliminar
                              </button>

                              <button
                                onClick={() => {
                                  setEditandoId(clase._id);
                                  setNuevoNombre(clase.nombre);
                                  setNuevoProfesor(clase.profesor || "");
                                  setNuevoHorario(clase.horario || "");
                                  setNuevosCupos(String(clase.cupos));
                                }}
                                style={{
                                  background: "#f59e0b",
                                  color: "black",
                                  border: "none",
                                  padding: "6px",
                                  borderRadius: "6px",
                                  cursor: "pointer"
                                }}
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
