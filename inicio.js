const barajaEspanola = [
    "1 de Espada", "2 de Espada", "3 de Espada", "4 de Espada", "5 de Espada", "6 de Espada", "7 de Espada", "10 de Espada", "11 de Espada", "12 de Espada",
    "1 de Basto", "2 de Basto", "3 de Basto", "4 de Basto", "5 de Basto", "6 de Basto", "7 de Basto", "10 de Basto", "11 de Basto", "12 de Basto",
    "1 de Oro", "2 de Oro", "3 de Oro", "4 de Oro", "5 de Oro", "6 de Oro", "7 de Oro", "10 de Oro", "11 de Oro", "12 de Oro",
    "1 de Copa", "2 de Copa", "3 de Copa", "4 de Copa", "5 de Copa", "6 de Copa", "7 de Copa", "10 de Copa", "11 de Copa", "12 de Copa"
];

let credits = 0;
let gameStarted = false;

function insertCoin() {
    credits++;
    document.getElementById('creditDisplay').textContent = `Créditos: ${credits}`;

    const comenzarJuegoBtn = document.getElementById('comenzarJuego');
    if (credits > 0 && comenzarJuegoBtn) {
        comenzarJuegoBtn.classList.remove('hidden');
    }
}

function comenzarJuego() {
    if (credits > 0) {
        gameStarted = true;
        document.getElementById('pantallaInicio').classList.add('hidden');
        document.getElementById('gameBoard').classList.remove('hidden');
        crearCartasTablero();
    } else {
        alert("Inserta una moneda para jugar.");
    }
}

function crearCartasTablero() {
    const tablero = document.getElementById('gameBoard');
    const cartasUsuario = barajaEspanola.slice(0, 3);
    const cartasCPU = barajaEspanola.slice(3, 6);

    const manoUsuario = document.createElement('div');
    manoUsuario.className = 'mano';
    manoUsuario.id = 'manoUsuario';
    tablero.appendChild(manoUsuario);

    cartasUsuario.forEach(cartaTexto => {
        const carta = document.createElement('div');
        carta.className = 'carta';
        carta.textContent = cartaTexto;
        manoUsuario.appendChild(carta);
    });

    const manoCPU = document.createElement('div');
    manoCPU.className = 'mano';
    manoCPU.id = 'manoCPU';
    tablero.appendChild(manoCPU);

    cartasCPU.forEach(() =>
