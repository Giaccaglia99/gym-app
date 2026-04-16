const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,
  rol: {
    type: String,
    default: "user"
  }
});

module.exports = mongoose.model("User", userSchema);