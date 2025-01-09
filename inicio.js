const barajaEspanola = [
    "1 de Espada", "2 de Espada", "3 de Espada", "4 de Espada", "5 de Espada", "6 de Espada", "7 de Espada", "10 de Espada", "11 de Espada", "12 de Espada",
    "1 de Basto", "2 de Basto", "3 de Basto", "4 de Basto", "5 de Basto", "6 de Basto", "7 de Basto", "10 de Basto", "11 de Basto", "12 de Basto",
    "1 de Oro", "2 de Oro", "3 de Oro", "4 de Oro", "5 de Oro", "6 de Oro", "7 de Oro", "10 de Oro", "11 de Oro", "12 de Oro",
    "1 de Copa", "2 de Copa", "3 de Copa", "4 de Copa", "5 de Copa", "6 de Copa", "7 de Copa", "10 de Copa", "11 de Copa", "12 de Copa"
];

let credits = 0;

/**
 * Función para manejar la inserción de monedas
 * Incrementa créditos y actualiza el contador en pantalla.
 */
function insertCoin() {
    credits++;
    document.getElementById('creditDisplay').textContent = `Créditos: ${credits}`;

    const comenzarJuegoBtn = document.getElementById('comenzarJuego');
    if (credits > 0 && comenzarJuegoBtn) {
        comenzarJuegoBtn.classList.remove('hidden'); // Muestra el botón "Comenzar Juego"
    }
}

/**
 * Función para redirigir a la pantalla del juego.
 * Se asegura de que haya créditos antes de redirigir.
 */
function comenzarJuego() {
    if (credits > 0) {
        window.location.href = "index.html"; // Redirige al archivo index.html
    } else {
        alert("Inserta una moneda para jugar."); // Muestra un mensaje si no hay créditos
    }
}

/**
 * Llama las funciones necesarias al cargar la pantalla inicial
 */
function setupEventListeners() {
    const coinSlot = document.querySelector('.coin-slot');
    if (coinSlot) {
        coinSlot.addEventListener('click', insertCoin); // Vincula el clic en "Insertar Moneda"
    }

    const comenzarJuegoBtn = document.getElementById('comenzarJuego');
    if (comenzarJuegoBtn) {
        comenzarJuegoBtn.addEventListener('click', comenzarJuego); // Vincula el clic en "Comenzar Juego"
    }
}

// Configura los eventos al cargar el documento
window.onload = setupEventListeners;
