const mongoose = require("mongoose");

const claseSchema = new mongoose.Schema({
  nombre: String,
  cupos: Number,
  inscritos: [String]
});

module.exports = mongoose.model("Clase", claseSchema);