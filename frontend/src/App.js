import { useEffect, useState } from "react";
import api from "./services/api";

function App() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cupos, setCupos] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const esAdmin = user?.rol === "admin";

  const [clases, setClases] = useState([]);

  useEffect(() => {
    api.get("/clases")
      .then(res => setClases(res.data))
      .catch(err => console.log(err));
  }, []);

  const login = async () => {
    try {
      const res = await api.post("/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.reload();

    } catch (err) {
      alert(err.response?.data?.mensaje);
    }
  };

  const registro = async () => {
    try {
      await api.post("/registro", {
        nombre,
        email,
        password
      });

      alert("Usuario creado");

    } catch (err) {
      alert(err.response?.data?.mensaje);
    }
  };

  const reservar = async (claseId) => {
    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    try {
      const res = await api.post("/reservar", {
        claseId
      });

      alert(res.data.mensaje);

      const nuevas = await api.get("/clases");
      setClases(nuevas.data);

    } catch (error) {
      alert(error.response?.data?.mensaje);
    }
  };

  const crearClase = async () => {
    try {
      await api.post("/crear-clase", {
        nombre,
        cupos
      });

      alert("Clase creada");

      const nuevas = await api.get("/clases");
      setClases(nuevas.data);

    } catch (err) {
      alert(err.response?.data?.mensaje);
    }
  };

  const eliminarClase = async (id) => {
    try {
      await api.delete(`/clases/${id}`);

      alert("Clase eliminada");

      const nuevas = await api.get("/clases");
      setClases(nuevas.data);

    } catch (err) {
      alert(err.response?.data?.mensaje);
    }
};

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>

      {!user && (
        <div>
          <h2>Login / Registro</h2>

          <input placeholder="Nombre" onChange={e => setNombre(e.target.value)} />
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

          <button onClick={registro}>Registrarse</button>
          <button onClick={login}>Login</button>
        </div>
      )}

      {user && (
        <>
          <h2>Bienvenido {user.nombre}</h2>

          {esAdmin && (
            <div style={{ border: "2px solid red", padding: "10px", margin: "10px" }}>
              <h2>Panel Admin</h2>

              <input
                placeholder="Nombre clase"
                onChange={e => setNombre(e.target.value)}
              />

              <input
                placeholder="Cupos"
                type="number"
                onChange={e => setCupos(e.target.value)}
              />

              <button onClick={crearClase}>
                Crear clase
              </button>
            </div>
          )}

          <button onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.reload();
          }}>
            Logout
          </button>

          <h1>Clases</h1>

          {clases.map(c => {
            const yaInscripto = c.inscritos?.includes(user._id);

            return (
              <div
                key={c._id}
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  margin: "10px",
                  borderRadius: "8px"
                }}
              >
                <h3>{c.nombre}</h3>
                <p>Cupos: {c.cupos}</p>

                {esAdmin && (
                  <>
                    <p>Inscritos: {c.inscritos?.length}</p>

                    <ul>
                      {c.inscritos?.map((id, index) => (
                        <li key={index}>{id}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

                <button
                  onClick={() => reservar(c._id)}
                  disabled={yaInscripto || c.cupos === 0}
                  style={{
                    backgroundColor: yaInscripto
                      ? "green"
                      : c.cupos === 0
                      ? "gray"
                      : "blue",
                    color: "white",
                    padding: "8px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  {yaInscripto
                    ? "Reservado ✅"
                    : c.cupos === 0
                    ? "Clase llena ❌"
                    : "Reservar"}
                </button>

                {esAdmin && (
                  <button
                    onClick={() => eliminarClase(c._id)}
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      padding: "8px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Eliminar
                  </button>
                  )}

                </div>

              </div>
            );
          })}
        </>
      )}

    </div>
  );
}

export default App;