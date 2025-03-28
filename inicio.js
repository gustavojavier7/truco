let credits = 0;
const creditDisplay = document.getElementById('creditDisplay');
const comenzarJuegoBtn = document.getElementById('comenzarJuego');

/**
 * Aumenta los créditos y muestra el botón "Iniciar Juego" si hay al menos uno.
 */
function insertCoin() {
    credits += 1; // Asegura que solo aumente en 1
    creditDisplay.textContent = `Créditos: ${credits}`;
}

/**
 * Maneja el clic en "Iniciar Juego".
 * Verifica si hay créditos antes de redirigir.
 */
function iniciarJuego() {
    if (credits > 0) {
        credits -= 1; // Resta un crédito al iniciar el juego
        creditDisplay.textContent = `Créditos: ${credits}`;
        window.location.href = "index2.html";
    } else {
        alert("Error: Inserta al menos una moneda para iniciar el juego.");
    }
    // Si se quedan sin créditos, podrías ocultar el botón de nuevo
    if (credits === 0) {
        comenzarJuegoBtn.classList.add('hidden');
    }
}
// Asegura que los eventos se vinculen una sola vez
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.coin-slot').addEventListener('click', insertCoin);
    comenzarJuegoBtn.addEventListener('click', iniciarJuego);
});
