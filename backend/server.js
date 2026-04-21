const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/user");
const Clase = require("./models/Clase");

const app = express();

const CLASES_POR_DEFECTO = [
  {
    nombre: "Musculacion",
    profesor: "Profesor a definir",
    horario: "Lunes, miercoles y viernes de 7:00 a 10:00",
    fecha: "",
    hora: "",
    cupos: 10,
    inscritos: []
  },
  {
    nombre: "Cardio",
    profesor: "Profesor a definir",
    horario: "Lunes, miercoles y viernes de 14:00 a 19:00",
    fecha: "",
    hora: "",
    cupos: 8,
    inscritos: []
  },
  {
    nombre: "Clases personalizadas",
    profesor: "Profesor a definir",
    horario: "Martes y jueves de 17:00 a 21:00",
    fecha: "",
    hora: "",
    cupos: 12,
    inscritos: []
  }
];

const OBJETIVOS_VALIDOS = [
  "perdida_peso",
  "masa_muscular",
  "mantenimiento",
  "mente_cuerpo"
];

const HORARIOS_PERMITIDOS = {
  1: [["07:00", "10:00"], ["14:00", "19:00"]],
  2: [["09:00", "12:00"], ["17:00", "21:00"]],
  3: [["07:00", "10:00"], ["14:00", "19:00"]],
  4: [["09:00", "12:00"], ["17:00", "21:00"]],
  5: [["07:00", "10:00"], ["14:00", "19:00"]]
};

mongoose.connect("mongodb://localhost:27017/gym")
  .then(() => console.log("Mongo conectado"))
  .catch((err) => console.log("Error Mongo:", err));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.listen(5000, () => {
  console.log("Servidor en http://localhost:5000");
});

function verificarToken(req, res, next) {
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
    return res.status(401).json({ mensaje: "Token invalido" });
  }
}

function validarFechaYHora(fecha, hora) {
  if (!fecha || !hora) {
    return {
      valido: false,
      mensaje: "Fecha y hora son obligatorias"
    };
  }

  const fechaObj = new Date(`${fecha}T00:00:00`);

  if (Number.isNaN(fechaObj.getTime())) {
    return {
      valido: false,
      mensaje: "Fecha invalida"
    };
  }

  const day = fechaObj.getDay();
  const ventanas = HORARIOS_PERMITIDOS[day];

  if (!ventanas) {
    return {
      valido: false,
      mensaje: "Solo se permiten clases de lunes a viernes"
    };
  }

  const dentroDeRango = ventanas.some(([inicio, fin]) => hora >= inicio && hora <= fin);

  if (!dentroDeRango) {
    return {
      valido: false,
      mensaje: "La hora no esta permitida para ese dia"
    };
  }

  return {
    valido: true
  };
}

function construirHorario(fecha, hora) {
  if (!fecha || !hora) {
    return "";
  }

  return `${fecha} a las ${hora}`;
}

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

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildPlanTemplate(objetivo) {
  const templates = {
    perdida_peso: [
      { titulo: "Cardio principal", detalle: "35 a 45 min de cardio moderado", foco: "Cardio" },
      { titulo: "Musculacion ligera", detalle: "Circuito de cuerpo completo", foco: "Resistencia" },
      { titulo: "Movilidad", detalle: "Estiramientos y movilidad articular", foco: "Recuperacion" },
      { titulo: "Cardio por intervalos", detalle: "20 min de intervalos suaves", foco: "Quema calorica" },
      { titulo: "Descanso activo", detalle: "Caminata de 30 min", foco: "Habito" }
    ],
    masa_muscular: [
      { titulo: "Torso y fuerza", detalle: "Trabajo de fuerza con progresion", foco: "Musculacion" },
      { titulo: "Piernas", detalle: "Enfasis en piernas y gluteos", foco: "Volumen" },
      { titulo: "Recuperacion", detalle: "Movilidad y descanso activo", foco: "Recuperacion" },
      { titulo: "Espalda y hombros", detalle: "Bloque de hipertrofia", foco: "Musculacion" },
      { titulo: "Pecho y brazos", detalle: "Trabajo accesorio controlado", foco: "Volumen" }
    ],
    mantenimiento: [
      { titulo: "Rutina balanceada", detalle: "Sesion mixta de fuerza y cardio", foco: "Equilibrio" },
      { titulo: "Cardio moderado", detalle: "30 min de cardio continuo", foco: "Resistencia" },
      { titulo: "Movilidad", detalle: "Trabajo de flexibilidad", foco: "Bienestar" },
      { titulo: "Fuerza general", detalle: "Cuerpo completo con cargas medias", foco: "Constancia" },
      { titulo: "Descanso activo", detalle: "Caminata o bici suave", foco: "Recuperacion" }
    ],
    mente_cuerpo: [
      { titulo: "Respiracion y movilidad", detalle: "Sesion suave de movilidad y respiracion", foco: "Calma" },
      { titulo: "Cardio consciente", detalle: "Caminata activa o bici leve", foco: "Energia" },
      { titulo: "Clase personalizada", detalle: "Trabajo guiado segun sensaciones", foco: "Conexion" },
      { titulo: "Estiramientos", detalle: "Bloque de elongacion y postura", foco: "Flexibilidad" },
      { titulo: "Recuperacion plena", detalle: "Descanso, hidratacion y pausas", foco: "Bienestar" }
    ]
  };

  return templates[objetivo] || templates.mantenimiento;
}

function generarPlanMensual(objetivo, date = new Date()) {
  const monthKey = getMonthKey(date);
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const template = buildPlanTemplate(objetivo);
  const entries = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const templateItem = template[(day - 1) % template.length];
    const entryDate = new Date(year, month, day);
    const isWeekend = entryDate.getDay() === 0 || entryDate.getDay() === 6;

    entries.push({
      fecha: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      titulo: isWeekend ? "Recuperacion" : templateItem.titulo,
      detalle: isWeekend ? "Descanso, movilidad suave o caminata ligera" : templateItem.detalle,
      foco: isWeekend ? "Descanso" : templateItem.foco
    });
  }

  return {
    monthKey,
    objetivo,
    entries
  };
}

async function asegurarPlanMensual(user) {
  const monthKey = getMonthKey();

  if (
    !user.planMensual ||
    user.planMensual.monthKey !== monthKey ||
    user.planMensual.objetivo !== user.objetivo
  ) {
    user.planMensual = generarPlanMensual(user.objetivo, new Date());
    await user.save();
  }

  return user.planMensual;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;
  const existe = await User.findOne({ email });

  if (existe) {
    return res.status(400).json({ mensaje: "Usuario ya existe" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expiracion = new Date(Date.now() + 5 * 60 * 1000);

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
      subject: "Verifica tu cuenta",
      text: `Tu codigo es: ${codigo}`
    });
  } catch (error) {
    console.log("Error enviando mail:", error);
  }

  res.json({ mensaje: "Usuario creado" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ mensaje: "Usuario no existe" });
  }

  if (!user.verificado) {
    return res.status(403).json({ mensaje: "Debes verificar tu cuenta" });
  }

  const passwordValido = await bcrypt.compare(password, user.password);

  if (!passwordValido) {
    return res.status(400).json({ mensaje: "Contrasena incorrecta" });
  }

  const token = jwt.sign(
    { id: user._id },
    "secreto123",
    { expiresIn: "1d" }
  );

  res.json({ token, user });
});

app.get("/perfil-plan", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ mensaje: "Usuario no encontrado" });
  }

  const planMensual = await asegurarPlanMensual(user);

  res.json({
    user: {
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      objetivo: user.objetivo
    },
    planMensual
  });
});

app.put("/perfil-objetivo", verificarToken, async (req, res) => {
  const { objetivo } = req.body;

  if (!OBJETIVOS_VALIDOS.includes(objetivo)) {
    return res.status(400).json({ mensaje: "Objetivo invalido" });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ mensaje: "Usuario no encontrado" });
  }

  user.objetivo = objetivo;
  user.planMensual = generarPlanMensual(objetivo, new Date());
  await user.save();

  res.json({
    mensaje: "Objetivo actualizado",
    user: {
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      objetivo: user.objetivo
    },
    planMensual: user.planMensual
  });
});

app.post("/verificar", async (req, res) => {
  const { email, codigo } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ mensaje: "Usuario no existe" });
  }

  if (user.codigoVerificacion !== codigo) {
    return res.status(400).json({ mensaje: "Codigo incorrecto" });
  }

  if (new Date() > user.codigoExpira) {
    return res.status(400).json({ mensaje: "Codigo expirado" });
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
    subject: "Nuevo codigo",
    text: `Tu nuevo codigo es: ${nuevoCodigo}`
  });

  res.json({ mensaje: "Codigo reenviado" });
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

app.post("/reservar", async (req, res) => {
  try {
    const { claseId, userId } = req.body;
    const clase = await Clase.findById(claseId);

    if (!clase) {
      return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    if (!userId) {
      return res.status(400).json({ mensaje: "Falta userId" });
    }

    const yaInscripto = clase.inscritos.some(
      (inscriptoId) => String(inscriptoId) === String(userId)
    );

    if (yaInscripto) {
      return res.status(400).json({ mensaje: "Ya estas inscrito" });
    }

    if (clase.cupos <= 0) {
      return res.status(400).json({ mensaje: "Clase llena" });
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

app.post("/crear-clase", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { nombre, profesor, fecha, hora, cupos } = req.body;
  const validacion = validarFechaYHora(fecha, hora);

  if (!validacion.valido) {
    return res.status(400).json({ mensaje: validacion.mensaje });
  }

  const nuevaClase = new Clase({
    nombre,
    profesor,
    horario: construirHorario(fecha, hora),
    fecha,
    hora,
    cupos,
    inscritos: []
  });

  await nuevaClase.save();

  res.json({ mensaje: "Clase creada" });
});

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
  const { nombre, profesor, fecha, hora, cupos } = req.body;
  const validacion = validarFechaYHora(fecha, hora);

  if (!validacion.valido) {
    return res.status(400).json({ mensaje: validacion.mensaje });
  }

  const clase = await Clase.findByIdAndUpdate(
    id,
    {
      nombre,
      profesor,
      fecha,
      hora,
      horario: construirHorario(fecha, hora),
      cupos
    },
    { new: true }
  );

  res.json(clase);
});
