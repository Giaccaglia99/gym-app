const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
require("dotenv").config();

const User = require("./models/user");
const Clase = require("./models/Clase");
const Reserva = require("./models/Reserva");
const MovimientoCredito = require("./models/MovimientoCredito");

const app = express();
const VALOR_CREDITO_ARS = 5000;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const mpClient = MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }) : null;
const mpPreference = mpClient ? new Preference(mpClient) : null;
const mpPayment = mpClient ? new Payment(mpClient) : null;

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
const DIA_LABELS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const CLASES_POR_DEFECTO = [
  {
    nombre: "Musculacion",
    profesor: "Profe LOLIFIT",
    diasSemana: [1, 3, 5],
    hora: "18:00",
    cupoMaximo: 12,
    creditosCosto: 9
  },
  {
    nombre: "Funcional",
    profesor: "Profe LOLIFIT",
    diasSemana: [2, 4],
    hora: "10:30",
    cupoMaximo: 12,
    creditosCosto: 9
  },
  {
    nombre: "Cardio",
    profesor: "Profe LOLIFIT",
    diasSemana: [1, 3],
    hora: "19:00",
    cupoMaximo: 12,
    creditosCosto: 10
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
  2: [["08:00", "10:00"], ["18:00", "22:00"]],
  3: [["07:00", "10:00"], ["14:00", "19:00"]],
  4: [["08:00", "10:00"], ["18:00", "22:00"]],
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

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDayLabel(diaSemana) {
  return DIA_LABELS[diaSemana] || "Dia";
}

function buildDiasLabel(diasSemana = []) {
  return diasSemana
    .map((dia) => getDayLabel(dia))
    .join(" / ");
}

function buildHorarioSemanal(diasSemana, hora) {
  return `${buildDiasLabel(diasSemana)} - ${hora} hs`;
}

function validarClaseSemanal({ nombre, profesor, diasSemana, hora, cupoMaximo, creditosCosto }) {
  if (!nombre || !profesor || !Array.isArray(diasSemana) || diasSemana.length === 0 || !hora || !cupoMaximo) {
    return {
      valido: false,
      mensaje: "Nombre, profesor, dias, hora y cupo son obligatorios"
    };
  }

  const diasNormalizados = [...new Set(diasSemana.map((dia) => Number(dia)))].sort((a, b) => a - b);

  for (const dia of diasNormalizados) {
    if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
      return {
        valido: false,
        mensaje: "Dia invalido"
      };
    }

    const ventanas = HORARIOS_PERMITIDOS[dia];

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
        mensaje: "La hora no esta permitida para los dias elegidos"
      };
    }
  }

  if (Number(cupoMaximo) <= 0) {
    return {
      valido: false,
      mensaje: "El cupo debe ser mayor a 0"
    };
  }

  if (Number(creditosCosto) <= 0) {
    return {
      valido: false,
      mensaje: "El costo en creditos debe ser mayor a 0"
    };
  }

  return {
    valido: true,
    diasSemana: diasNormalizados
  };
}

async function inicializarClasesPorDefecto() {
  const cantidadPlantillas = await Clase.countDocuments({
    diasSemana: { $exists: true }
  });

  if (cantidadPlantillas === 0) {
    await Clase.deleteMany({});
    await Reserva.deleteMany({});
    await Clase.insertMany(
      CLASES_POR_DEFECTO.map((clase) => ({
        ...clase,
        horario: buildHorarioSemanal(clase.diasSemana, clase.hora),
        inscritos: []
      }))
    );
    console.log("Clases semanales por defecto creadas");
  }
}

mongoose.connection.once("open", () => {
  inicializarClasesPorDefecto().catch((error) => {
    console.log("Error inicializando clases por defecto:", error);
  });
});

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

function buildUserResponse(user) {
  return {
    _id: user._id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    objetivo: user.objetivo,
    creditos: user.creditos || 0,
    packActivo: user.packActivo || null,
    mesActivo: user.mesActivo || null,
    fechaUltimaCompra: user.fechaUltimaCompra || null
  };
}

function getPackById(packId) {
  return PACKS_MENSUALES.find((pack) => pack.id === packId) || null;
}

function getCompraConfig({ tipo, cantidadCreditos }) {
  if (tipo === "pack_9") {
    return {
      tipoCompra: "pack_9",
      creditos: 9,
      montoARS: 45000,
      pack: PACKS_MENSUALES[0],
      titulo: "Pack 2 veces por semana"
    };
  }

  if (tipo === "pack_10") {
    return {
      tipoCompra: "pack_10",
      creditos: 10,
      montoARS: 50000,
      pack: PACKS_MENSUALES[1],
      titulo: "Pack 3 veces por semana"
    };
  }

  if (tipo === "custom") {
    const creditos = Number(cantidadCreditos);

    if (!Number.isInteger(creditos) || creditos <= 0) {
      return null;
    }

    return {
      tipoCompra: "custom",
      creditos,
      montoARS: creditos * VALOR_CREDITO_ARS,
      pack: null,
      titulo: `${creditos} creditos personalizados`
    };
  }

  return null;
}

function getMercadoPagoMode() {
  if (MP_ACCESS_TOKEN.startsWith("TEST-")) {
    return "test";
  }

  if (MP_ACCESS_TOKEN.startsWith("APP_USR-")) {
    return "production";
  }

  return "unknown";
}

function normalizePublicUrl(url, fallback) {
  const value = (url || fallback || "").trim();

  if (!value) {
    return fallback;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getCheckoutBackUrls() {
  const frontendBase = normalizePublicUrl(FRONTEND_URL, "http://localhost:3000");

  return {
    success: `${frontendBase}/`,
    failure: `${frontendBase}/`,
    pending: `${frontendBase}/`
  };
}

function shouldUseAutoReturn() {
  const frontendBase = normalizePublicUrl(FRONTEND_URL, "http://localhost:3000");

  return !frontendBase.includes("localhost") && !frontendBase.includes("127.0.0.1");
}

function shouldUseBackUrls() {
  const frontendBase = normalizePublicUrl(FRONTEND_URL, "http://localhost:3000");

  return !frontendBase.includes("localhost") && !frontendBase.includes("127.0.0.1");
}

async function registrarMovimiento({
  userId,
  tipo,
  creditos,
  montoARS = 0,
  descripcion = "",
  pack = null,
  monthKey = getMonthKey(),
  paymentId = null,
  externalReference = null,
  estado = "aprobado"
}) {
  const movimiento = {
    userId,
    tipo,
    creditos,
    montoARS,
    descripcion,
    pack,
    monthKey,
    estado
  };

  if (paymentId) {
    movimiento.paymentId = paymentId;
  }

  if (externalReference) {
    movimiento.externalReference = externalReference;
  }

  await MovimientoCredito.create(movimiento);
}

async function acreditarCompraMercadoPago(payment) {
  if (String(payment.status) !== "approved") {
    return { procesado: false, motivo: "Pago no aprobado" };
  }

  const paymentId = String(payment.id);
  const yaProcesado = await MovimientoCredito.findOne({
    paymentId,
    estado: "aprobado"
  });

  if (yaProcesado) {
    return { procesado: false, motivo: "Pago ya acreditado" };
  }

  const metadata = payment.metadata || {};
  const userId = metadata.userId;
  const creditos = Number(metadata.creditos);
  const tipoCompra = metadata.tipoCompra || "custom";
  const externalReference = payment.external_reference || metadata.externalReference || null;

  if (!userId || !Number.isInteger(creditos) || creditos <= 0) {
    throw new Error("Metadata de pago invalida");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("Usuario del pago no encontrado");
  }

  const pack = tipoCompra === "pack_9"
    ? getPackById("pack_2x_semana")
    : tipoCompra === "pack_10"
      ? getPackById("pack_3x_semana")
      : null;

  user.creditos = (user.creditos || 0) + creditos;
  user.fechaUltimaCompra = new Date();
  user.mesActivo = getMonthKey();

  if (pack) {
    user.packActivo = pack;
  }

  await user.save();

  const movimientoPendiente = externalReference
    ? await MovimientoCredito.findOne({ externalReference, estado: "pendiente" })
    : null;

  if (movimientoPendiente) {
    movimientoPendiente.estado = "aprobado";
    movimientoPendiente.paymentId = paymentId;
    movimientoPendiente.descripcion = movimientoPendiente.descripcion || `Compra online aprobada por Mercado Pago`;
    movimientoPendiente.montoARS = Number(payment.transaction_amount || movimientoPendiente.montoARS || 0);
    await movimientoPendiente.save();
  } else {
    await registrarMovimiento({
      userId: user._id,
      tipo: "compra_online",
      creditos,
      montoARS: Number(payment.transaction_amount || 0),
      descripcion: `Compra online aprobada por Mercado Pago`,
      pack,
      monthKey: user.mesActivo,
      paymentId,
      externalReference,
      estado: "aprobado"
    });
  }

  return { procesado: true, user: buildUserResponse(user) };
}

async function crearPagoMercadoPagoParaUsuario(user, { tipo, cantidadCreditos }) {
  const compra = getCompraConfig({ tipo, cantidadCreditos });

  if (!compra) {
    return null;
  }

  const externalReference = `lf-${user._id}-${Date.now()}-${crypto.randomUUID()}`;
  if (!mpPreference) {
    throw new Error("Mercado Pago no configurado");
  }

  const preferenceBody = {
    items: [
      {
        title: compra.titulo,
        quantity: 1,
        currency_id: "ARS",
        unit_price: Number(compra.montoARS)
      }
    ],
    payer: {
      name: user.nombre,
      email: user.email
    },
    external_reference: externalReference,
    notification_url: `${BACKEND_URL}/webhook/mercadopago`,
    metadata: {
      userId: String(user._id),
      creditos: compra.creditos,
      tipoCompra: compra.tipoCompra,
      externalReference
    }
  };

  if (shouldUseBackUrls()) {
    const backUrls = getCheckoutBackUrls();
    preferenceBody.back_urls = backUrls;
    preferenceBody.redirect_urls = backUrls;
  }

  if (shouldUseAutoReturn()) {
    preferenceBody.auto_return = "approved";
  }

  const preference = await mpPreference.create({
    body: preferenceBody
  });

  await registrarMovimiento({
    userId: user._id,
    tipo: "compra_online",
    creditos: compra.creditos,
    montoARS: compra.montoARS,
    descripcion: `Compra iniciada en Mercado Pago - ${compra.titulo}`,
    pack: compra.pack,
    monthKey: getMonthKey(),
    externalReference,
    estado: "pendiente"
  });

  return {
    url: preference.init_point || preference.sandbox_init_point,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    externalReference,
    creditos: compra.creditos,
    montoARS: compra.montoARS
  };
}

async function buildClasesResponse(monthKey = getMonthKey()) {
  const clases = await Clase.find({
    diasSemana: { $exists: true }
  }).sort({ hora: 1 });

  const reservas = await Reserva.find({ monthKey })
    .populate("userId", "nombre email")
    .lean();

  const reservasPorClase = reservas.reduce((acc, reserva) => {
    const claseId = String(reserva.claseId);

    if (!acc[claseId]) {
      acc[claseId] = [];
    }

    acc[claseId].push(reserva.userId);
    return acc;
  }, {});

  return clases
    .sort((a, b) => {
      const firstDayA = a.diasSemana?.[0] ?? 0;
      const firstDayB = b.diasSemana?.[0] ?? 0;

      if (firstDayA !== firstDayB) {
        return firstDayA - firstDayB;
      }

      return a.hora.localeCompare(b.hora);
    })
    .map((clase) => {
    const inscritos = reservasPorClase[String(clase._id)] || [];
    const reservasCount = inscritos.length;

    return {
      _id: clase._id,
      nombre: clase.nombre,
      profesor: clase.profesor,
      diasSemana: clase.diasSemana,
      diasLabel: buildDiasLabel(clase.diasSemana),
      hora: clase.hora,
      horario: buildHorarioSemanal(clase.diasSemana, clase.hora),
      cupoMaximo: clase.cupoMaximo,
      creditosCosto: clase.creditosCosto || 9,
      cuposDisponibles: Math.max(clase.cupoMaximo - reservasCount, 0),
      reservasCount,
      inscritos,
      monthKey
    };
    });
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
    verificado: false,
    creditos: 0,
    packActivo: null,
    mesActivo: null
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

  res.json({ token, user: buildUserResponse(user) });
});

app.get("/perfil-plan", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ mensaje: "Usuario no encontrado" });
  }

  const planMensual = await asegurarPlanMensual(user);

  res.json({
    user: buildUserResponse(user),
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
    user: buildUserResponse(user),
    planMensual: user.planMensual
  });
});

app.get("/packs", (req, res) => {
  res.json({
    valorCreditoARS: 5000,
    packs: PACKS_MENSUALES
  });
});

app.get("/mis-movimientos", verificarToken, async (req, res) => {
  const movimientos = await MovimientoCredito.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json(movimientos);
});

app.post("/crear-pago", verificarToken, async (req, res) => {
  try {
    const { tipo, cantidadCreditos } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const pago = await crearPagoMercadoPagoParaUsuario(user, { tipo, cantidadCreditos });

    if (!pago) {
      return res.status(400).json({ mensaje: "Compra invalida" });
    }

    res.json(pago);
  } catch (error) {
    console.log("ERROR CREAR PAGO MP:", {
      message: error?.message,
      cause: error?.cause,
      details: error?.cause?.[0]?.description || error?.cause || error,
      mpMode: getMercadoPagoMode(),
      frontendUrl: FRONTEND_URL,
      backUrls: shouldUseBackUrls() ? getCheckoutBackUrls() : "disabled_for_localhost",
      autoReturn: shouldUseAutoReturn() ? "approved" : "disabled_for_localhost"
    });
    res.status(500).json({
      mensaje: MP_ACCESS_TOKEN
        ? "No se pudo iniciar el pago con Mercado Pago"
        : "Mercado Pago no esta configurado en el backend",
      error: error?.cause?.[0]?.description || error?.message || "Error desconocido al crear la preferencia"
    });
  }
});

app.post("/comprar-pack", verificarToken, async (req, res) => {
  const { packId } = req.body;
  const tipo = packId === "pack_2x_semana" ? "pack_9" : packId === "pack_3x_semana" ? "pack_10" : null;

  if (!tipo) {
    return res.status(400).json({ mensaje: "Pack invalido" });
  }

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const pago = await crearPagoMercadoPagoParaUsuario(user, { tipo });
    return res.json(pago);
  } catch (error) {
    console.log("ERROR COMPRA PACK MP:", {
      message: error?.message,
      cause: error?.cause,
      details: error?.cause?.[0]?.description || error?.cause || error,
      mpMode: getMercadoPagoMode()
    });
    return res.status(500).json({
      mensaje: MP_ACCESS_TOKEN
        ? "No se pudo iniciar el pago del pack"
        : "Mercado Pago no esta configurado en el backend",
      error: error?.cause?.[0]?.description || error?.message || "Error desconocido al crear la preferencia"
    });
  }
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

app.post("/webhook/mercadopago", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query["data.id"] || req.query.id || req.body?.id;

    if (!paymentId) {
      return res.status(200).send("ok");
    }

    if (!mpPayment) {
      return res.status(200).send("ok");
    }

    const payment = await mpPayment.get({
      id: String(paymentId)
    });
    await acreditarCompraMercadoPago(payment);

    return res.status(200).send("ok");
  } catch (error) {
    console.log("ERROR WEBHOOK MP:", error?.data || error);
    return res.status(200).send("ok");
  }
});

app.get("/clases", async (req, res) => {
  const clases = await buildClasesResponse();
  res.json(clases);
});

app.get("/seed", async (req, res) => {
  await Reserva.deleteMany({});
  await MovimientoCredito.deleteMany({});
  await Clase.deleteMany({});
  await Clase.insertMany(
    CLASES_POR_DEFECTO.map((clase) => ({
      ...clase,
      horario: buildHorarioSemanal(clase.diasSemana, clase.hora),
      inscritos: []
    }))
  );

  res.send("Clases semanales creadas");
});

app.post("/reservar", verificarToken, async (req, res) => {
  try {
    const { claseId } = req.body;
    const monthKey = getMonthKey();

    const clase = await Clase.findById(claseId);
    const user = await User.findById(req.userId);

    if (!clase) {
      return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const yaInscripto = await Reserva.findOne({
      userId: user._id,
      claseId: clase._id,
      monthKey
    });

    if (yaInscripto) {
      return res.status(400).json({ mensaje: "Ya estas inscrito a esta clase semanal este mes" });
    }

    const reservasClase = await Reserva.countDocuments({
      claseId: clase._id,
      monthKey
    });

    if (reservasClase >= clase.cupoMaximo) {
      return res.status(400).json({ mensaje: "Clase llena" });
    }

    const costoReserva = Number(clase.creditosCosto || 9);

    if ((user.creditos || 0) < costoReserva) {
      return res.status(400).json({ mensaje: "No tienes creditos suficientes para esta clase" });
    }

    await Reserva.create({
      userId: user._id,
      claseId: clase._id,
      monthKey
    });

    user.creditos -= costoReserva;
    await user.save();

    await registrarMovimiento({
      userId: user._id,
      tipo: "reserva",
      creditos: -costoReserva,
      montoARS: 0,
      descripcion: `Reserva mensual en ${clase.nombre} - ${buildHorarioSemanal(clase.diasSemana, clase.hora)}`,
      monthKey
    });

    res.json({
      mensaje: "Reserva mensual confirmada",
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.log("ERROR RESERVAR:", error);
    res.status(500).json({ mensaje: "Error en servidor" });
  }
});

app.post("/crear-clase", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user || user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { nombre, profesor, diasSemana, hora, cupoMaximo, creditosCosto } = req.body;
  const validacion = validarClaseSemanal({
    nombre,
    profesor,
    diasSemana,
    hora,
    cupoMaximo: Number(cupoMaximo),
    creditosCosto: Number(creditosCosto)
  });

  if (!validacion.valido) {
    return res.status(400).json({ mensaje: validacion.mensaje });
  }

  const existe = await Clase.findOne({
    hora,
    diasSemana: validacion.diasSemana
  });

  if (existe) {
    return res.status(400).json({ mensaje: "Ya existe una clase en ese dia y horario" });
  }

  const nuevaClase = new Clase({
    nombre,
    profesor,
    diasSemana: validacion.diasSemana,
    hora,
    cupoMaximo: Number(cupoMaximo),
    creditosCosto: Number(creditosCosto),
    horario: buildHorarioSemanal(validacion.diasSemana, hora),
    inscritos: []
  });

  await nuevaClase.save();

  res.json({ mensaje: "Clase semanal creada", clase: nuevaClase });
});

app.get("/admin/usuarios", verificarToken, async (req, res) => {
  const admin = await User.findById(req.userId);

  if (!admin || admin.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const usuarios = await User.find({}, "nombre email rol creditos packActivo mesActivo")
    .sort({ nombre: 1 })
    .lean();

  res.json(usuarios);
});

const ajustarCreditosHandler = async (req, res) => {
  const admin = await User.findById(req.userId);

  if (!admin || admin.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { userId, packId, creditos, motivo } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ mensaje: "Usuario no encontrado" });
  }

  const pack = packId ? getPackById(packId) : null;
  const creditosAsignados = pack ? pack.creditos : Number(creditos);

  if (!creditosAsignados || Number(creditosAsignados) === 0) {
    return res.status(400).json({ mensaje: "Debes indicar un pack o una cantidad valida de creditos" });
  }

  if ((user.creditos || 0) + Number(creditosAsignados) < 0) {
    return res.status(400).json({ mensaje: "No puedes dejar al usuario con creditos negativos" });
  }

  user.creditos = (user.creditos || 0) + Number(creditosAsignados);
  user.fechaUltimaCompra = new Date();
  user.mesActivo = getMonthKey();

  if (pack && Number(creditosAsignados) > 0) {
    user.packActivo = pack;
  }

  await user.save();

  await registrarMovimiento({
    userId: user._id,
    tipo: motivo === "ajuste" || Number(creditosAsignados) < 0 ? "ajuste" : "carga_admin",
    creditos: Number(creditosAsignados),
    montoARS: pack ? pack.precioARS : Math.abs(Number(creditosAsignados)) * 5000,
    descripcion: motivo || "Carga manual desde admin",
    pack,
    monthKey: user.mesActivo
  });

  res.json({
    mensaje: "Creditos asignados con exito",
    user: buildUserResponse(user)
  });
};

app.post("/admin/asignar-creditos", verificarToken, ajustarCreditosHandler);
app.post("/admin/ajustar-creditos", verificarToken, ajustarCreditosHandler);

app.delete("/clases/:id", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user || user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { id } = req.params;

  await Reserva.deleteMany({ claseId: id });
  await Clase.findByIdAndDelete(id);

  res.json({ mensaje: "Clase eliminada" });
});

app.put("/clases/:id", verificarToken, async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user || user.rol !== "admin") {
    return res.status(403).json({ mensaje: "No autorizado" });
  }

  const { id } = req.params;
  const { nombre, profesor, diasSemana, hora, cupoMaximo, creditosCosto } = req.body;
  const validacion = validarClaseSemanal({
    nombre,
    profesor,
    diasSemana,
    hora,
    cupoMaximo: Number(cupoMaximo),
    creditosCosto: Number(creditosCosto)
  });

  if (!validacion.valido) {
    return res.status(400).json({ mensaje: validacion.mensaje });
  }

  const existe = await Clase.findOne({
    _id: { $ne: id },
    hora,
    diasSemana: validacion.diasSemana
  });

  if (existe) {
    return res.status(400).json({ mensaje: "Ya existe una clase en ese dia y horario" });
  }

  const clase = await Clase.findByIdAndUpdate(
    id,
    {
      nombre,
      profesor,
      diasSemana: validacion.diasSemana,
      hora,
      cupoMaximo: Number(cupoMaximo),
      creditosCosto: Number(creditosCosto),
      horario: buildHorarioSemanal(validacion.diasSemana, hora)
    },
    { new: true }
  );

  res.json(clase);
});
