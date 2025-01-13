let credits = 0;

function insertCoin() {
    credits++;
    document.getElementById('creditDisplay').textContent = `Créditos: ${credits}`;
    const comenzarJuegoBtn = document.getElementById('comenzarJuego');
    if (credits > 0) {
        comenzarJuegoBtn.classList.remove('hidden');
    }
}

function comenzarJuego() {
    if (credits > 0) {
        alert("¡Iniciando el juego!");
        // Aquí podrías redirigir a otra página o comenzar el juego
    } else {
        alert("Inserta una moneda para jugar.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.coin-slot').addEventListener('click', insertCoin);
    document.getElementById('comenzarJuego').addEventListener('click', comenzarJuego);
});
