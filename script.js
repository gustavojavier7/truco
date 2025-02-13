// Versión 3.8.9
// Estado inicial del juego
let credits: number = 0;
let currentPlayer: 'jugador' | 'cpu' = 'jugador';

// Tipo para una carta
interface Carta {
    palo: string;
    valor: number;
    obtenerNombre(): string;
    obtenerValorTruco(): number;
}

// Función para crear una carta
function crearCarta(palo: string, valor: number): Carta {
    return {
        palo: palo,
        valor: valor,
        obtenerNombre: function (): string {
            const nombres: Record<number, string> = {
                1: 'As',
                10: 'Sota',
                11: 'Caballo',
                12: 'Rey'
            };
            return nombres[this.valor] || this.valor.toString();
        },
        obtenerValorTruco: function (): number {
            const valoresTruco: Record<number, number> = {
                1: 14, 7: 13, 3: 12, 2: 11,
                12: 10, 11: 9, 10: 8, 6: 7,
                5: 6, 4: 5
            };
            return valoresTruco[this.valor] || 0;
        }
    };
}

// Función para crear un mazo
function crearMazo(): Carta[] {
    const cartas: Carta[] = [];
    const palos: string[] = ['Espadas', 'Bastos', 'Copas', 'Oros'];
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

// Tipo para un jugador
interface Jugador {
    nombre: string;
    mano: Carta[];
    puntos: number;
    ultimaCartaJugada?: Carta;
    recibirCarta(carta: Carta): void;
    mostrarMano(): Carta[];
    obtenerPuntos(): number;
    sumarPuntos(puntos: number): void;
    decidirAnunciarFlor(): boolean;
    decidirApostarFlor(valorFlor: number): 'Quiero' | 'No Quiero';
    elegirCarta(): Promise<Carta>;
    jugarTurno(juego: Juego): void;
    elegirCartaImperativa(): Carta;
}

// Tipo para la CPU
interface CPU extends Jugador {
    decidirApostarEnvido(): 'Quiero' | 'No Quiero';
    decidirAumentarEnvido(): 'Quiero' | 'No Quiero';
    decidirApostarTruco(): 'Truco' | null;
    decidirApostarFlor(valorFlor: number): 'Quiero';
    jugarTurno(juego: Juego): Promise<Carta>;
}

// Tipo para el juego
interface Juego {
    jugador: Jugador;
    cpu: CPU;
    mazo: Carta[];
    turno: 'jugador' | 'cpu';
    mano: 'jugador' | 'cpu';
    trucoApostado: number;
    ultimaApuestaEnvido: number;
    estadoDelJuego: {
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
    };
    florJugador: boolean | string;
    florCPU: boolean | string;
    repartirCartas(): void;
    tieneFlor(jugador: Jugador): boolean | string;
    iniciarJuego(): void;
    jugarTurnoCPU(): void;
    jugarTurnoJugador(): void;
    manejarFlor(): void;
    anunciarFlor(jugador: 'jugador' | 'cpu'): void;
    calcularValorFlor(jugador: Jugador): number;
    mostrarCartas(): void;
    actualizarCreditos(): void;
    mostrarOpciones(): void;
    jugarTruco(jugador: 'jugador' | 'cpu'): void;
    jugarEnvido(jugador: 'jugador' | 'cpu'): void;
    jugarFlor(jugador: 'jugador' | 'cpu'): void;
    retirarse(jugador: 'jugador' | 'cpu'): void;
    mostrarMensaje(mensaje: string): void;
    cambiarTurno(): void;
    jugarCPU(): void;
}

// Crear la CPU
const cpu: CPU = {
    nombre: 'CPU',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: undefined,
    recibirCarta(carta: Carta): void {
        this.mano.push(carta);
    },
    mostrarMano(): Carta[] {
        return this.mano;
    },
    obtenerPuntos(): number {
        return this.puntos;
    },
    sumarPuntos(puntos: number): void {
        this.puntos += puntos;
    },
    decidirAnunciarFlor(): boolean {
        if (this.mano.length === 3) {
            const paloFlor = this.mano.reduce((mapa, carta) => {
                mapa[carta.palo] = (mapa[carta.palo] || 0) + 1;
                return mapa;
            }, {} as Record<string, number>);
            return Object.values(paloFlor).some(count => count === 3);
        }
        return false;
    },
    decidirApostarEnvido(): 'Quiero' | 'No Quiero' {
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
    decidirAumentarEnvido(): 'Quiero' | 'No Quiero' {
        const valorEnvido = calcularEnvido(this.mano);
        if (valorEnvido >= 29) {
            return 'Quiero';
        } else if (valorEnvido >= 25 && Math.random() < 0.6) {
            return 'Quiero';
        }
        return 'No Quiero';
    },
    decidirApostarTruco(): 'Truco' | null {
        const valoresAltos = [14, 13, 12];
        const cartasFuertes = this.mano.filter(carta => valoresAltos.includes(carta.obtenerValorTruco()));
        if (cartasFuertes.length >= 2) {
            return 'Truco';
        } else if (cartasFuertes.length === 1) {
            return Math.random() < 0.5 ? 'Truco' : null;
        }
        return null;
    },
    decidirApostarFlor(valorFlor: number): 'Quiero' {
        return 'Quiero';
    },
    jugarTurno(juego: Juego): Promise<Carta> {
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
    elegirCartaImperativa(): Carta {
        return this.mano.sort((a, b) => a.obtenerValorTruco() - b.obtenerValorTruco()).shift()!;
    }
};

// Crear el jugador
const jugador: Jugador = {
    nombre: 'Humano',
    mano: [],
    puntos: 0,
    ultimaCartaJugada: undefined,
    recibirCarta(carta: Carta): void {
        this.mano.push(carta);
    },
    mostrarMano(): Carta[] {
        return this.mano;
    },
    obtenerPuntos(): number {
        return this.puntos;
    },
    sumarPuntos(puntos: number): void {
        this.puntos += puntos;
    },
    decidirAnunciarFlor(): boolean {
        return true;
    },
    decidirApostarFlor(valorFlor: number): 'Quiero' {
        return 'Quiero';
    },
    elegirCarta(): Promise<Carta> {
        return new Promise((resolve) => {
            const playerContainer = document.querySelector('.player-cards');
            const cartasJugador = playerContainer.querySelectorAll('.carta');
            const desactivarCartas = () => {
                cartasJugador.forEach(cartaElement => {
                    cartaElement.removeEventListener('click', handleClick);
                    cartaElement.style.pointerEvents = 'none';
                });
            };
            const handleClick = (event: MouseEvent) => {
                const cartaElement = event.currentTarget as HTMLElement;
                const index = cartaElement.dataset.index;
                const cartaSeleccionada = this.mano[parseInt(index!)];
                this.mano.splice(parseInt(index!), 1);
                this.ultimaCartaJugada = cartaSeleccionada;
                desactivarCartas();
                resolve(cartaSeleccionada);
            };
            cartasJugador.forEach(cartaElement => {
                cartaElement.addEventListener('click', handleClick);
            });
        });
    },
    jugarTurno(juego: Juego): void {
        manejarJuegoJugador(juego);
    },
    elegirCartaImperativa(): Carta {
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
    repartirCartas(): void {
        repartirCartas(this.jugador, this.cpu, this.mazo);
    },
    tieneFlor(jugador: Jugador): boolean | string {
        return tieneFlor(jugador);
    },
    iniciarJuego(): void {
        this.repartirCartas();
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
        this.mostrarCartas();
        this.actualizarCreditos();
        const manoDisplay = document.getElementById('manoDisplay');
        manoDisplay!.textContent = this.mano === 'cpu' ? 'Yo soy mano' : 'Vos sos mano';
        manoDisplay!.style.display = 'block';
        this.mostrarMensaje('¡Comienza el juego!');
        this.mostrarMensaje(`Turno inicial: ${this.turno === 'jugador' ? 'Jugador' : 'CPU'}`);
        if (this.turno === 'cpu') {
            this.jugarTurnoCPU();
        } else {
            this.jugarTurnoJugador();
        }
    },
    jugarTurnoCPU(): void {
        this.cpu.jugarTurno(this).then(cartaSeleccionada => {
            mostrarMensaje(`CPU juega ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'cpu');
            this.cambiarTurno();
            this.mostrarOpciones();
        });
    },
    jugarTurnoJugador(): void {
        mostrarMensaje('Es tu turno. Elige una carta para jugar.');
        this.jugador.elegirCarta().then(cartaSeleccionada => {
            mostrarMensaje(`Has jugado: ${cartaSeleccionada.obtenerNombre()} de ${cartaSeleccionada.palo}`);
            procesarCartaJugada(this, cartaSeleccionada, 'jugador');
            this.cambiarTurno();
            this.jugarTurnoCPU();
        });
    },
    manejarFlor(): void {
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
    anunciarFlor(jugador: 'jugador' | 'cpu'): void {
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
    calcularValorFlor(jugador: Jugador): number {
        return calcularPuntosPorPalo(jugador.mostrarMano(), 3);
    },
    mostrarCartas(): void {
        const cpuContainer = document.querySelector('.cpu-cards');
        const playerContainer = document.querySelector('.player-cards');
        cpuContainer!.innerHTML = 'CPU';
        playerContainer!.innerHTML = 'JUGADOR';
        this.cpu.mostrarMano().forEach(() => {
            const cartaBack = document.createElement('div');
            cartaBack.className = 'carta-back';
            cpuContainer!.appendChild(cartaBack);
        });
        this.jugador.mostrarMano().forEach((carta, index) => {
            const cartaElement = document.createElement('div');
            cartaElement.className = `carta ${carta.palo.toLowerCase()}`;
            cartaElement.textContent = `${carta.obtenerNombre()} de ${carta.palo}`;
            cartaElement.dataset.index = index.toString();
            cartaElement.addEventListener('click', () => {
                playerContainer!.querySelectorAll('.carta').forEach(c => c.classList.remove('carta-seleccionada'));
                cartaElement.classList.add('carta-seleccionada');
            });
            playerContainer!.appendChild(cartaElement);
        });
        this.actualizarCreditos();
    },
    actualizarCreditos(): void {
        document.getElementById('creditDisplay')!.textContent = `CRÉDITOS: ${this.jugador.obtenerPuntos()}`;
    },
    mostrarOpciones(): void {
        const opciones = document.querySelector('.game-options');
        opciones!.innerHTML = '';
        if (this.turno === 'jugador') {
            if (this.estadoDelJuego.trucoActivo) {
                opciones!.innerHTML = `
                    RETIRARSE
                `;
            } else {
                opciones!.innerHTML = `
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
        document.getElementById('trucoBtn')!.addEventListener('click', () => this.jugarTruco('jugador'));
        document.getElementById('envidoBtn')!.addEventListener('click', () => this.jugarEnvido('jugador'));
        document.getElementById('florBtn')!.addEventListener('click', () => this.jugarFlor('jugador'));
        document.getElementById('retirarseBtn')!.addEventListener('click', () => this.retirarse('jugador'));
    },
    jugarTruco(jugador: 'jugador' | 'cpu'): void {
        if (this.estadoDelJuego.trucoResuelto || this.estadoDelJuego.trucoActivo || this.estadoDelJuego.florActivo || this.estadoDelJuego.envidoActivo) {
            mostrarMensaje('No puedes apostar Truco en este momento.');
            return;
        }
        mostrarMensaje(`${jugador} juega TRUCO`);
        this.estadoDelJuego.trucoActivo = true;
        this.cambiarTurno();
    },
    jugarEnvido(jugador: 'jugador' | 'cpu'): void {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.florActivo || this.estadoDelJuego.envidoResuelto) {
            mostrarMensaje('No puedes apostar Envido en este momento.');
            return;
        }
        mostrarMensaje(`${jugador} juega ENVIDO`);
        this.estadoDelJuego.envidoActivo = true;
        this.ultimaApuestaEnvido = 2;
        if (jugador === 'jugador') {
            const respuestaCPU = this.cpu.decidirApostarEnvido();
            if (respuestaCPU === 'Quiero') {
                mostrarMensaje('CPU QUIERE el Envido.');
                const deseaAumentarCPU = this.cpu.decidirAumentarEnvido();
                if (deseaAumentarCPU === 'Quiero') {
                    this.ultimaApuestaEnvido += 2;
                    mostrarMensaje(`CPU aumenta el Envido a ${this.ultimaApuestaEnvido}`);
                }
            } else {
                mostrarMensaje('CPU NO QUIERE el Envido.');
                mostrarMensaje('Jugador gana el Envido (por rechazo).');
                this.jugador.sumarPuntos(this.ultimaApuestaEnvido);
                this.actualizarCreditos();
                this.estadoDelJuego.envidoActivo = false;
                this.estadoDelJuego.envidoResuelto = true;
                return;
            }
        } else {
            const respuestaCPU = this.cpu.decidirApostarEnvido();
            if (respuestaCPU === 'Quiero') {
                this.ultimaApuestaEnvido += 2;
                mostrarMensaje(`CPU aumenta la apuesta a ${this.ultimaApuestaEnvido}`);
            }
        }
        resolverEnvido(this);
    },
    jugarFlor(jugador: 'jugador' | 'cpu'): void {
        if (this.estadoDelJuego.trucoActivo || this.estadoDelJuego.envidoActivo || this.estadoDelJuego.florResuelto) {
            mostrarMensaje('No puedes apostar Flor en este momento.');
            return;
        }
        mostrarMensaje(`${jugador} juega FLOR`);
        this.estadoDelJuego.florActivo = true;
        resolverFlor(this);
    },
    retirarse(jugador: 'jugador' | 'cpu'): void {
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
    mostrarMensaje(mensaje: string): void {
        const gameMessages = document.getElementById('gameMessages');
        if (!gameMessages) return;
        const mensajeElement = document.createElement('div');
        mensajeElement.textContent = mensaje;
        gameMessages.appendChild(mensajeElement);
        gameMessages.scrollTop = gameMessages.scrollHeight;
        if (gameMessages.children.length > 5) {
            gameMessages.removeChild(gameMessages.firstChild);
        }
    },
    cambiarTurno(): void {
        this.turno = this.turno === 'jugador' ? 'cpu' : 'jugador';
    },
    jugarCPU(): void {
        this.cpu.jugarTurno(this);
    }
};

// Inicialización del juego
juego.iniciarJuego();
