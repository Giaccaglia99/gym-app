const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,
  objetivo: {
    type: String,
    default: "mantenimiento"
  },
  planMensual: {
    monthKey: String,
    objetivo: String,
    entries: [
      {
        fecha: String,
        titulo: String,
        detalle: String,
        foco: String
      }
    ]
  },

  rol: {
    type: String,
    default: "user"
  },

  codigoVerificacion: String,
  codigoExpira: Date, 
  verificado: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("User", userSchema);
