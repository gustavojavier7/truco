// script.js v1.04

let credits = 0;
let currentPlayer = 'jugador'; // Puede ser 'jugador' o 'cpu'

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
            1: 14, 7: 13, 3: 12, 2: 11,
            12: 10, 11: 9, 10: 8, 6: 7,
            5: 6, 4: 5
        };
        return valoresTruco[this.valor] || 0;
    }
}

// Clase para representar un mazo
// Clase para representar un mazo
class Mazo {
    constructor() {
        this.cartas = [];
        const palos = ['Espadas', 'Bastos', 'Copas', 'Oros'];
        for (let palo of palos) {
            // Ajuste para 40 cartas: valores del 1 al 7 y del 10 al 12
            for (let valor = 1; valor <= 7; valor++) {
                this.cartas.push(new Carta(palo, valor));
            }
            for (let valor = 10; valor <= 12; valor++) {
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
        // Implementación para jugador humano
        return null;
    }
}

// Clase para representar la CPU
class CPU extends Jugador {
   elegirCarta() {
    return this.mano.reduce((mejorCarta, carta) => 
        carta.obtenerValorTruco() > mejorCarta.obtenerValorTruco() ? carta : mejorCarta
    );
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
        // Determina al azar quién será el mano
        this.turno = Math.random() < 0.5 ? 'jugador' : 'cpu';
        this.mano = this.turno === 'jugador' ? 'jugador' : 'cpu'; // El 'mano' es quien empieza
        this.trucoApostado = 1;
        this.repartirCartas();
    }

    repartirCartas() {
        for (let i = 0; i < 3; i++) {
            this.jugador.recibirCarta(this.mazo.sacarCarta());
            this.cpu.recibirCarta(this.mazo.sacarCarta());
        }
    }

    iniciarJuego() {
        this.mostrarCartas();
        this.actualizarCreditos();
        this.mostrarOpciones();
    }

  mostrarCartas() {
    const playerCardsContainer = document.querySelector('.player-cards');
    playerCardsContainer.innerHTML = '';
    this.jugador.mostrarMano().forEach(carta => {
        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('carta');
        // Aquí añades la clase según el palo de la carta
        switch(carta.palo.toLowerCase()) {
            case 'oros':
                cartaDiv.classList.add('oro');
                break;
            case 'copas':
                cartaDiv.classList.add('copa');
                break;
            case 'espadas':
                cartaDiv.classList.add('espada');
                break;
            case 'bastos':
                cartaDiv.classList.add('basto');
                break;
        }
        cartaDiv.textContent = `${carta.obtenerNombre()} (${carta.palo.charAt(0).toUpperCase()})`;

        // Añadir el evento de clic
        cartaDiv.addEventListener('click', function() {
            // Remover la clase de selección de todas las cartas
            document.querySelectorAll('.player-cards .carta').forEach(c => c.classList.remove('carta-seleccionada'));
            // Añadir la clase de selección a la carta clicada
            this.classList.add('carta-seleccionada');
        });

        playerCardsContainer.appendChild(cartaDiv);
    });

    // El resto del código para las cartas del CPU permanece igual
    const cpuCardsContainer = document.querySelector('.cpu-cards');
    cpuCardsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('carta-back');
        cpuCardsContainer.appendChild(cartaDiv);
    }
}
    
    actualizarCreditos() {
        const creditDisplay = document.getElementById('creditDisplay');
        creditDisplay.textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
    }

    mostrarOpciones() {
        const opciones = document.querySelector('.game-options');
        opciones.innerHTML = '';

        if (this.turno === 'jugador') {
            opciones.innerHTML = `
                <div class="option" id="trucoBtn">TRUCO</div>
                <div class="option" id="envidoBtn">ENVIDO</div>
                <div class="option" id="florBtn">FLOR</div>
                <div class="option" id="retirarseBtn">RETIRARSE</div>
            `;
        } else {
            // Lógica para la CPU
            this.jugarCPU();
            return;
        }

        // Añadir event listeners a los nuevos botones
        document.getElementById('trucoBtn')?.addEventListener('click', () => this.jugarTruco('jugador'));
        document.getElementById('envidoBtn')?.addEventListener('click', () => this.jugarEnvido('jugador'));
        document.getElementById('florBtn')?.addEventListener('click', () => this.jugarFlor('jugador'));
        document.getElementById('retirarseBtn')?.addEventListener('click', () => this.retirarse('jugador'));
    }

    jugarTruco(jugador) {
        console.log(`${jugador} juega TRUCO`);
        // Implementar lógica de Truco
        this.cambiarTurno();
    }

    jugarEnvido(jugador) {
        console.log(`${jugador} juega ENVIDO`);
        // Implementar lógica de Envido
        this.cambiarTurno();
    }

    jugarFlor(jugador) {
        console.log(`${jugador} juega FLOR`);
        // Implementar lógica de Flor
        this.cambiarTurno();
    }

    retirarse(jugador) {
        console.log(`${jugador} se retira`);
        // Implementar lógica de retirarse
        this.cambiarTurno();
    }

    cambiarTurno() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
        this.mostrarOpciones();
    }

    jugarCPU() {
        // Implementar lógica para la CPU
        console.log('CPU juega');
        // Simulación de acción de la CPU
        setTimeout(() => {
            this.cambiarTurno();
        }, 1000);
    }

    obtenerColorAleatorio() {
        const colores = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        return colores[Math.floor(Math.random() * colores.length)];
    }
}

// Inicializar el juego
const jugador = new Jugador('Humano');
const cpu = new CPU('CPU');
const juego = new JuegoTruco(jugador, cpu);
juego.iniciarJuego();
