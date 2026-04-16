const express = require("express");
const cors = require("cors");
const User = require("./models/user");
const mongoose = require("mongoose");
const Clase = require("./models/Clase");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

mongoose.connect("mongodb://localhost:27017/gym")
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Error Mongo:", err));
  
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.listen(5000, () => {
  console.log("Servidor en http://localhost:5000");
});

//usuarios

//registro

app.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;

  const existe = await User.findOne({ email });


  if (existe) {
    return res.status(400).json({ mensaje: "Usuario ya existe" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const nuevoUsuario = new User({
    nombre,
    email,
    password: hashedPassword
  });

  await nuevoUsuario.save();

  res.json({ mensaje: "Usuario creado" });
});

// login

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ mensaje: "Usuario no existe" });
  }

  const passwordValido = await bcrypt.compare(password, user.password);

  if (!passwordValido) {
    return res.status(400).json({ mensaje: "Contraseña incorrecta" });
  }

  const token = jwt.sign(
    { id: user._id },
    "secreto123",
    { expiresIn: "1d" }
  );

  res.json({ token, user });
});

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secreto123");
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: "Token inválido" });
  }
};
// Endpoint de clases

let clases = [
  { id: 1, nombre: "Crossfit", cupos: 10, inscritos: [] },
  { id: 2, nombre: "Yoga", cupos: 8, inscritos: [] },
  { id: 3, nombre: "Spinning", cupos: 12, inscritos: [] }
];

app.get("/clases", async (req, res) => {
  const clases = await Clase.find();
  res.json(clases);
});

app.get("/seed", async (req, res) => {
  await Clase.deleteMany();

  await Clase.create([
    { nombre: "Crossfit", cupos: 10, inscritos: [] },
    { nombre: "Yoga", cupos: 8, inscritos: [] },
    { nombre: "Spinning", cupos: 12, inscritos: [] }
  ]);

  res.send("Clases creadas");
});

// Endpoint de reserva

app.post("/reservar", verificarToken, async (req, res) => {
  try {
    const { claseId } = req.body;
    const userId = req.userId;

    console.log("CLASE ID:", claseId);
    console.log("USER ID:", userId);

    const clase = await Clase.findById(claseId);

    if (!clase) {
      return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    if (clase.inscritos.includes(String(userId))) {
      return res.status(400).json({ mensaje: "Ya estás inscrito" });
    }

    if (clase.cupos <= 0) {
      return res.status(400).json({ mensaje: "Clase llena" });
    }

    clase.cupos -= 1;
    clase.inscritos.push(String(userId));

    await clase.save();

    res.json({ mensaje: "Reserva confirmada" });

  } catch (error) {
    console.log("ERROR REAL:", error);
    res.status(500).json({ mensaje: "Error en servidor" });
  }
});

//Endpoint crear clase

app.post("/crear-clase", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { nombre, cupos } = req.body;

  const nuevaClase = new Clase({
    nombre,
    cupos,
    inscritos: []
  });

  await nuevaClase.save();

  res.json({ mensaje: "Clase creada" });
});

//Endpoint eliminar clases    

app.delete("/clases/:id", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { id } = req.params;

  await Clase.findByIdAndDelete(id);

  res.json({ mensaje: "Clase eliminada" });
});