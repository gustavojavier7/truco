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
        credits--; // Resta un crédito al iniciar el juego
        document.getElementById('creditDisplay').textContent = `Créditos: ${credits}`;
        // Aquí podrías redirigir o iniciar el juego
        if (credits === 0) {
            document.getElementById('comenzarJuego').classList.add('hidden');
        }
    } else {
        alert("Inserta una moneda para jugar.");
    }
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.coin-slot').addEventListener('click', insertCoin);
    document.getElementById('comenzarJuego').addEventListener('click', comenzarJuego);
});
