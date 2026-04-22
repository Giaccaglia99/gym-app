const mongoose = require("mongoose");

const claseSchema = new mongoose.Schema({
  nombre: String,
  profesor: String,
  diaSemana: Number,
  hora: String,
  cupoMaximo: Number,
  horario: String,
  inscritos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

module.exports = mongoose.model("Clase", claseSchema);
