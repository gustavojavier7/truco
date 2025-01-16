// script.js v1.01

let credits = 0;

// Clase para representar una carta
class Carta {
    constructor(palo, valor) {
        this.palo = palo; // Espadas, Bastos, Copas, Oros
        this.valor = valor; // 1-12 (1: As, 10: Sota, 11: Caballo, 12: Rey)
    }

    obtenerNombre() {
        const nombres = {
            1: 'As',
            10: 'Sota',
            11: 'Caballo',
            12: 'Rey'
        };
        return nombres[this.valor] || this.valor.toString();
    }

    obtenerValorTruco() {
        const valoresTruco = {
            1: 14, // As (Ancho)
            7: 13, // 7
            3: 12, // 3
            2: 11, // 2
            12: 10, // Rey
            11: 9, // Caballo
            10: 8, // Sota
            6: 7,
            5: 6,
            4: 5
        };
        return valoresTruco[this.valor] || 0;
    }
}

// Clase para representar un mazo
class Mazo {
    constructor() {
        this.cartas = [];
        const palos = ['Espadas', 'Bastos', 'Copas', 'Oros'];
        for (let palo of palos) {
            for (let valor = 1; valor <= 12; valor++) {
                this.cartas.push(new Carta(palo, valor));
            }
        }
        this.barajar();
    }

    barajar() {
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    sacarCarta() {
        return this.cartas.pop();
    }
}

// Clase para representar un jugador
class Jugador {
    constructor(nombre) {
        this.nombre = nombre;
        this.mano = [];
        this.puntos = 0;
    }

    recibirCarta(carta) {
        this.mano.push(carta);
    }

    mostrarMano() {
        return this.mano;
    }

    obtenerPuntos() {
        return this.puntos;
    }

    sumarPuntos(puntos) {
        this.puntos += puntos;
    }

    elegirCarta() {
        // Implementación para jugador humano: se manejará mediante eventos
        return null;
    }
}

// Clase para representar la CPU
class CPU extends Jugador {
    elegirCarta() {
        // Implementación básica: elegir la primera carta
        return this.mano.shift();
    }

    decidirApostar(envido) {
        // Lógica básica: apostar si el envido es alto
        return envido >= 25 ? 'Quiero' : 'No quiero';
    }
}

// Clase para representar el juego
class JuegoTruco {
    constructor(jugador, cpu) {
        this.jugador = jugador;
        this.cpu = cpu;
        this.mazo = new Mazo();
        this.repartirCartas();
        this.turno = 'jugador';
        this.trucoApostado = 1;
    }

    repartirCartas() {
        for (let i = 0; i < 3; i++) {
            this.jugador.recibirCarta(this.mazo.sacarCarta());
            this.cpu.recibirCarta(this.mazo.sacarCarta());
        }
    }

    iniciarJuego() {
        // Mostrar cartas del jugador y ocultar las de la CPU
        const playerCardsContainer = document.querySelector('.player-cards');
        playerCardsContainer.innerHTML = '';
        this.jugador.mostrarMano().forEach(carta => {
            const cartaDiv = document.createElement('div');
            cartaDiv.classList.add('carta');
            cartaDiv.style.backgroundColor = this.obtenerColorAleatorio();
            cartaDiv.textContent = carta.obtenerNombre();
            playerCardsContainer.appendChild(cartaDiv);
        });

        const cpuCardsContainer = document.querySelector('.cpu-cards');
        cpuCardsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const cartaDiv = document.createElement('div');
            cartaDiv.classList.add('carta-back');
            cpuCardsContainer.appendChild(cartaDiv);
        }

        // Actualizar créditos (puntos)
        document.getElementById('creditDisplay').textContent = `Créditos: ${this.jugador.obtenerPuntos()}`;
    }

    obtenerColorAleatorio() {
        const colores = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        return colores[Math.floor(Math.random() * colores.length)];
    }

    manejarTurno() {
        // Implementación básica: jugador juega primero
        const cartaJugada = this.jugador.elegirCarta();
        // Aquí podrías manejar la lógica de la jugada del jugador
        // Luego, la CPU juega
        const cartaCPU = this.cpu.elegirCarta();
        // Determinar el ganador del truco
        // Actualizar puntos y verificar si el juego ha terminado
    }
}

// Ejemplo de uso
const jugador = new Jugador('Humano');
const cpu = new CPU('CPU');
const juego = new JuegoTruco(jugador, cpu);
juego.iniciarJuego();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.coin-slot').addEventListener('click', insertCoin);
    document.getElementById('comenzarJuego').addEventListener('click', comenzarJuego);
});
