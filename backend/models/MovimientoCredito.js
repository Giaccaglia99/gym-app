const mongoose = require("mongoose");

const movimientoCreditoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tipo: {
      type: String,
      enum: ["compra_online", "carga_admin", "reserva", "ajuste"],
      required: true
    },
    creditos: {
      type: Number,
      required: true
    },
    montoARS: {
      type: Number,
      default: 0
    },
    descripcion: {
      type: String,
      default: ""
    },
    pack: {
      id: String,
      nombre: String,
      creditos: Number,
      precioARS: Number
    },
    monthKey: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("MovimientoCredito", movimientoCreditoSchema);
