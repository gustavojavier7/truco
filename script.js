// script.js v1.05

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
        this.florJugador = this.tieneFlor(this.jugador);
        this.florCPU = this.tieneFlor(this.cpu);
    }

    repartirCartas() {
        for (let i = 0; i < 3; i++) {
            this.jugador.recibirCarta(this.mazo.sacarCarta());
            this.cpu.recibirCarta(this.mazo.sacarCarta());
        }
    }

    tieneFlor(jugador) {
        const palos = jugador.mostrarMano().map(carta => carta.palo);
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

    iniciarJuego() {
        this.mostrarCartas();
        this.actualizarCreditos();
        
        // Mostrar quién es el mano
        const manoDisplay = document.createElement('div');
        manoDisplay.id = 'manoDisplay';
        manoDisplay.style.color = 'yellow';
        manoDisplay.style.fontSize = '1.5vw';
        if (this.mano === 'cpu') {
            manoDisplay.textContent = 'Yo soy mano';
        } else {
            manoDisplay.textContent = 'Vos sos mano';
        }
        // Insertamos el mensaje justo después del display de créditos
        document.querySelector('.info-area').insertBefore(manoDisplay, document.querySelector('.game-options'));

        // Manejar la Flor
        this.manejarFlor();
    }

    manejarFlor() {
        if (this.florJugador) {
            // El jugador tiene Flor
            console.log('El jugador tiene Flor');
            // Mostrar un cuadro de diálogo para que el jugador decida si anuncia la Flor
            this.preguntarAnunciarFlor('jugador');
        } else if (this.florCPU) {
            // La CPU tiene Flor
            console.log('La CPU tiene Flor');
            // La CPU decide si anuncia la Flor
            const anunciarCPU = this.cpu.decidirAnunciarFlor(this.florCPU);
            if (anunciarCPU) {
                this.anunciarFlor('cpu');
            } else {
                // La CPU no anuncia la Flor, procedemos con Envido o Truco
                this.mostrarOpciones();
            }
        } else {
            // Nadie tiene Flor, procedemos con Envido o Truco
            this.mostrarOpciones();
        }
    }

    preguntarAnunciarFlor(jugador) {
        if (jugador === 'jugador') {
            // Mostrar un cuadro de diálogo al jugador
            const anuncio = confirm('¿Deseas anunciar la Flor?');
            if (anuncio) {
                this.anunciarFlor('jugador');
            } else {
                // El jugador decide no anunciar la Flor, procedemos con Envido o Truco
                this.mostrarOpciones();
            }
        }
    }

    anunciarFlor(jugador) {
        if (jugador === 'jugador') {
            // El jugador anuncia la Flor
            console.log('El jugador anuncia Flor');
            // Calcular el valor de la Flor
            const valorFlor = this.calcularValorFlor(this.jugador);
            console.log(`Valor de la Flor del jugador: ${valorFlor}`);
            // La CPU decide si quiere la Flor
            const respuestaCPU = this.cpu.decidirApostarFlor(valorFlor);
            if (respuestaCPU === 'Quiero') {
                console.log('CPU quiere la Flor');
                // Determinar el ganador de la Flor
                const valorFlorCPU = this.calcularValorFlor(this.cpu);
                if (valorFlor > valorFlorCPU) {
                    this.jugador.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('CPU gana la Flor');
                }
            } else {
                console.log('CPU no quiere la Flor');
                this.jugador.sumarPuntos(3); // Puntos por la Flor no aceptada
            }
        } else if (jugador === 'cpu') {
            // La CPU anuncia la Flor
            console.log('La CPU anuncia Flor');
            // Calcular el valor de la Flor de la CPU
            const valorFlorCPU = this.calcularValorFlor(this.cpu);
            console.log(`Valor de la Flor de la CPU: ${valorFlorCPU}`);
            // El jugador decide si quiere la Flor
            const respuestaJugador = confirm(`La CPU ha anunciado Flor con un valor de ${valorFlorCPU}. ¿Quieres?`);
            if (respuestaJugador) {
                console.log('Jugador quiere la Flor');
                // Determinar el ganador de la Flor
                const valorFlorJugador = this.calcularValorFlor(this.jugador);
                if (valorFlorJugador > valorFlorCPU) {
                    this.jugador.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('Jugador gana la Flor');
                } else {
                    this.cpu.sumarPuntos(3); // Puntos por ganar la Flor
                    console.log('CPU gana la Flor');
                }
            } else {
                console.log('Jugador no quiere la Flor');
                this.cpu.sumarPuntos(3); // Puntos por la Flor no aceptada
            }
        }
        // Actualizar créditos después de resolver la Flor
        this.actualizarCreditos();
        // Proceder con las opciones de juego después de manejar Flor
        this.mostrarOpciones();
    }

    calcularValorFlor(jugador) {
        const mano = jugador.mostrarMano();
        const valores = mano.map(carta => {
            if (carta.valor <= 7) {
                return carta.valor;
            } else {
                return 0; // Figuras (10, 11, 12) valen 0 en la Flor
            }
        });
        return valores.reduce((sum, valor) => sum + valor, 0) + 20;
    }

    mostrarOpciones() {
        const opciones = document.querySelector('.game-options');
        opciones.innerHTML = '';

        if (this.turno === 'jugador') {
            opciones.innerHTML = `
                <div class="option" id="trucoBtn">TRUCO</div>
                <div class="option" id="envidoBtn">ENVIDO</div>
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
            if (this.florCPU) {
                const anunciarCPU = this.cpu.decidirAnunciarFlor(this.florCPU);
                if (anunciarCPU) {
                    this.anunciarFlor('cpu');
                } else {
                    this.decisionCPU();
                }
            } else {
                this.decisionCPU();
            }
        }, 1000);
    }

    decisionCPU() {
        // Aquí la CPU decide qué hacer basado en su mano
        // Por ahora, simulamos decisiones básicas
        const acciones = ['truco', 'envido', 'retirarse'];
        const decision = acciones[Math.floor(Math.random() * acciones.length)];
        
        switch(decision) {
            case 'truco':
                this.jugarTruco('cpu');
                break;
            case 'envido':
                this.jugarEnvido('cpu');
                break;
            case 'retirarse':
                this.retirarse('cpu');
                break;
        }
    }

    // Métodos adicionales para la CPU
    CPU.prototype.decidirAnunciarFlor = function(palo) {
        // Lógica simple para decidir si anunciar la Flor
        // Por ejemplo, si tiene un buen valor de Flor, la anuncia
        const valorFlor = this.calcularValorFlor(this.mostrarMano());
        return valorFlor >= 30; // Umbral de decisión arbitrario
    };

    CPU.prototype.decidirApostarFlor = function(valorFlorOponente) {
        const valorFlorCPU = this.calcularValorFlor(this.mostrarMano());
        // Decide si acepta el desafío de la Flor basado en el valor de su propia Flor
        return valorFlorCPU >= valorFlorOponente ? 'Quiero' : 'No quiero';
    };
}
// Inicializar el juego
const jugador = new Jugador('Humano');
const cpu = new CPU('CPU');
const juego = new JuegoTruco(jugador, cpu);
juego.iniciarJuego();
