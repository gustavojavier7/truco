// Versión 3.9.9

// Estado inicial del juego
let credits = 0;
let currentPlayer = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Función para crear una carta
function crearCarta(palo, valor) {
    return {
        palo: palo,
        valor: valor,
        obtenerNombre: function () {
            const nombres = {
                1: 'As',
                10: 'Sota',
                11: 'Caballo',
                12: 'Rey'
            };
            return nombres[this.valor] || this.valor.toString();
        },
        obtenerValorTruco: function () {
            const valoresTruco = {
                1: 14, 7: 13, 3: 12, 2: 11,
                12: 10, 11: 9, 10: 8, 6: 7,
                5: 6, 4: 5
            };
            return valoresTruco[this.valor] || 0;
        }
    };
}

// Función para crear un mazo
function crearMazo() {
    const cartas = [];
    const palos = ['Espadas', 'Bastos', 'Copas', 'Oros'];
    palos.forEach(palo => {
        for (let valor = 1; valor <= 7; valor++) {
            cartas.push(crearCarta(palo, valor));
        }
        for (let valor = 10; valor <= 12; valor++) {
            cartas.push(crearCarta(palo, valor));
        }
    });
    barajar(cartas);
    return cartas;
}

// Función para barajar el mazo
function barajar(cartas) {
    for (let i = cartas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}

// Función para repartir cartas
function repartirCartas(jugador, cpu, mazo) {
    if (mazo.length < 6) {
        throw new Error("No hay suficientes cartas en el mazo");
    }
    for (let i = 0; i < 3; i++) {
        jugador.mano.push(mazo.pop());
        cpu.mano.push(mazo.pop());
    }
}

// Función para determinar si un jugador tiene flor
function tieneFlor(jugador) {
    const palos = jugador.mano.map(carta => carta.palo);
    const frecuencia = {};
    palos.forEach(palo => {
        frecuencia[palo] = (frecuencia[palo] || 0) + 1;
    });
    for (let palo in frecuencia) {
        if (frecuencia[palo] === 3) {
            return palo;
        }
    }
    return false;
}

// Función para calcular el valor de la flor
function calcularValorFlor(jugador) {
    return calcularPuntosPorPalo(jugador.mano, 3);
}

// Función para calcular el valor de envido
function calcularEnvido(mano) {
    return calcularPuntosPorPalo(mano);
}

// Función auxiliar para calcular puntos por palo (usada para Envido y Flor)
function calcularPuntosPorPalo(mano, minCartas = 2) {
    const frecuencia = mano.reduce((acc, carta) => {
        acc[carta.palo] = (acc[carta.palo] || 0) + 1;
        return acc;
    }, {});
    for (let palo in frecuencia) {
        if (frecuencia[palo] >= minCartas) {
            const cartasDelPalo = mano.filter(carta => carta.palo === palo);
            return cartasDelPalo.reduce((sum, carta) => sum + carta.valor, 0) + 20;
        }
    }
    return Math.max(...mano.map(carta => carta.valor));
}

// Función para mostrar mensajes en el juego
function mostrarMensaje(mensaje) {
    const gameMessages = document.getElementById('gameMessages');
    if (!gameMessages) return;

    const mensajeElement = document.createElement('div');
    mensajeElement.textContent = mensaje;
    gameMessages.appendChild(mensajeElement);
    gameMessages.scrollTop = gameMessages.scrollHeight;

    if (gameMessages.children.length > 5) {
        gameMessages.removeChild(gameMessages.firstChild);
    }
}

// Crear la CPU
const cpu = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta(carta) {
        this.mano.push(carta);
    },
    mostrarMano() {
        return this.mano;
    },
    obtenerPuntos() {
        return this.puntos;
    },
    sumarPuntos(puntos) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {});
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    },
    decidirApostarEnvido() {
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 27) return 'Quiero';
        if (valorEnvido >= 22 && Math.random() < 0.7) return 'Quiero';
        if (valorEnvido >= 18 && Math.random() < 0.3) return 'Quiero';
        return 'No Quiero';
    },
    decidirApostarTruco() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) return 'Truco';
        if (cartasFuertes.length === 1) return Math.random() < 0.5 ? 'Truco' : null;
        return null;
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    },
    jugarTurno(juego) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (this.decidirAnunciarFlor()) {
                    juego.anunciarFlor('cpu');
                } else {
                    const apuestaEnvido = this.decidirApostarEnvido();
                    if (apuestaEnvido === 'Quiero') {
                        juego.jugarEnvido('cpu');
                    } else {
                        const carta = this.elegirCartaImperativa();
                        this.ultimaCartaJugada = carta;
                        mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                        resolve();
                    }
                }
            }, 1000);
        });
    }
};

// Crear el jugador humano
const jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta(carta) {
        this.mano.push(carta);
    },
    mostrarMano() {
        return this.mano;
    },
    obtenerPuntos() {
        return this.puntos;
    },
    sumarPuntos(puntos) {
        this.puntos += puntos;
    },
    elegirCarta() {
        return new Promise(resolve => {
            const playerContainer = document.querySelector('.player-cards');
            if (!playerContainer) throw new Error("No se encontró el contenedor de cartas del jugador");

            const cartasJugador = playerContainer.querySelectorAll('.carta');
            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none';
                });
            };

            const handleClick = event => {
                const cartaElement = event.currentTarget;
                const index = cartaElement.dataset.index;
                const cartaSeleccionada = this.mano[index];
                this.mano.splice(index, 1);
                this.ultimaCartaJugada = cartaSeleccionada;
                desactivarCartas();
                resolve(cartaSeleccionada);
            };

            cartasJugador.forEach(cartaElement => {
                cartaElement.addEventListener('click', handleClick);
            });
        });
    }
};

// Crear el juego
const juego = {
    jugador: jugador,
    cpu: cpu,
    mazo: crearMazo(),
    turno: Math.random() < 0.5 ? 'jugador' : 'cpu',
    mano: Math.random() < 0.5 ? 'jugador' : 'cpu',
    trucoApostado: 1,
    ultimaApuestaEnvido: 0,
    estadoDelJuego: {
        florActivo: false,
        envidoActivo: false,
        trucoActivo: false,
        florResuelto: false,
        envidoResuelto: false,
        trucoResuelto: false
    },
    florJugador: tieneFlor(jugador),
    florCPU: tieneFlor(cpu),
    repartirCartas() {
        repartirCartas(this.jugador, this.cpu, this.mazo);
    },
    iniciarJuego() {
        this.repartirCartas();
        this.florJugador = tieneFlor(this.jugador);
        this.florCPU = tieneFlor(this.cpu);
        this.mostrarCartas();
        this.actualizarCreditos();

        const manoDisplay = document.getElementById('manoDisplay');
        if (manoDisplay) {
            manoDisplay.textContent = this.mano === 'cpu' ? 'Yo soy mano' : 'Vos sos mano';
            manoDisplay.style.display = 'block';
        }

        mostrarMensaje('¡Comienza el juego!');
        mostrarMensaje(`Turno inicial: ${this.turno === 'jugador' ? 'Jugador' : 'CPU'}`);

        if (this.turno === 'cpu') {
            this.jugarTurnoCPU();
        } else {
            this.jugarTurnoJugador();
        }
    },
    jugarTurnoCPU() {
        this.cpu.jugarTurno(this).then(() => {
            mostrarMensaje(`CPU juega ${this.cpu.ultimaCartaJugada.obtenerNombre()} de ${this.cpu.ultimaCartaJugada.palo}`);
            this.cambiarTurno();
            this.mostrarOpciones();
        });
    },
    jugarTurnoJugador() {
        mostrarMensaje('Es tu turno. Elige una carta para jugar.');
        this.jugador.elegirCarta().then(cartaSeleccionada => {
            mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            this.cambiarTurno();
            this.jugarTurnoCPU();
        });
    },
    mostrarCartas() {
        const cpuContainer = document.querySelector('.cpu-cards');
        const playerContainer = document.querySelector('.player-cards');
        if (!cpuContainer || !playerContainer) return;

        cpuContainer.innerHTML = '<div class="area-label">CPU</div>';
        playerContainer.innerHTML = '<div class="area-label">JUGADOR</div>';

        this.cpu.mostrarMano().forEach(() => {
            const cartaBack = document.createElement('div');
            cartaBack.className = 'carta-back';
            cpuContainer.appendChild(cartaBack);
        });

        this.jugador.mostrarMano().forEach((carta, index) => {
            const cartaElement = document.createElement('div');
            cartaElement.className = `carta ${carta.palo.toLowerCase()}`;
            cartaElement.textContent = `${carta.obtenerNombre()} de ${carta.palo}`;
            cartaElement.dataset.index = index.toString();
            cartaElement.addEventListener('click', () => {
                playerContainer.querySelectorAll('.carta').forEach(c => c.classList.remove('carta-seleccionada'));
                cartaElement.classList.add('carta-seleccionada');
            });
            playerContainer.appendChild(cartaElement);
        });

        this.actualizarCreditos();
    },
    actualizarCreditos() {
        const creditDisplay = document.getElementById('creditDisplay');
        if (creditDisplay) {
            creditDisplay.textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
        }
    },
    mostrarOpciones() {
        const opciones = document.querySelector('.game-options');
        if (!opciones) return;

        if (this.turno === 'jugador') {
            opciones.innerHTML = `
                <div class="option" id="trucoBtn">TRUCO</div>
                <div class="option" id="envidoBtn">ENVIDO</div>
                <div class="option" id="florBtn">FLOR</div>
                <div class="option" id="retirarseBtn">RETIRARSE</div>
            `;
            document.getElementById('trucoBtn')?.addEventListener('click', () => this.jugarTruco('jugador'));
            document.getElementById('envidoBtn')?.addEventListener('click', () => this.jugarEnvido('jugador'));
            document.getElementById('florBtn')?.addEventListener('click', () => this.jugarFlor('jugador'));
            document.getElementById('retirarseBtn')?.addEventListener('click', () => this.retirarse('jugador'));
        } else {
            this.jugarCPU();
        }
    },
    jugarTruco(jugador) {
        if (this.estadoDelJuego.trucoResuelto || this.estadoDelJuego.trucoActivo) {
            mostrarMensaje('No puedes apostar Truco en este momento.');
            return;
        }
        mostrarMensaje(`${jugador} juega TRUCO`);
        this.estadoDelJuego.trucoActivo = true;
        this.cambiarTurno();
    },
    jugarEnvido(jugador) {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.envidoResuelto) {
            mostrarMensaje('No puedes apostar Envido en este momento.');
            return;
        }
        mostrarMensaje(`${jugador} juega ENVIDO`);
        this.estadoDelJuego.envidoActivo = true;
        this.ultimaApuestaEnvido = 2;
    },
    jugarFlor(jugador) {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.envidoActivo) {
            mostrarMensaje('No puedes apostar Flor en este momento.');
            return;
        }
        mostrarMensaje(`${jugador} juega FLOR`);
        this.estadoDelJuego.florActivo = true;
    },
    retirarse(jugador) {
        mostrarMensaje(`${jugador} se retira del juego`);
        if (jugador === 'jugador') {
            this.cpu.sumarPuntos(this.jugador.obtenerPuntos());
            mostrarMensaje('CPU gana el juego');
        } else {
            this.jugador.sumarPuntos(this.cpu.obtenerPuntos());
            mostrarMensaje('Jugador gana el juego');
        }
        this.actualizarCreditos();
    },
    cambiarTurno() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    },
    jugarCPU() {
        this.cpu.jugarTurno(this);
    }
};

// Inicialización del juego
juego.iniciarJuego();
