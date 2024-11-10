const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB Atlas
mongoose.connect(process.env.ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((error) => console.error("Error connecting to MongoDB Atlas:", error));

// Esquema del juego
const gameSchema = new mongoose.Schema({
    name: String,
    score: Number,
    time: Number,
    errors: Number,
});

const Game = mongoose.model("Game", gameSchema);

// Endpoint para guardar el resultado del juego
app.post("/save-game", async (req, res) => {
    const { name, score, time, errors } = req.body;
    try {
        const game = new Game({ name, score, time, errors });
        await game.save();
        res.status(200).json({ message: "Game result saved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error saving game result", error });
    }
});

// Ruta para obtener el mejor tiempo por usuario
app.get("/best-times", async (req, res) => {
  try {
    const bestTimes = await Game.aggregate([
      {
        $group: {
          _id: "$name",
          score: { $first: "$score" },
          time: { $min: "$time" },
          errors: { $first: "$errors" },
        },
      },
      { $sort: { time: 1 } },
    ]);

    res.status(200).json(bestTimes);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving best times", error });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
