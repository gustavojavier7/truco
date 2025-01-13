let credits = 0;
const creditDisplay = document.getElementById('creditDisplay');
const comenzarJuegoBtn = document.getElementById('comenzarJuego');

/**
 * Aumenta los créditos y muestra el botón "Iniciar Juego" si hay al menos uno.
 */
function insertCoin() {
    credits++;
    document.getElementById('creditDisplay').textContent = `Créditos: ${credits}`;
}

// Nueva función para manejar el clic en "Iniciar Juego"
function iniciarJuego() {
    if (credits > 0) {
        window.location.href = "index2.html"; // Redirige a la nueva página
    } else {
        alert("Error: Inserta al menos una moneda para iniciar el juego."); // Muestra mensaje de error
    }
}

// Vincula eventos a los elementos
document.querySelector('.coin-slot').addEventListener('click', insertCoin);
comenzarJuegoBtn.addEventListener('click', iniciarJuego);
