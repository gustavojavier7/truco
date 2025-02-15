// Versión 3.8.9
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

// Crear la CPU
const cpu = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: undefined,
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
        if (valorEnvido >= 27) {
            return 'Quiero';
        } else if (valorEnvido >= 22 && Math.random() < 0.7) {
            return 'Quiero';
        } else if (valorEnvido >= 18 && Math.random() < 0.3) {
            return 'Quiero';
        }
        return 'No Quiero';
    },
    decidirAumentarEnvido() {
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 29) {
            return 'Quiero';
        } else if (valorEnvido >= 25 && Math.random() < 0.6) {
            return 'Quiero';
        }
        return 'No Quiero';
    },
    decidirApostarTruco() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco';
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null;
        }
        return null;
    },
    decidirApostarFlor(valorFlor) {
        return 'Quiero';
    },
    jugarTurno(juego) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.decidirAnunciarFlor()) {
                    juego.anunciarFlor('cpu');
                } else {
                    const apuestaEnvido = this.decidirApostarEnvido();
                    if (apuestaEnvido === 'Quiero') {
                        juego.jugarEnvido('cpu');
                    } else if (apuestaEnvido === 'No Quiero') {
                        const carta = this.elegirCartaImperativa();
                        this.ultimaCartaJugada = carta;
                        mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                        resolve(carta);
                    } else {
                        const apuestaTruco = this.decidirApostarTruco();
                        if (apuestaTruco) {
                            juego.jugarTruco('cpu');
                        } else {
                            const carta = this.elegirCartaImperativa();
                            this.ultimaCartaJugada = carta;
                            mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                            resolve(carta);
                        }
                    }
                }
            }, 1000);
        });
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
};

// Crear el jugador
const jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: undefined,
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
        return true;
    },
    decidirApostarFlor(valorFlor) {
        return 'Quiero';
    },
    elegirCarta() {
        return new Promise((resolve) => {
            const playerContainer = document.querySelector('.player-cards');
            const cartasJugador = playerContainer.querySelectorAll('.carta');
            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none';
                });
            };
            const handleClick = (event) => {
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
    },
    jugarTurno(juego) {
        manejarJuegoJugador(juego);
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
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
        trucoResuelto: false,
        retrucoActivo: false,
        retrucoResuelto: false,
        valeCuatroActivo: false,
        valeCuatroResuelto: false,
        contraflorActivo: false,
        contraflorResuelto: false,
        contraflorAlRestoActivo: false,
        contraflorAlRestoResuelto: false,
        realEnvidoActivo: false,
        faltaEnvidoActivo: false,
    },
    florJugador: tieneFlor(jugador),
    florCPU: tieneFlor(cpu),
    repartirCartas() {
        repartirCartas(this.jugador, this.cpu, this.mazo);
    },
    tieneFlor(jugador) {
        return tieneFlor(jugador);
    },
    iniciarJuego() {
        this.repartirCartas();
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
        this.mostrarCartas();
        this.actualizarCreditos();
        const manoDisplay = document.getElementById('manoDisplay');
        manoDisplay.textContent = this.mano === 'cpu' ? 'Yo soy mano' : 'Vos sos mano';
        manoDisplay.style.display = 'block';
        this.mostrarMensaje('¡Comienza el juego!');
        this.mostrarMensaje(`Turno inicial: ${this.turno === 'jugador' ? 'Jugador' : 'CPU'}`);
        if (this.turno === 'cpu') {
            this.jugarTurnoCPU();
        } else {
            this.jugarTurnoJugador();
        }
    },
    jugarTurnoCPU() {
        this.cpu.jugarTurno(this).then(cartaSeleccionada => {
            mostrarMensaje(`CPU juega ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'cpu');
            this.cambiarTurno();
            this.mostrarOpciones();
        });
    },
    jugarTurnoJugador() {
        mostrarMensaje('Es tu turno. Elige una carta para jugar.');
        this.jugador.elegirCarta().then(cartaSeleccionada => {
            mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'jugador');
            this.cambiarTurno();
            this.jugarTurnoCPU();
        });
    },
    manejarFlor() {
        if (this.florJugador) {
            mostrarMensaje('El jugador tiene Flor');
            document.getElementById('florAnnouncement').style.display = 'block';
            document.getElementById('anunciarFlorBtn').addEventListener('click', () => {
                this.anunciarFlor('jugador');
                document.getElementById('florAnnouncement').style.display = 'none';
            });
        } else if (this.florCPU) {
            mostrarMensaje('La CPU tiene Flor');
            const anunciarCPU = this.cpu.decidirAnunciarFlor();
            if (anunciarCPU) {
                this.anunciarFlor('cpu');
            } else {
                this.mostrarOpciones();
            }
        } else {
            this.mostrarOpciones();
        }
    },
    anunciarFlor(jugador) {
        if (jugador === 'jugador') {
            mostrarMensaje('El jugador anuncia Flor');
            const valorFlor = calcularValorFlor(this.jugador);
            mostrarMensaje(`Valor de la Flor del jugador: ${valorFlor}`);
            const respuestaCPU = this.cpu.decidirApostarFlor(valorFlor);
            if (respuestaCPU === 'Quiero') {
                mostrarMensaje('CPU quiere la Flor');
                if (valorFlor > calcularValorFlor(this.cpu)) {
                    this.jugador.sumarPuntos(3);
                    mostrarMensaje('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3);
                    mostrarMensaje('CPU gana la Flor');
                }
            } else {
                mostrarMensaje('CPU no quiere la Flor');
                this.jugador.sumarPuntos(3);
            }
        } else if (jugador === 'cpu') {
            mostrarMensaje('La CPU anuncia Flor');
            const valorFlorCPU = calcularValorFlor(this.cpu);
            mostrarMensaje(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
            const respuestaJugador = this.jugador.decidirApostarFlor(valorFlorCPU);
            if (respuestaJugador === 'Quiero') {
                mostrarMensaje('Jugador quiere la Flor');
                if (valorFlorCPU > calcularValorFlor(this.jugador)) {
                    this.cpu.sumarPuntos(3);
                    mostrarMensaje('CPU gana la Flor');
                } else {
                    this.jugador.sumarPuntos(3);
                    mostrarMensaje('Jugador gana la Flor');
                }
            } else {
                mostrarMensaje('Jugador no quiere la Flor');
                this.cpu.sumarPuntos(3);
            }
        }
    },
    calcularValorFlor(jugador) {
        return calcularPuntosPorPalo(jugador.mostrarMano(), 3);
    },
    mostrarCartas: function() {
    const cpuContainer = document.querySelector('.cpu-cards');
    const playerContainer = document.querySelector('.player-cards');
    cpuContainer.innerHTML = 'CPU';
    playerContainer.innerHTML = 'JUGADOR';

    // Mostrar las cartas de la CPU (con backs)
    this.cpu.mostrarMano().forEach(() => {
        const cartaBack = document.createElement('div');
        cartaBack.className = 'carta-back';
        cpuContainer.appendChild(cartaBack);
    });

    // Mostrar las cartas del jugador (con nombres y valores)
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

    // Actualizar los créditos del jugador
    this.actualizarCreditos();
},
