const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,

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