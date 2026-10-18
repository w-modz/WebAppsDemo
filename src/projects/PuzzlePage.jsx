import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import html2canvas from "html2canvas";
import "leaflet/dist/leaflet.css";

const puzzleSizes = [2, 3, 4];

function shuffledPieces(size) {
  const pieces = Array.from({ length: size * size }, (_, id) => id);
  for (let index = pieces.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [pieces[index], pieces[otherIndex]] = [pieces[otherIndex], pieces[index]];
  }
  return pieces;
}

export default function PuzzlePage() {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const [size, setSize] = useState(2);
  const [mapVisible, setMapVisible] = useState(true);
  const [coordinates, setCoordinates] = useState("Click “My location” to get coordinates.");
  const [image, setImage] = useState("");
  const [pieces, setPieces] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const map = L.map(mapElement.current).setView([52.237049, 21.017532], 13);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles © Esri",
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapVisible) mapInstance.current?.invalidateSize();
  }, [mapVisible]);

  useEffect(() => {
    if (pieces.length === 0 || !slots.every((piece, index) => piece === index)) return undefined;
    const timeoutId = window.setTimeout(() => window.alert("Congratulations! You completed the puzzle!"), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pieces.length, slots]);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const lat = coords.latitude;
      const lon = coords.longitude;
      setCoordinates(`Lat: ${lat.toFixed(6)}, Long: ${lon.toFixed(6)}`);
      mapInstance.current?.setView([lat, lon], 13);
      L.marker([lat, lon]).addTo(mapInstance.current).bindPopup("Your location");
    }, () => setError("Could not get your location. Check your browser permissions."));
  }

  async function createPuzzle() {
    setError("");
    setCapturing(true);
    let timeoutId;
    try {
      const canvas = await Promise.race([
        html2canvas(mapElement.current, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          imageTimeout: 10000,
          ignoreElements: (element) => element.classList.contains("leaflet-control-container"),
        }),
        new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error("Map capture timed out.")), 15000);
        }),
      ]);
      const image = canvas.toDataURL("image/png");
      setPieces(shuffledPieces(size));
      setSlots(Array(size * size).fill(null));
      setImage(image);
      setMapVisible(false);
    } catch (captureError) {
      console.error("Could not capture the map for the puzzle.", captureError);
      setError("Could not capture the map image. Please try again after the map tiles load.");
    } finally {
      window.clearTimeout(timeoutId);
      setCapturing(false);
    }
  }

  function changeSize(value) {
    const nextSize = Number(value);
    setSize(nextSize);
    setPieces([]);
    setSlots([]);
    setImage("");
  }

  function movePiece(pieceId, targetSlot) {
    setSlots((currentSlots) => {
      const nextSlots = [...currentSlots];
      const sourceSlot = nextSlots.indexOf(pieceId);
      const displacedPiece = nextSlots[targetSlot];
      nextSlots[targetSlot] = pieceId;
      if (sourceSlot >= 0) nextSlots[sourceSlot] = displacedPiece ?? null;
      return nextSlots;
    });
  }

  const placed = new Set(slots.filter((piece) => piece !== null));
  const pool = pieces.filter((piece) => !placed.has(piece));

  return (
    <main className="project-page puzzle-page">
      <section className="puzzle-app">
        <header className="puzzle-header">
          <p className="eyebrow">Project C · Interactive map</p>
          <h1>Map Puzzle</h1>
          <p>Choose a location, capture the map, and put the pieces back in order.</p>
        </header>
        <div className="puzzle-controls">
          <button type="button" onClick={useMyLocation}>My location</button>
          <button type="button" onClick={createPuzzle} disabled={capturing}>{capturing ? "Capturing map…" : "Create puzzle"}</button>
          <button type="button" className="button-muted" onClick={() => setMapVisible((visible) => !visible)}>
            {mapVisible ? "Hide map" : "Show map"}
          </button>
          <label>
            <span className="sr-only">Puzzle size</span>
            <select value={size} onChange={(event) => changeSize(event.target.value)}>
              {puzzleSizes.map((value) => <option key={value} value={value}>{value} × {value}</option>)}
            </select>
          </label>
          <span className="coordinates">{coordinates}</span>
        </div>
        {error && <p className="app-error" role="alert">{error}</p>}
        <div className={`map-frame${mapVisible ? "" : " map-frame-hidden"}`}>
          <div className="map-canvas" ref={mapElement} />
        </div>
        {pieces.length > 0 && (
          <div className="puzzle-game" style={{ "--puzzle-size": size }}>
            <div className="puzzle-board" aria-label="Puzzle board">
              {slots.map((piece, index) => (
                <div className="puzzle-slot" key={index} onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); movePiece(Number(event.dataTransfer.getData("text/plain")), index); }}>
                  {piece !== null && <div className="puzzle-piece" draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", String(piece))}
                    style={{ backgroundImage: `url(${image})`, backgroundSize: `${size * 100}% ${size * 100}%`, backgroundPosition: `${size === 1 ? 0 : (piece % size) * 100 / (size - 1)}% ${size === 1 ? 0 : Math.floor(piece / size) * 100 / (size - 1)}%` }}
                    aria-label={`Puzzle piece ${piece + 1}`} />}
                </div>
              ))}
            </div>
            <div className="puzzle-pool" aria-label="Unplaced puzzle pieces" onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const pieceId = Number(event.dataTransfer.getData("text/plain"));
                setSlots((current) => current.map((piece) => piece === pieceId ? null : piece));
              }}>
              {pool.map((piece) => (
                <div className="puzzle-piece" key={piece} draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", String(piece))}
                  style={{ backgroundImage: `url(${image})`, backgroundSize: `${size * 100}% ${size * 100}%`, backgroundPosition: `${(piece % size) * 100 / (size - 1)}% ${Math.floor(piece / size) * 100 / (size - 1)}%` }}
                  aria-label={`Puzzle piece ${piece + 1}`} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
