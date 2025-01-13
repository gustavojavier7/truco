let credits = 0;
const creditDisplay = document.getElementById('creditDisplay');
const comenzarJuegoBtn = document.getElementById('comenzarJuego');

/**
 * Aumenta los créditos y muestra el botón "Iniciar Juego" si hay al menos uno.
 */
function insertCoin() {
    credits++;
    creditDisplay.textContent = `Créditos: ${credits}`;
    if (credits > 0) {
        comenzarJuegoBtn.classList.remove('hidden'); // Muestra el botón
    }
}

/**
 * Redirige a la página de juego "index2.html".
 */
function iniciarJuego() {
    if (credits > 0) {
        window.location.href = "index2.html";
    } else {
        alert("Inserta una moneda para jugar.");
    }
}

// Configura los eventos del DOM
comenzarJuegoBtn.addEventListener('click', iniciarJuego);
