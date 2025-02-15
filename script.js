// Versión 3.9.9

// Estado inicial del juego
let credits = 0;
let currentPlayer: 'jugador' | 'cpu' = 'jugador'; // Puede ser 'jugador' o 'cpu'

// Función para crear una carta
function crearCarta(palo: string, valor: number): Carta {
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

// Tipo para representar una carta
interface Carta {
    palo: string;
    valor: number;
    obtenerNombre(): string;
    obtenerValorTruco(): number;
}

// Función para crear un mazo
function crearMazo(): Carta[] {
    const cartas: Carta[] = [];
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
function barajar(cartas: Carta[]): void {
    for (let i = cartas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }
}

// Función para repartir cartas
function repartirCartas(jugador: Jugador, cpu: Jugador, mazo: Carta[]): void {
    for (let i = 0; i < 3; i++) {
        jugador.mano.push(mazo.pop()!);
        cpu.mano.push(mazo.pop()!);
    }
}

// Tipo para representar un jugador
interface Jugador {
    nombre: string;
    mano: Carta[];
    puntos: number;
    ultimaCartaJugada: Carta | null;
    recibirCarta(carta: Carta): void;
    mostrarMano(): Carta[];
    obtenerPuntos(): number;
    sumarPuntos(puntos: number): void;
    decidirAnunciarFlor(): boolean;
    decidirApostarFlor(valorFlor: number): string;
    elegirCarta(): Promise<Carta>;
    jugarTurno(juego: Juego): void;
    elegirCartaImperativa(): Carta;
}

// Función para determinar si un jugador tiene flor
function tieneFlor(jugador: Jugador): boolean | string {
    const palos = jugador.mano.map(carta => carta.palo);
    const frecuencia: { [key: string]: number } = {};
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
function calcularValorFlor(jugador: Jugador): number {
    return calcularPuntosPorPalo(jugador.mano, 3);
}

// Función para calcular el valor de envido
function calcularEnvido(mano: Carta[]): number {
    return calcularPuntosPorPalo(mano);
}

// Función auxiliar para calcular puntos por palo
function calcularPuntosPorPalo(mano: Carta[], minCartas: number = 2): number {
    const frecuencia: { [key: string]: number } = mano.reduce((acc, carta) => {
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
function resolverEnvido(juego: Juego): void {
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
function resolverTruco(juego: Juego): void {
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
function resolverFlor(juego: Juego): void {
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
function manejarApuestas(juego: Juego): void {
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
function jugarTruco(juego: Juego, jugador: string): void {
    if (juego.estadoDelJuego.trucoResuelto || juego.estadoDelJuego.trucoActivo || juego.estadoDelJuego.florActivo || juego.estadoDelJuego.envidoActivo) {
        mostrarMensaje('No puedes apostar Truco en este momento.');
        return;
    }

    mostrarMensaje(`${jugador} juega TRUCO`);
    juego.estadoDelJuego.trucoActivo = true;
    juego.cambiarTurno();
}

// Función para jugar Envido
function jugarEnvido(juego: Juego, jugador: string): void {
    if (juego.estadoDelJuego.trucoActivo || juego.estadoDelJuego.florActivo || juego.estadoDelJuego.envidoResuelto) {
        mostrarMensaje('No puedes apostar Envido en este momento.');
        return;
    }

    mostrarMensaje(`${jugador} juega ENVIDO`);
    juego.estadoDelJuego.envidoActivo = true;
    juego.ultimaApuestaEnvido = 2;

    if (jugador === 'jugador') {
        const respuestaCPU = juego.cpu.decidirApostarEnvido();
        if (respuestaCPU === 'Quiero') {
            mostrarMensaje('CPU QUIERE el Envido.');
            const deseaAumentarCPU = juego.cpu.decidirAumentarEnvido();
            if (deseaAumentarCPU === 'Quiero') {
                juego.ultimaApuestaEnvido += 2;
                mostrarMensaje(`CPU aumenta el Envido a ${juego.ultimaApuestaEnvido}`);
            }
        } else {
            mostrarMensaje('CPU NO QUIERE el Envido.');
            mostrarMensaje('Jugador gana el Envido (por rechazo).');
            juego.jugador.sumarPuntos(juego.ultimaApuestaEnvido);
            juego.actualizarCreditos();
            juego.estadoDelJuego.envidoActivo = false;
            juego.estadoDelJuego.envidoResuelto = true;
            return;
        }
    } else {
        const respuestaCPU = juego.cpu.decidirApostarEnvido();
        if (respuestaCPU === 'Quiero') {
            juego.ultimaApuestaEnvido += 2;
            mostrarMensaje(`CPU aumenta la apuesta a ${juego.ultimaApuestaEnvido}`);
        }
    }

    resolverEnvido(juego);
}

// Tipo para representar el estado del juego
interface EstadoDelJuego {
    florActivo: boolean;
    envidoActivo: boolean;
    trucoActivo: boolean;
    florResuelto: boolean;
    envidoResuelto: boolean;
    trucoResuelto: boolean;
    retrucoActivo: boolean;
    retrucoResuelto: boolean;
    valeCuatroActivo: boolean;
    valeCuatroResuelto: boolean;
    contraflorActivo: boolean;
    contraflorResuelto: boolean;
    contraflorAlRestoActivo: boolean;
    contraflorAlRestoResuelto: boolean;
    realEnvidoActivo: boolean;
    faltaEnvidoActivo: boolean;
}

// Tipo para representar el juego
interface Juego {
    jugador: Jugador;
    cpu: Jugador;
    mazo: Carta[];
    turno: 'jugador' | 'cpu';
    mano: 'jugador' | 'cpu';
    trucoApostado: number;
    ultimaApuestaEnvido: number;
    estadoDelJuego: EstadoDelJuego;
    florJugador: boolean | string;
    florCPU: boolean | string;
    repartirCartas(): void;
    tieneFlor(jugador: Jugador): boolean | string;
    iniciarJuego(): void;
    jugarTurnoCPU(): void;
    jugarTurnoJugador(): void;
    manejarFlor(): void;
    anunciarFlor(jugador: string): void;
    calcularValorFlor(jugador: Jugador): number;
    mostrarCartas(): void;
    actualizarCreditos(): void;
    mostrarOpciones(): void;
    jugarTruco(jugador: string): void;
    jugarEnvido(jugador: string): void;
    jugarFlor(jugador: string): void;
    retirarse(jugador: string): void;
    mostrarMensaje(mensaje: string): void;
    cambiarTurno(): void;
    jugarCPU(): void;
}

// Crear la CPU
const cpu: Jugador = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: undefined,
    recibirCarta(carta: Carta) {
        this.mano.push(carta);
    },
    mostrarMano() {
        return this.mano;
    },
    obtenerPuntos() {
        return this.puntos;
    },
    sumarPuntos(puntos: number) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor() {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {} as { [key: string]: number });
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
    decidirApostarFlor(valorFlor: number) {
        return 'Quiero';
    },
    jugarTurno(juego: Juego) {
        return new Promise<void>((resolve) => {
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
                        resolve();
                    } else {
                        const apuestaTruco = this.decidirApostarTruco();
                        if (apuestaTruco) {
                            juego.jugarTruco('cpu');
                        } else {
                            const carta = this.elegirCartaImperativa();
                            this.ultimaCartaJugada = carta;
                            mostrarMensaje(`CPU juega ${carta.obtenerNombre()} de ${carta.palo}`);
                            resolve();
                        }
                    }
                }
            }, 1000);
        });
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift()!;
    }
};

// Crear el jugador
const jugador: Jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: undefined,
    recibirCarta(carta: Carta) {
        this.mano.push(carta);
    },
    mostrarMano() {
        return this.mano;
    },
    obtenerPuntos() {
        return this.puntos;
    },
    sumarPuntos(puntos: number) {
        this.puntos += puntos;
    },
    decidirAnunciarFlor() {
        return true;
    },
    decidirApostarFlor(valorFlor: number) {
        return 'Quiero';
    },
    elegirCarta() {
        return new Promise<Carta>((resolve) => {
            const playerContainer = document.querySelector('.player-cards')!;
            const cartasJugador = playerContainer.querySelectorAll('.carta');

            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none';
                });
            };

            const handleClick = (event: Event) => {
                const cartaElement = event.currentTarget as HTMLElement;
                const index = cartaElement.dataset.index!;
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
    jugarTurno(juego: Juego) {
        manejarJuegoJugador(juego);
    },
    elegirCartaImperativa() {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift()!;
    }
};

// Crear el juego
const juego: Juego = {
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
    tieneFlor(jugador: Jugador) {
        return tieneFlor(jugador);
    },
    iniciarJuego() {
        this.repartirCartas();
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
        this.mostrarCartas();
        this.actualizarCreditos();

        const manoDisplay = document.getElementById('manoDisplay')!;
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
        this.cpu.jugarTurno(this).then(() => {
            mostrarMensaje(`CPU juega ${this.cpu.ultimaCartaJugada!.obtenerNombre()} de ${this.cpu.ultimaCartaJugada!.palo}`);
            procesarCartaJugada(this, this.cpu.ultimaCartaJugada!, 'cpu');
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
            document.getElementById('florAnnouncement')!.style.display = 'block';
            document.getElementById('anunciarFlorBtn')!.addEventListener('click', () => {
                this.anunciarFlor('jugador');
                document.getElementById('florAnnouncement')!.style.display = 'none';
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
    anunciarFlor(jugador: string) {
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
    calcularValorFlor(jugador: Jugador) {
        return calcularPuntosPorPalo(jugador.mostrarMano(), 3);
    },
    mostrarCartas() {
        const cpuContainer = document.querySelector('.cpu-cards')!;
        const playerContainer = document.querySelector('.player-cards')!;

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
        document.getElementById('creditDisplay')!.textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
    },
    mostrarOpciones() {
        const opciones = document.querySelector('.game-options')!;
        opciones.innerHTML = '';

        if (this.turno === 'jugador') {
            if (this.estadoDelJuego.trucoActivo) {
                opciones.innerHTML = `
                    <div class="option" id="retirarseBtn">RETIRARSE</div>
                `;
            } else {
                opciones.innerHTML = `
                    <div class="option" id="trucoBtn">TRUCO</div>
                    <div class="option" id="envidoBtn">ENVIDO</div>
                    <div class="option" id="florBtn">FLOR</div>
                    <div class="option" id="retirarseBtn">RETIRARSE</div>
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
    jugarFlor(jugador: string) {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.envidoActivo || this.estadoDelJuego.florResuelto) {
            mostrarMensaje('No puedes apostar Flor en este momento.');
            return;
        }

        mostrarMensaje(`${jugador} juega FLOR`);
        this.estadoDelJuego.florActivo = true;
        resolverFlor(this);
    },
    retirarse(jugador: string) {
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
    mostrarMensaje(mensaje: string) {
        const gameMessages = document.getElementById('gameMessages');
        if (!gameMessages) return;

        const mensajeElement = document.createElement('div');
        mensajeElement.textContent = mensaje;
        gameMessages.appendChild(mensajeElement);
        gameMessages.scrollTop = gameMessages.scrollHeight;

        if (gameMessages.children.length > 5) {
            gameMessages.removeChild(gameMessages.firstChild!);
        }
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
