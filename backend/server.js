const express = require("express");
const cors = require("cors");
const User = require("./models/user");
const mongoose = require("mongoose");
const Clase = require("./models/Clase");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const CLASES_POR_DEFECTO = [
  {
    nombre: "Musculacion",
    profesor: "Profesor a definir",
    horario: "Lunes, miercoles y viernes de 7:00 a 10:00",
    cupos: 10,
    inscritos: []
  },
  {
    nombre: "Cardio",
    profesor: "Profesor a definir",
    horario: "Lunes, miercoles y viernes de 14:00 a 19:00",
    cupos: 8,
    inscritos: []
  },
  {
    nombre: "Clases personalizadas",
    profesor: "Profesor a definir",
    horario: "Martes y jueves de 17:00 a 21:00",
    cupos: 12,
    inscritos: []
  }
];

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

async function inicializarClasesPorDefecto() {
  const cantidadClases = await Clase.countDocuments();

  if (cantidadClases === 0) {
    await Clase.insertMany(CLASES_POR_DEFECTO);
    console.log("Clases por defecto creadas");
  }
}

mongoose.connection.once("open", () => {
  inicializarClasesPorDefecto().catch((error) => {
    console.log("Error inicializando clases por defecto:", error);
  });
});

//usuarios

//registro

app.post("/registro", async (req, res) => {
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();

const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 min

const nuevoUsuario = new User({
  nombre,
  email,
  password: hashedPassword,
  codigoVerificacion: codigo,
  codigoExpira: expiracion,
  verificado: false
});

await nuevoUsuario.save();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verificá tu cuenta",
      text: `Tu código es: ${codigo}`
    });
} catch (error) {
  console.log("Error enviando mail:", error);
}

  res.json({ mensaje: "Usuario creado" });
});

// login

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user.verificado) {
    return res.status(403).json({ mensaje: "Debes verificar tu cuenta" });
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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

//Endpoint verificar
app.post("/verificar", async (req, res) => {
  const { email, codigo } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ mensaje: "Usuario no existe" });
  }

  if (user.codigoVerificacion !== codigo) {
    return res.status(400).json({ mensaje: "Código incorrecto" });
  }

  if (new Date() > user.codigoExpira) {
  return res.status(400).json({ mensaje: "Código expirado" });
}

  user.verificado = true;
  user.codigoVerificacion = null;

  await user.save();

  res.json({ mensaje: "Cuenta verificada" });
});

app.post("/reenviar-codigo", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ mensaje: "Usuario no existe" });
  }

  const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();

  user.codigoVerificacion = nuevoCodigo;
  user.codigoExpira = new Date(Date.now() + 5 * 60 * 1000);

  await user.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Nuevo código",
    text: `Tu nuevo código es: ${nuevoCodigo}`
  });

  res.json({ mensaje: "Código reenviado" });
});

app.get("/clases", async (req, res) => {
  const clases = await Clase.find().populate("inscritos", "nombre email");
  res.json(clases);
});

app.get("/seed", async (req, res) => {
  await Clase.deleteMany();
  await Clase.insertMany(CLASES_POR_DEFECTO);

  res.send("Clases creadas");
});

// Endpoint de reserva

app.post("/reservar", async (req, res) => {
  try {
    const { claseId, userId } = req.body;

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

    if (!userId) {
      return res.status(400).json({ mensaje: "Falta userId" });
    }

    clase.cupos -= 1;
    clase.inscritos.push(userId);

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

  const { nombre, profesor, horario, cupos } = req.body;

  const nuevaClase = new Clase({
    nombre,
    profesor,
    horario,
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

app.put("/clases/:id", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { id } = req.params;
  const { nombre, profesor, horario, cupos } = req.body;

  const clase = await Clase.findByIdAndUpdate(
    id,
    { nombre, profesor, horario, cupos },
    { new: true }
  );

  res.json(clase);
});
