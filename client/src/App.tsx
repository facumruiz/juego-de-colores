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
  const [bestTimes, setBestTimes] = useState<any[]>([]); // Almacenará los mejores tiempos
  const [loadingBestTimes, setLoadingBestTimes] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);

  const correctColor = useMemo<Color>(() => gameColors.find((color) => color.correct)!, [gameColors]);
  const incorrectColor = useMemo<Color>(() => gameColors.find((color) => !color.correct)!, [gameColors]);
  // Función para obtener la medalla
  function getMedal(index: number) {
    if (index === 0) return "🥇"; // Oro
    if (index === 1) return "🥈"; // Plata
    if (index === 2) return "🥉"; // Bronce
    return ""; // Para el resto de las posiciones no mostrar medalla
  }

  function handlePlay() {
    setStatus("playing");
    setTime(0);
    setScore(0);
    setErrors(0);
    setPreviousCorrectColor(null);
    setNewColors();
    setCountdown(3);
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
        console.log("Game saved:", data);
        setShowSaveModal(false);
        fetchBestTimes();
      })
      .catch((error) => console.error("Error saving game:", error));
  }

  useEffect(() => {
    let interval: number;
    if (status === "playing" && countdown === 0) {
      interval = setInterval(() => {
        setTime((time) => time + 10);
      }, 10);
    } else if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((countdown) => countdown - 1);
      }, 1000); // Disminuye el contador cada 1 segundo
    } else if (status === "finished") {
      fetchBestTimes(); // Carga la tabla solo cuando se finaliza por primera vez
    }
    return () => {
      clearInterval(interval);
    };
  }, [status, countdown]);

  function fetchBestTimes() {
    setLoadingBestTimes(true);  // Inicia el loader
    fetch(`${apiUrl}/best-times`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los mejores tiempos");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setBestTimes(data); // Actualiza los mejores tiempos
      })
      .catch((error) => {
        console.error("Error fetching best times:", error);
      })
      .finally(() => {
        setLoadingBestTimes(false);  // Detiene el loader
      });
  }



  const formatTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}`;
  };

  return (
    <main>
      <header style={{
        backgroundColor: "#242424",
        color: "#fff",
        padding: "1em",
        textAlign: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <h1>{score} puntos</h1>
        <h1>{formatTime(time)} s</h1>
      </header>

      {status === "playing" && countdown > 0 && (
        <section style={{ backgroundColor: "#242424", padding: "2em", textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "2em" }}>{countdown}</h2>
        </section>
      )}

      {status === "playing" && countdown === 0 && (
        <section style={{ backgroundColor: incorrectColor.color, padding: "2em", textAlign: "center" }}>
          <span style={{ textTransform: "capitalize", color: correctColor.color }}>
            {correctColor.name}
          </span>
        </section>
      )}

      {status === "playing" && countdown === 0 && (
        <div className="color-buttons-container">
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
        <div className="finished-overlay">
          <h2>¡Juego terminado!</h2>
          <p>Tu tiempo: {formatTime(time)}</p>
          <p>Errores cometidos: {errors}</p>

          <button onClick={() => setShowSaveModal(true)}>Guardar 💾</button>
          <button onClick={handlePlay}>Volver a jugar! 🔁</button>

          <div style={{ marginTop: "2em" }}>
            <h3>Mejores Tiempos 🏆</h3>
            {loadingBestTimes ? (
              <p>Cargando...</p>
            ) : (
              <table className="best-times-table">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Nombre</th>
                    <th>⏱️</th>
                    <th>❌</th>
                  </tr>
                </thead>
                <tbody>
                  {bestTimes.map((bestTime, index) => {
                    const timeInSeconds = parseFloat(bestTime.time) / 1000;
                    const formattedTime = timeInSeconds.toFixed(1);

                    return (
                      <tr key={index}>
                        <td>
                          {getMedal(index)} {index <= 2 ? '' : index + 1}
                        </td>
                        <td>{bestTime._id}</td>
                        <td className="no-wrap">
                          {formattedTime}<span style={{ fontSize: "1em" }}>s</span>
                        </td>
                        <td>{bestTime.errors}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
            width: "50%",
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