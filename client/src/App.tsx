import { useEffect, useMemo, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL;

type Color = {
  name: string;
  color: string;
  correct: boolean;
};

const COLORS: Color[] = [
  { name: "rojo", color: '#f00', correct: false },
  { name: "verde", color: '#0f0', correct: false },
  { name: "azul", color: '#00f', correct: false },
  { name: "amarillo", color: '#ff0', correct: false },
  { name: "naranja", color: '#ffa500', correct: false },
  { name: "violeta", color: '#800080', correct: false },
  { name: "rosa", color: '#ff69b4', correct: false },
  { name: "blanco", color: '#fff', correct: false },
  { name: "negro", color: '#000', correct: false },
  { name: "gris", color: '#808080', correct: false },
  { name: "celeste", color: '#00bfff', correct: false },
  { name: "marrón", color: '#8b4513', correct: false },
];

function App() {
  const [status, setStatus] = useState<'initial' | 'playing' | 'finished'>('initial');
  const [time, setTime] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [errors, setErrors] = useState<number>(0);
  const [gameColors, setGameColors] = useState<Color[]>([]);
  const [previousCorrectColor, setPreviousCorrectColor] = useState<Color | null>(null);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [bestTimes, setBestTimes] = useState<any[]>([]);

  const correctColor = useMemo<Color>(() => gameColors.find((color) => color.correct)!, [gameColors]);
  const incorrectColor = useMemo<Color>(() => gameColors.find((color) => !color.correct)!, [gameColors]);

  function handlePlay() {
    setStatus("playing");
    setTime(0);
    setScore(0);
    setErrors(0);
    setPreviousCorrectColor(null);
    setNewColors();
  }

  function setNewColors() {
    let newCorrectColor, newIncorrectColor;
    do {
      const [randomCorrectColor, randomWrongColor] = COLORS.slice().sort(() => Math.random() - 0.5);
      newCorrectColor = randomCorrectColor;
      newIncorrectColor = randomWrongColor;
    } while (previousCorrectColor && newCorrectColor.name === previousCorrectColor.name);

    setGameColors([
      { ...newCorrectColor, correct: true },
      newIncorrectColor,
    ].sort(() => Math.random() - 0.5));

    setPreviousCorrectColor(newCorrectColor);
  }

  function handleColorClick(clickedColor: Color) {
    if (clickedColor.correct) {
      setScore((score) => score + 1);
      if (score === 9) {
        setStatus("finished");
      } else {
        setNewColors();
      }
    } else {
      setErrors((errors) => errors + 1);
      setScore((score) => (score > 0 ? score - 1 : 0));
      setNewColors();
    }
  }

  function handleSaveGame() {
    fetch(`${apiUrl}/save-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: userName,
        score: score,
        time: time,
        errors: errors,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Juego guardado:", data);
        setShowSaveModal(false);
      })
      .catch((error) => {
        console.error("Error guardando el juego:", error);
      });
  }

  // Obtener los mejores tiempos al cargar el componente
  useEffect(() => {
    fetchBestTimes();
  }, []);

  function fetchBestTimes() {
    fetch(`${apiUrl}/best-times`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la respuesta de la API");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Mejores tiempos recibidos:", data);
        setBestTimes(data);
      })
      .catch((error) => {
        console.error("Error obteniendo los mejores tiempos:", error);
      });
  }

  useEffect(() => {
    let interval: number;
    if (status === "playing") {
      interval = setInterval(() => {
        setTime((time) => time + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${seconds}.${milliseconds < 10 ? "0" : ""}${milliseconds}`;
  };

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  // Condicional para ajustar el tamaño de `main`
  const mainStyle = {
    display: "grid",
    textAlign: "center",
    height: status === "finished" ? "50vh" : "100vh", // Cambiar a 40vh cuando esté en 'finished'
    width: "100vw",
    gridTemplateRows: status === "finished" ? "60px 1fr 60px" : "60px 1fr 60px",
  };

  return (
    <main style={mainStyle} className="app">
      <header className="header">
        <h1>{score} puntos</h1>
        <h1>{formatTime(time)} s</h1>
      </header>

      {status === "playing" && (
        <section className="section" style={{ backgroundColor: incorrectColor.color }}>
          <span className="correct-color" style={{ textTransform: "capitalize", color: correctColor.color }}>
            {correctColor.name}
          </span>
        </section>
      )}

      {status === "playing" && (
        <div className="button-container">
          {gameColors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorClick(color)}
              className="color-button"
              style={{ backgroundColor: color.color }}
            />
          ))}
        </div>
      )}

      {status === "finished" && (
        <div className="overlay">
          <h2>¡Juego terminado!</h2>
          <p>Tu tiempo: {formatTime(time)}</p>
          <p>Errores cometidos: {errors}</p>

          <button onClick={() => setShowSaveModal(true)}>Guardar 💾</button>
          <button onClick={handlePlay}>Volver a jugar! 🔁</button>
        </div>
      )}

      {/* Mostrar la tabla de mejores tiempos solo si el juego ha terminado */}
      {status === "finished" && (
        <div >
          <h3>Mejores Tiempos 🏆</h3>
          {bestTimes.length > 0 ? (
            <table style={{ margin: "0 auto", width: "80%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px" }}>Pos.</th>
                  <th style={{ padding: "10px" }}>Nombre</th>
                  <th style={{ padding: "10px" }}>⏱️</th>
                  <th style={{ padding: "10px" }}>❌</th>
                </tr>
              </thead>
              <tbody>
                {bestTimes.map((bestTime, index) => {
                  const timeInSeconds = parseFloat(bestTime.time) / 1000; // Convierte el tiempo de milisegundos a segundos
                  const formattedTime = timeInSeconds.toFixed(1); // Mantiene 2 decimales

                  return (
                    <tr key={index}>
                      <td style={{ padding: "10px" }}>
                        {getMedal(index)} {index + 1}
                      </td>
                      <td style={{ padding: "10px" }}>{bestTime._id}</td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        {formattedTime}
                        <span style={{ fontSize: "1em" }}>s</span>
                      </td>
                      <td style={{ padding: "10px" }}>{bestTime.errors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>Cargando los mejores tiempos...</p>
          )}
        </div>
      )}

      {showSaveModal && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0)",
            color: "#fff",
            padding: "2em",
            textAlign: "center",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "10px",
            width: "80%",
            boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
          }}
        >
          <h2>Introduce tu nombre</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nombre"
            style={{ marginBottom: "1em", padding: "0.5em", fontSize: "1em", width: "80%" }}
          />
          <br />
          <button onClick={handleSaveGame}>Guardar</button>
          <button onClick={() => setShowSaveModal(false)}>Cancelar</button>
        </div>
      )}

      {status === "initial" && (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <button onClick={handlePlay} style={{ padding: "1em 2em", fontSize: "1.5em" }}>
            Iniciar Juego
          </button>
        </div>
      )}
    </main>
  );
}

export default App;