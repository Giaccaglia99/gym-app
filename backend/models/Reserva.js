const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    claseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clase",
      required: true
    },
    monthKey: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

reservaSchema.index({ userId: 1, claseId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model("Reserva", reservaSchema);
