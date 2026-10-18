const piecesSize = document.getElementById("puzzle-size");
const mapFrame = document.getElementById("map-frame");
const mapElement = document.getElementById("map");
const puzzleGame = document.getElementById("puzzle-game");
const locationButton = document.getElementById("location-button");
const createPuzzleButton = document.getElementById("create-puzzle-button");
const toggleMapButton = document.getElementById("toggle-map-button");
const coordinatesDisplay = document.getElementById("coordinates");
const errorEl = document.getElementById("puzzle-error");

let map;
let size = Number(piecesSize.value);
let pieces = [];
let slots = [];
let image = "";
let mapVisible = true;

function setError(message) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function createMap() {
  map = L.map(mapElement).setView([52.237049, 21.017532], 13);
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
    maxZoom: 19,
    crossOrigin: true,
  }).addTo(map);
}

function shuffledPieces(nextSize) {
  const result = Array.from({ length: nextSize * nextSize }, (_, id) => id);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }
  return result;
}

function renderPuzzle() {
  const placed = new Set(slots.filter((piece) => piece !== null));
  const pool = pieces.filter((piece) => !placed.has(piece));

  const boardMarkup = slots
    .map((piece, index) => {
      const pieceMarkup = piece !== null
        ? `<div class="puzzle-piece" draggable="true" data-piece="${piece}" style="background-image:url('${image}'); background-size:${size * 100}% ${size * 100}%; background-position:${(piece % size) * 100 / (size - 1)}% ${Math.floor(piece / size) * 100 / (size - 1)}%;"></div>`
        : "";
      return `<div class="puzzle-slot" data-slot="${index}" aria-label="Puzzle slot ${index + 1}">${pieceMarkup}</div>`;
    })
    .join("");

  const poolMarkup = pool
    .map((piece) => `
      <div class="puzzle-piece" draggable="true" data-piece="${piece}" style="background-image:url('${image}'); background-size:${size * 100}% ${size * 100}%; background-position:${(piece % size) * 100 / (size - 1)}% ${Math.floor(piece / size) * 100 / (size - 1)}%;"></div>
    `)
    .join("");

  puzzleGame.innerHTML = `
    <div class="puzzle-board" style="--puzzle-size:${size}">${boardMarkup}</div>
    <div class="puzzle-pool" aria-label="Unplaced puzzle pieces">${poolMarkup}</div>
  `;

  puzzleGame.hidden = false;

  puzzleGame.querySelectorAll(".puzzle-piece").forEach((pieceElement) => {
    pieceElement.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", pieceElement.dataset.piece);
    });
  });

  puzzleGame.querySelectorAll(".puzzle-slot").forEach((slotElement) => {
    slotElement.addEventListener("dragover", (event) => event.preventDefault());
    slotElement.addEventListener("drop", (event) => {
      event.preventDefault();
      const pieceId = Number(event.dataTransfer.getData("text/plain"));
      movePiece(pieceId, Number(slotElement.dataset.slot));
    });
  });

  puzzleGame.querySelector(".puzzle-pool").addEventListener("dragover", (event) => event.preventDefault());
  puzzleGame.querySelector(".puzzle-pool").addEventListener("drop", (event) => {
    event.preventDefault();
    const pieceId = Number(event.dataTransfer.getData("text/plain"));
    setSlots((current) => current.map((piece) => (piece === pieceId ? null : piece)));
  });
}

function movePiece(pieceId, targetSlot) {
  setSlots((current) => {
    const next = [...current];
    const sourceSlot = next.indexOf(pieceId);
    const displacedPiece = next[targetSlot];
    next[targetSlot] = pieceId;
    if (sourceSlot >= 0) next[sourceSlot] = displacedPiece ?? null;
    return next;
  });
}

function setSlots(updateFn) {
  slots = typeof updateFn === "function" ? updateFn(slots) : updateFn;
  renderPuzzle();
  if (slots.length && slots.every((piece, index) => piece === index)) {
    window.setTimeout(() => window.alert("Congratulations! You completed the puzzle!"), 0);
  }
}

async function useMyLocation() {
  if (!navigator.geolocation) {
    setError("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const lat = coords.latitude;
    const lon = coords.longitude;
    coordinatesDisplay.textContent = `Lat: ${lat.toFixed(6)}, Long: ${lon.toFixed(6)}`;
    map.setView([lat, lon], 13);
    L.marker([lat, lon]).addTo(map).bindPopup("Your location");
    setError("");
  }, () => {
    setError("Could not get your location. Check your browser permissions.");
  });
}

async function createPuzzle() {
  setError("");
  const captureButton = createPuzzleButton;
  captureButton.disabled = true;
  captureButton.textContent = "Capturing map…";

  try {
    const canvas = await Promise.race([
      html2canvas(mapElement, {
        useCORS: true,
        allowTaint: false,
        scale: 1,
        imageTimeout: 10000,
        ignoreElements: (element) => element.classList.contains("leaflet-control-container"),
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Map capture timed out.")), 15000);
      }),
    ]);

    size = Number(piecesSize.value);
    image = canvas.toDataURL("image/png");
    pieces = shuffledPieces(size);
    slots = Array(size * size).fill(null);
    renderPuzzle();
    mapVisible = false;
    mapFrame.classList.add("map-frame-hidden");
  } catch (captureError) {
    console.error(captureError);
    setError("Could not capture the map image. Please try again after the map tiles load.");
  } finally {
    captureButton.disabled = false;
    captureButton.textContent = "Create puzzle";
  }
}

piecesSize.addEventListener("change", () => {
  size = Number(piecesSize.value);
  pieces = [];
  slots = [];
  image = "";
  puzzleGame.hidden = true;
  puzzleGame.innerHTML = "";
});

locationButton.addEventListener("click", useMyLocation);
createPuzzleButton.addEventListener("click", createPuzzle);
toggleMapButton.addEventListener("click", () => {
  mapVisible = !mapVisible;
  mapFrame.classList.toggle("map-frame-hidden", !mapVisible);
  toggleMapButton.textContent = mapVisible ? "Hide map" : "Show map";
  if (map) map.invalidateSize();
});

createMap();
