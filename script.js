// Versión 3.8.9

// Estado inicial del juego
let credits = 0;
let currentPlayer = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Función para crear una carta
function crearCarta(palo, valor) {
    return {
        palo: palo, // Espadas, Bastos, Copas, Oros
        valor: valor, // 1-12 (1: As, 10: Sota, 11: Caballo, 12: Rey)
        obtenerNombre: function() {
            const nombres = {
                1: 'As',
                10: 'Sota',
                11: 'Caballo',
                12: 'Rey'
            };
            return nombres[this.valor] || this.valor.toString();
        },
        obtenerValorTruco: function() {
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

// Función auxiliar para calcular puntos por palo
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

// Función para resolver Envido
function resolverEnvido(juego) {
    const valorEnvidoJugador = calcularEnvido(juego.jugador.mano);
    const valorEnvidoCPU = calcularEnvido(juego.cpu.mano);

    mostrarMensaje(`Envido Jugador: ${valorEnvidoJugador}`);
    mostrarMensaje(`Envido CPU: ${valorEnvidoCPU}`);

    if (valorEnvidoJugador > valorEnvidoCPU) {
        mostrarMensaje('El jugador gana el Envido.');
        juego.jugador.sumarPuntos(juego.ultimaApuestaEnvido);
    } else if (valorEnvidoJugador < valorEnvidoCPU) {
        mostrarMensaje('La CPU gana el Envido.');
        juego.cpu.sumarPuntos(juego.ultimaApuestaEnvido);
    } else {
        mostrarMensaje('Empate en el Envido. Gana el jugador más cercano al mano.');
        juego.mano === 'jugador' ? juego.jugador.sumarPuntos(juego.ultimaApuestaEnvido) : juego.cpu.sumarPuntos(juego.ultimaApuestaEnvido);
    }

    juego.actualizarCreditos();
    juego.estadoDelJuego.envidoActivo = false;
    juego.estadoDelJuego.envidoResuelto = true;
}

// Función para resolver Truco
function resolverTruco(juego) {
    const tricksJugador = juego.jugador.tricksGanados;
    const tricksCPU = juego.cpu.tricksGanados;

    if (tricksJugador > tricksCPU) {
        mostrarMensaje('El jugador gana el Truco.');
        juego.jugador.sumarPuntos(juego.trucoApostado);
    } else if (tricksJugador < tricksCPU) {
        mostrarMensaje('La CPU gana el Truco.');
        juego.cpu.sumarPuntos(juego.trucoApostado);
    } else {
        mostrarMensaje('Empate en el Truco. Gana el jugador que tiene el "liderRonda".');
        juego.liderRonda === 'jugador' ? juego.jugador.sumarPuntos(juego.trucoApostado) : juego.cpu.sumarPuntos(juego.trucoApostado);
    }

    juego.actualizarCreditos();
    juego.estadoDelJuego.trucoActivo = false;
    juego.estadoDelJuego.trucoResuelto = true;
}

// Función para resolver Flor
function resolverFlor(juego) {
    const valorFlorJugador = calcularValorFlor(juego.jugador);
    const valorFlorCPU = calcularValorFlor(juego.cpu);

    if (valorFlorJugador > valorFlorCPU) {
        juego.jugador.sumarPuntos(3);
        mostrarMensaje('Jugador gana la Flor.');
    } else {
        juego.cpu.sumarPuntos(3);
        mostrarMensaje('CPU gana la Flor.');
    }

    juego.estadoDelJuego.florActivo = false;
    juego.estadoDelJuego.florResuelto = true;
}

// Función para manejar apuestas simultáneas
function manejarApuestas(juego) {
    if (juego.estadoDelJuego.envidoActivo) {
        resolverEnvido(juego);
    }
    if (juego.estadoDelJuego.trucoActivo) {
        resolverTruco(juego);
    }
    if (juego.estadoDelJuego.florActivo) {
        resolverFlor(juego);
    }
}

// Función para jugar Truco
function jugarTruco(juego, jugador) {
    if (juego.estadoDelJuego.trucoResuelto || juego.estadoDelJuego.trucoActivo || juego.estadoDelJuego.florActivo || juego.estadoDelJuego.envidoActivo) {
        mostrarMensaje('No puedes apostar Truco en este momento.');
        return;
    }

    mostrarMensaje(`${jugador} juega TRUCO`);
    juego.estadoDelJuego.trucoActivo = true;
    juego.cambiarTurno();
}

// Función para jugar Envido
// ... (resto del código es igual hasta la función jugarEnvido) ...

// Función para jugar Envido
function jugarEnvido(juego, jugador) {
    if (juego.estadoDelJuego.trucoActivo || juego.estadoDelJuego.florActivo || juego.estadoDelJuego.envidoResuelto) {
        mostrarMensaje('No puedes apostar Envido en este momento.');
        return;
    }

    mostrarMensaje(`${jugador} juega ENVIDO`);
    juego.estadoDelJuego.envidoActivo = true;
    juego.ultimaApuestaEnvido = 2;

    if (jugador === 'jugador') {
        // Lógica cuando el JUGADOR canta Envido
        const respuestaCPU = juego.cpu.decidirApostarEnvido(); // <---- CPU decide si quiere o no el envido del jugador
        if (respuestaCPU === 'Quiero') {
            mostrarMensaje('CPU QUIERE el Envido.');
            const deseaAumentarCPU = juego.cpu.decidirAumentarEnvido(); // <---- Nueva función para decidir si la CPU sube el envido
            if (deseaAumentarCPU === 'Quiero') {
                juego.ultimaApuestaEnvido += 2;
                mostrarMensaje(`CPU aumenta el Envido a ${juego.ultimaApuestaEnvido}`);
            }
        } else {
            mostrarMensaje('CPU NO QUIERE el Envido.');
            mostrarMensaje('Jugador gana el Envido (por rechazo).');
            juego.jugador.sumarPuntos(juego.ultimaApuestaEnvido); // Jugador gana los puntos iniciales del Envido
            juego.actualizarCreditos();
            juego.estadoDelJuego.envidoActivo = false;
            juego.estadoDelJuego.envidoResuelto = true;
            return; // Salir de la función jugarEnvido, ya que el Envido se resolvió por rechazo
        }


    } else { // jugador === 'cpu' (Lógica cuando la CPU canta Envido - Sin cambios aquí en principio)
        const respuestaCPU = juego.cpu.decidirApostarEnvido();
        if (respuestaCPU === 'Quiero') {
            juego.ultimaApuestaEnvido += 2;
            mostrarMensaje(`CPU aumenta la apuesta a ${juego.ultimaApuestaEnvido}`);
        }
    }

    resolverEnvido(juego); // Resuelve el Envido (si no se rechazó antes)
}


cpu: {
    nombre: 'CPU',
    mano: [], // <-- Corregido
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta: function(carta) {
        this.mano.push(carta);
    },
    mostrarMano: function() {
        return this.mano;
    },
    obtenerPuntos: function() {
        return this.puntos;
    },
    sumarPuntos: function(puntos) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor: function() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {});
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    },
    decidirApostarEnvido: function() { // <---- MODIFICADA para decidir "Quiero" o "No Quiero" al responder al jugador
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 27) { // Umbral más alto para "Querer" con seguridad
            return 'Quiero';
        } else if (valorEnvido >= 22 && Math.random() < 0.7) { // Rango moderado con mayor probabilidad de "Querer"
            return 'Quiero';
        } else if (valorEnvido >= 18 && Math.random() < 0.3) { // Rango bajo con baja probabilidad de "Querer"
            return 'Quiero';
        }
        return 'No Quiero'; // "No Quiero" si el valor es bajo o la probabilidad no favorece
    },
    decidirAumentarEnvido: function() { // <---- NUEVA FUNCION: CPU decide si AUMENTAR el Envido (adicional a "Querer" inicial)
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 29) { // Umbral muy alto para AUMENTAR
            return 'Quiero'; // "Quiero" aquí significa "Quiero Aumentar"
        } else if (valorEnvido >= 25 && Math.random() < 0.6) { // Rango alto con probabilidad de AUMENTAR
            return 'Quiero'; // "Quiero" aquí significa "Quiero Aumentar"
        }
        return 'No Quiero'; // "No Quiero" aquí significa "No Quiero Aumentar", solo "Quiero" la apuesta base
    },
    decidirApostarTruco: function() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco';
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null;
        }
        return null;
    },
    decidirApostarFlor: function(valorFlor) {
        return 'Quiero';
    },
    jugarTurno: function(juego) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.decidirAnunciarFlor()) {
                    juego.anunciarFlor('cpu');
                } else {
                    const apuestaEnvido = this.decidirApostarEnvido(); // <---- Ahora 'decidirApostarEnvido' puede retornar 'No Quiero'
                    if (apuestaEnvido === 'Quiero') {
                        juego.jugarEnvido('cpu');
                    } else if (apuestaEnvido === 'No Quiero') {
                        // En este caso, si la CPU "No Quiere" cantar *ella misma* Envido, simplemente juega una carta.
                        const carta = this.elegirCartaImperativa();
                        this.ultimaCartaJugada = carta;
                        mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                        resolve(carta);
                    } else { // Antes, si no era 'Quiero' se iba directo al truco. Ahora, si no "Quiere" Envido, sigue con Truco o Carta
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
            }, 1000); // Simula un retraso para la decisión de la CPU
        });
    },
    elegirCartaImperativa: function() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
},
// Función para jugar Flor
function jugarFlor(juego, jugador) {
    if (juego.estadoDelJuego.trucoActivo || juego.estadoDelJuego.envidoActivo || juego.estadoDelJuego.florResuelto) {
        mostrarMensaje('No puedes apostar Flor en este momento.');
        return;
    }

    mostrarMensaje(`${jugador} juega FLOR`);
    juego.estadoDelJuego.florActivo = true;
    resolverFlor(juego);
}

// Función para retirarse
function retirarse(juego, jugador) {
    mostrarMensaje(`${jugador} se retira del juego`);
    if (jugador === 'jugador') {
        juego.cpu.sumarPuntos(juego.jugador.obtenerPuntos());
        mostrarMensaje('CPU gana el juego');
    } else {
        juego.jugador.sumarPuntos(juego.cpu.obtenerPuntos());
        mostrarMensaje('Jugador gana el juego');
    }
    juego.actualizarCreditos();
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

// Función para actualizar los créditos del jugador
function actualizarCreditos(jugador) {
    document.getElementById('creditDisplay').textContent = `CRÉDITOS: ${jugador.obtenerPuntos()}`;
}

// Función para procesar una carta jugada
function procesarCartaJugada(juego, carta, jugador) {
    const cartaOponente = jugador === 'jugador' ? juego.cpu.ultimaCartaJugada : juego.jugador.ultimaCartaJugada;
    const valorJugador = carta.obtenerValorTruco();
    const valorOponente = cartaOponente.obtenerValorTruco();

    if (valorJugador === valorOponente) {
        mostrarMensaje('¡Parda! Empate en esta ronda.');
        juego.liderRonda = juego.liderRonda || juego.mano;
    } else if (valorJugador > valorOponente) {
        mostrarMensaje(`${jugador === 'jugador' ? 'Jugador' : 'CPU'} gana la ronda`);
        juego.liderRonda = jugador;
    } else {
        mostrarMensaje(`${jugador === 'jugador' ? 'CPU' : 'Jugador'} gana la ronda`);
        juego.liderRonda = jugador === 'jugador' ? 'cpu' : 'jugador';
    }

    juego.liderRonda === 'jugador' ? juego.jugador.sumarPuntos(juego.trucoApostado) : juego.cpu.sumarPuntos(juego.trucoApostado);
    juego.actualizarCreditos();
    juego.cambiarTurno();
}

// Inicialización del juego
const mazo = crearMazo();
const jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta: function(carta) {
        this.mano.push(carta);
    },
    mostrarMano: function() {
        return this.mano;
    },
    obtenerPuntos: function() {
        return this.puntos;
    },
    sumarPuntos: function(puntos) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor: function() {
        return true;
    },
    decidirApostarFlor: function(valorFlor) {
        return 'Quiero';
    },
    elegirCarta: function() {
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
    jugarTurno: function(juego) {
        manejarJuegoJugador(juego);
    },
    elegirCartaImperativa: function() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
};

const cpu = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: null,
    recibirCarta: function(carta) {
        this.mano.push(carta);
    },
    mostrarMano: function() {
        return this.mano;
    },
    obtenerPuntos: function() {
        return this.puntos;
    },
    sumarPuntos: function(puntos) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor: function() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {});
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    },
    decidirApostarEnvido: function() {
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 25) {
            return 'Quiero';
        } else if (valorEnvido >= 20 && Math.random() < 0.5) {
            return 'Quiero';
        }
        return 'No Quiero';
    },
    decidirApostarTruco: function() {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco';
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null;
        }
        return null;
    },
    decidirApostarFlor: function(valorFlor) {
        return 'Quiero';
    },
    jugarTurno: function(juego) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.decidirAnunciarFlor()) {
                    juego.anunciarFlor('cpu');
                } else {
                    const apuestaEnvido = this.decidirApostarEnvido();
                    if (apuestaEnvido) {
                        juego.jugarEnvido('cpu');
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
            }, 1000); // Simula un retraso para la decisión de la CPU
        });
    },
    elegirCartaImperativa: function() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift();
    }
};

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
    repartirCartas: function() {
        repartirCartas(this.jugador, this.cpu, this.mazo);
    },
    tieneFlor: function(jugador) {
        return tieneFlor(jugador);
    },
    iniciarJuego: function() {
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
    jugarTurnoCPU: function() {
        this.cpu.jugarTurno(this).then(cartaSeleccionada => {
            mostrarMensaje(`CPU juega ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'cpu');
            this.cambiarTurno();
            mostrarOpciones(this);
        });
    },
    jugarTurnoJugador: function() {
        mostrarMensaje('Es tu turno. Elige una carta para jugar.');
        this.jugador.elegirCarta().then(cartaSeleccionada => {
            mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'jugador');
            this.cambiarTurno();
            this.jugarTurnoCPU();
        });
    },
    manejarFlor: function() {
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
    anunciarFlor: function(jugador) {
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
    calcularValorFlor: function(jugador) {
        return calcularPuntosPorPalo(jugador.mostrarMano(), 3);
    },
    mostrarCartas: function() {
        const cpuContainer = document.querySelector('.cpu-cards');
        const playerContainer = document.querySelector('.player-cards');
        cpuContainer.innerHTML = 'CPU';
        playerContainer.innerHTML = 'JUGADOR';
        this.cpu.mostrarMano().forEach(() => {
            const cartaBack = document.createElement('div');
            cartaBack.className = 'carta-back';
            cpuContainer.appendChild(cartaBack);
        });
        this.jugador.mostrarMano().forEach((carta, index) => {
            const cartaElement = document.createElement('div');
            cartaElement.className = `carta ${carta.palo.toLowerCase()}`;
            cartaElement.textContent = `${carta.obtenerNombre()} de ${carta.palo}`;
            cartaElement.dataset.index = index;
            cartaElement.addEventListener('click', () => {
                playerContainer.querySelectorAll('.carta').forEach(c => c.classList.remove('carta-seleccionada'));
                cartaElement.classList.add('carta-seleccionada');
            });
            playerContainer.appendChild(cartaElement);
        });
        this.actualizarCreditos();
    },
    actualizarCreditos: function() {
        document.getElementById('creditDisplay').textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
    },
    mostrarOpciones: function() {
        const opciones = document.querySelector('.game-options');
        opciones.innerHTML = '';
        if (this.turno === 'jugador') {
            if (this.estadoDelJuego.trucoActivo) {
                opciones.innerHTML = `
                    RETIRARSE
                `;
            } else {
                opciones.innerHTML = `
                    TRUCO
                    ENVIDO
                    FLOR
                    RETIRARSE
                `;
            }
        } else {
            this.jugarCPU();
            return;
        }
        document.getElementById('trucoBtn')?.addEventListener('click', () => this.jugarTruco('jugador'));
        document.getElementById('envidoBtn')?.addEventListener('click', () => this.jugarEnvido('jugador'));
        document.getElementById('florBtn')?.addEventListener('click', () => this.jugarFlor('jugador'));
        document.getElementById('retirarseBtn')?.addEventListener('click', () => this.retirarse('jugador'));
    },
    jugarTruco: jugarTruco,
    jugarEnvido: jugarEnvido,
    jugarFlor: jugarFlor,
    retirarse: retirarse,
    mostrarMensaje: mostrarMensaje,
    cambiarTurno: function() {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    },
    jugarCPU: function() {
        this.cpu.jugarTurno(this);
    }
};

// Inicialización del juego
juego.iniciarJuego();
