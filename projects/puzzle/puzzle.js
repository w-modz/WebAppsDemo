class MapPuzzle {
    constructor() {
        this.map = null;
        this.marker = null;
        this.puzzlePieces = [];
        this.gridSize = 2;
        this.correctPositions = 0;
        this.mapVisible = true;

        this.initNotifications();
        this.initMap();
        this.initLocationButton();
        this.initDownloadButton();
        this.initMapToggle();
        this.initPuzzleSizeSelector();
        this.setupDragAndDrop();

        document.getElementById('coordinates').textContent = 'Click "My location to get coordinates"';
    }

    async initNotifications() {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    initMap() {
        this.map = L.map('map').setView([52.237049, 21.017532], 13);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19,
            crossOrigin: true
        }).addTo(this.map);
    }

    initLocationButton() {
        document.getElementById('locationBtn').addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const coords = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;
                        document.getElementById('coordinates').textContent = coords;

                        if (this.marker) {
                            this.marker.setLatLng([latitude, longitude]);
                        } else {
                            this.marker = L.marker([latitude, longitude]).addTo(this.map);
                        }
                        this.map.setView([latitude, longitude], 13);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        alert('Error getting location. Please check your permissions.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser');
            }
        });
    }

    initDownloadButton() {
        document.getElementById('downloadBtn').addEventListener('click', async () => {
            try {
                const canvas = await html2canvas(document.getElementById('map'), {
                    useCORS: true,
                    allowTaint: false,
                    scale: 1,
                    ignoreElements: element => element.classList.contains('leaflet-control-container')
                });
                const boardSize = this.gridSize * 150;
                const board = document.getElementById('puzzleBoard');
                board.style.width = boardSize + 'px';
                board.style.height = boardSize + 'px';
                this.createPuzzle(canvas);
                this.toggleMap(false);
            } catch (error) {
                console.error('Error capturing map:', error);
                alert('Error capturing map image');
            }
        });
    }

    initMapToggle() {
        const toggleBtn = document.getElementById('toggleMapBtn');
        const mapContainer = document.getElementById('mapContainer');

        toggleBtn.addEventListener('click', () => {
            this.mapVisible = !this.mapVisible;
            this.toggleMap(this.mapVisible);
        });

        mapContainer.style.height = mapContainer.offsetHeight + 'px';
    }

    toggleMap(show) {
        const toggleBtn = document.getElementById('toggleMapBtn');
        const mapContainer = document.getElementById('mapContainer');

        if (show) {
            mapContainer.classList.remove('collapsed');
            toggleBtn.textContent = 'Hide map';
        } else {
            mapContainer.classList.add('collapsed');
            toggleBtn.textContent = 'Show map';
        }
        this.mapVisible = show;
    }

    initPuzzleSizeSelector() {
        const sizeSelector = document.getElementById('puzzleSize');
        const board = document.getElementById('puzzleBoard');

        board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;

        sizeSelector.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
            board.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        });
    }

    createPuzzle(canvas) {
        const pieces = this.splitImage(canvas);
        const board = document.getElementById('puzzleBoard');
        const piecesContainer = document.getElementById('puzzlePieces');
        const totalPieces = this.gridSize * this.gridSize;

        board.innerHTML = '';
        piecesContainer.innerHTML = '';
        this.correctPositions = 0;

        board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;

        for (let i = 0; i < totalPieces; i++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.index = i;
            board.appendChild(slot);
        }

        this.puzzlePieces = pieces.map((backgroundPosition, index) => ({
            id: index,
            backgroundPosition
        }));
        this.shuffleArray(this.puzzlePieces);

        const boardSize = 500;
        const pieceWidth = Math.floor(boardSize / this.gridSize);
        const pieceStyle = document.createElement('style');
        pieceStyle.textContent = `
            .puzzle-piece {
                width: ${pieceWidth - 4}px !important;
                height: ${pieceWidth - 4}px !important;
                background-size: ${boardSize}px ${boardSize}px !important;
            }
        `;
        document.head.appendChild(pieceStyle);

        this.puzzlePieces.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'puzzle-piece';
            pieceElement.draggable = true;
            pieceElement.dataset.id = piece.id;
            pieceElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
            pieceElement.style.backgroundPosition = piece.backgroundPosition;
            piecesContainer.appendChild(pieceElement);
        });
    }

    splitImage(canvas) {
        const tempCanvas = document.createElement('canvas');
        const boardSize = 500;
        tempCanvas.width = boardSize;
        tempCanvas.height = boardSize;

        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, boardSize, boardSize);

        const pieceWidth = boardSize / this.gridSize;
        const pieceHeight = boardSize / this.gridSize;
        const positions = [];

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                positions.push(`-${x * pieceWidth}px -${y * pieceHeight}px`);
            }
        }

        canvas.width = boardSize;
        canvas.height = boardSize;
        canvas.getContext('2d').drawImage(tempCanvas, 0, 0);

        return positions;
    }

    setupDragAndDrop() {
        let draggedElement = null;

        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('puzzle-piece')) {
                draggedElement = e.target;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.style.opacity = '0.5';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('puzzle-piece')) {
                e.target.style.opacity = '1';
            }
        });

        document.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('puzzle-slot') || e.target.id === 'puzzlePieces') {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });

        document.addEventListener('drop', (e) => {
            const pieceId = parseInt(e.dataTransfer.getData('text/plain'));

            if (e.target.classList.contains('puzzle-slot')) {
                e.preventDefault();
                const targetPosition = parseInt(e.target.dataset.index);

                if (e.target.children.length > 0) {
                    return;
                }

                const wasInCorrectPosition = draggedElement.parentElement.classList.contains('puzzle-slot') &&
                    parseInt(draggedElement.parentElement.dataset.index) === pieceId;

                e.target.appendChild(draggedElement);

                if (pieceId === targetPosition) {
                    if (!wasInCorrectPosition) {
                        this.correctPositions++;
                    }
                } else {
                    if (wasInCorrectPosition) {
                        this.correctPositions--;
                    }
                }

                if (this.correctPositions === (this.gridSize * this.gridSize)) {
                    setTimeout(() => this.showCompletionNotification(), 100);
                }
            } else if (e.target.id === 'puzzlePieces') {
                e.preventDefault();

                const wasInCorrectPosition = draggedElement.parentElement.classList.contains('puzzle-slot') &&
                    parseInt(draggedElement.parentElement.dataset.index) === pieceId;

                if (wasInCorrectPosition) {
                    this.correctPositions--;
                }

                e.target.appendChild(draggedElement);
            }

            draggedElement = null;
        });
    }

    showCompletionNotification() {
        console.log('Puzzle completed successfully! All pieces are in correct positions.');
        if (Notification.permission === 'granted') {
            new Notification('Congratulations!', {
                body: 'You completed the puzzle!',
                icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Openstreetmap_logo.svg/256px-Openstreetmap_logo.svg.png',
                requireInteraction: false
            });
        } else {
            alert('Congratulations! You completed the puzzle!');
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

window.addEventListener('load', () => {
    new MapPuzzle();
});
