const mongoose = require("mongoose");

const claseSchema = new mongoose.Schema({
  nombre: String,
  profesor: String,
  diasSemana: [Number],
  hora: String,
  cupoMaximo: Number,
  creditosCosto: {
    type: Number,
    default: 9
  },
  horario: String,
  inscritos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

module.exports = mongoose.model("Clase", claseSchema);
