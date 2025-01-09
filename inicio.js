const barajaEspanola = [
    "1 de Espada", "2 de Espada", "3 de Espada", "4 de Espada", "5 de Espada", "6 de Espada", "7 de Espada", "10 de Espada", "11 de Espada", "12 de Espada",
    "1 de Basto", "2 de Basto", "3 de Basto", "4 de Basto", "5 de Basto", "6 de Basto", "7 de Basto", "10 de Basto", "11 de Basto", "12 de Basto",
    "1 de Oro", "2 de Oro", "3 de Oro", "4 de Oro", "5 de Oro", "6 de Oro", "7 de Oro", "10 de Oro", "11 de Oro", "12 de Oro",
    "1 de Copa", "2 de Copa", "3 de Copa", "4 de Copa", "5 de Copa", "6 de Copa", "7 de Copa", "10 de Copa", "11 de Copa", "12 de Copa"
];

let credits = 0;
let cards = [];
let currentCardIndex = 0;

function createCards() {
    const cardContainer = document.getElementById('cardContainer');
    const cartasGrilla = barajaEspanola.slice(0, 24); // Seleccionar solo 24 cartas
    cartasGrilla.forEach(carta => {
        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = carta;
        cards.push(card);
        cardContainer.appendChild(card);
    });
}

function showCards() {
    if (currentCardIndex < cards.length) {
        cards[currentCardIndex].style.opacity = '1';
        currentCardIndex++;
        setTimeout(showCards, 50);
    } else {
        setTimeout(showElements, 500);
    }
}

function showElements() {
    document.querySelector('.coin-slot').style.opacity = '1';
    document.getElementById('creditDisplay').style.opacity = '1';
}

function insertCoin() {
    credits++;
    document.getElementById('creditDisplay').textContent = `Créditos: ${credits}`;
    const comenzarJuegoBtn = document.createElement('button');
    comenzarJuegoBtn.id = 'comenzarJuego';
    comenzarJuegoBtn.textContent = 'Comenzar Juego';
    comenzarJuegoBtn.style.position = 'absolute';
    comenzarJuegoBtn.style.bottom = '10vw';
    comenzarJuegoBtn.style.left = '50%';
    comenzarJuegoBtn.style.transform = 'translateX(-50%)';
    comenzarJuegoBtn.style.padding = '1vw';
    comenzarJuegoBtn.style.fontSize = '1.5vw';
    comenzarJuegoBtn.onclick = () => (window.location.href = 'index.html');
    document.body.appendChild(comenzarJuegoBtn);
}

createCards();
showCards();
