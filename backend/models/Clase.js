const mongoose = require("mongoose");

const claseSchema = new mongoose.Schema({
  nombre: String,
  profesor: String,
  horario: String,
  fecha: String,
  hora: String,
  cupos: Number,
  inscritos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

module.exports = mongoose.model("Clase", claseSchema);
