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
    paymentId: {
      type: String,
      default: undefined
    },
    externalReference: {
      type: String,
      default: undefined
    },
    estado: {
      type: String,
      default: "aprobado"
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

movimientoCreditoSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
movimientoCreditoSchema.index({ externalReference: 1, estado: 1 });

module.exports = mongoose.model("MovimientoCredito", movimientoCreditoSchema);
