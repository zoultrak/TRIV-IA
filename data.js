const API_KEY = "AIzaSyDavxPjuogtsj-g9vsWS0JO3dMnQgERDoA";
//const MODEL = "gemini-2.5-flash"; // o "gemini-1.5-pro"
//const MODEL = "gemini-2.5-flash";
const MODEL = "gemini-2.5-flash-lite";
//const MODEL = "gemini-2.0-flash";


//variables globales
let contadores = {correctas: 0, incorrectas: 0};
let preguntaActual = null;



const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function generaPregunta(){


    const temas = [
    "conceptos básicos de Docker y contenedores",
    "imágenes de Docker y registros",
    "comandos esenciales de Docker",
    "volúmenes y persistencia de datos en Docker",
    "redes en Docker y comunicación entre contenedores",
    "Docker Compose y orquestación básica"];


    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];

const prompt = `En el contexto de JavaScript, CSS y HTML. Genera una pregunta de opción múltiple sobre el siguiente tema ${temaAleatorio}. Proporciona cuatro opciones de respuesta y señala cuál es la correcta.    
            Genera la pregunta y sus posibles respuestas en formato JSON como el siguiente ejemplo, asegúrate de que el resultado SÓLO contenga el objeto JSON y no texto adicional. Aquí te doy dos ejemplos:  
            1. Sobre contenedores de Docker:
            {
              "question": "¿Cuál es la principal diferencia entre una imagen de Docker y un contenedor?",
              "options": [
                "a) La imagen es el contenedor en ejecución",
                "b) La imagen es una plantilla inmutable y el contenedor es una instancia en ejecución de esa imagen",
                "c) No hay diferencia, son sinónimos",
                "d) El contenedor almacena datos y la imagen es solo para procesamiento"
              ],
              "correct_answer": "b) La imagen es una plantilla inmutable y el contenedor es una instancia en ejecución de esa imagen",
              "explanation": "Una imagen de Docker es una plantilla inmutable que contiene todo lo necesario para ejecutar una aplicación. Un contenedor es una instancia en ejecución de esa imagen, con su propio sistema de archivos y recursos aislados."
            }
            2. Sobre comandos de Docker:
            {
              "question": "¿Cuál es el comando correcto para crear y ejecutar un nuevo contenedor a partir de una imagen?",
              "options": [
                "a) docker start nginx",
                "b) docker run nginx",
                "c) docker create nginx",
                "d) docker execute nginx"
              ],
              "correct_answer": "b) docker run nginx",
              "explanation": "El comando 'docker run' crea un nuevo contenedor y lo inicia. Es el comando más común para ejecutar contenedores en Docker."
            }`;

            try {
                const response = await fetch(
                    url,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: prompt }]
                            }],
                            // Opcional: añadir la configuración de generación
                            generationConfig: {
                                temperature: 0.25,
                                responseMimeType: "application/json"
                            },
                        }),
                    }
                );
        
                // Manejo de errores de HTTP
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData)}`);
                }
        
                const data = await response.json();
                console.log("Respuesta transformada a json:", data);
        
                
                // Extracción simple del texto de la respuesta, asumiendo que la respuesta tiene al menos una 'candidate' y 'part'     
                const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
                const textResultTrimmed = textResult.trim();
                const firstBraceIndex = textResultTrimmed.indexOf('{');
                const lastBraceIndex = textResultTrimmed.lastIndexOf('}');
                const jsonString = textResultTrimmed.substring(firstBraceIndex, lastBraceIndex + 1);
        
        
                if (jsonString) {            
                    const questionData = JSON.parse(jsonString);
                    console.log(questionData);
                    return questionData;
                } else {
                    console.log("No se pudo extraer el texto de la respuesta.");
                }
        
            } catch (error) {
                console.error("Hubo un error en la petición:", error);
                document.getElementById('question').textContent = 'Error al cargar la pregunta. Por favor, revisa la clave API o la consola.';
                return null;
            }


        }



        async function cargarPregunta() {
            // Mostrar mensaje de carga
            document.getElementById('question').className = 'text-warning';
            document.getElementById('question').textContent = 'Cargando pregunta de Gemini...';
            document.getElementById('options').innerHTML = '';
            const datosPregunta = await generaPregunta();
            console.log(datosPregunta);
        
            if (datosPregunta) {
                document.getElementById('question').className = 'text-success';
                console.log("Datos de la pregunta recibidos:", datosPregunta);
                preguntaActual = datosPregunta;
                desplegarPregunta(datosPregunta);
            }
        }






        function desplegarPregunta(datosPregunta){
            document.getElementById('question').className = 'text-success';
            document.getElementById('question').innerHTML=datosPregunta.question;
            //document.getElementById('question').innerHTML=datosPregunta['question'];
            const contenedorOpciones = document.getElementById('options');
            contenedorOpciones.innerHTML = '';

            datosPregunta.options.forEach((opcion) => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary btn-lg';
                btn.textContent = opcion;
                btn.onclick = () => verificarRespuesta(opcion, datosPregunta.correct_answer); 
                contenedorOpciones.appendChild(btn);

            });


        }

       function verificarRespuesta(opcionSeleccionada, respuestaCorrecta) {
            const esCorrecta = opcionSeleccionada === respuestaCorrecta;

            if (esCorrecta) {
                contadores.correctas++;
                mostrarResultado('¡Correcta!', 'success');
            } else {
                contadores.incorrectas++;
                mostrarResultado(`Incorrecta. La respuesta correcta es: ${respuestaCorrecta}`, 'danger');
            }
            guardarContadores();
            actualizarUIContadores();
            deshabilitarBotones();
            mostrarBotonSiguiente();
        }
        


        function mostrarResultado(mensaje, tipo) {
            const contenedorPregunta = document.getElementById('question-container');

            let divResultado = document.getElementById('mensaje-resultado');
            if (!divResultado) {
                divResultado = document.createElement('div');
                divResultado.id = 'mensaje-resultado';
                contenedorPregunta.appendChild(divResultado);
            }

            divResultado.className = `alert alert-${tipo} mt-3`;
            divResultado.innerHTML = `<strong>${mensaje}</strong><br><em>${preguntaActual.explanation}</em>`;
        }


        function mostrarBotonSiguiente(){
            const contenedorOpciones = document.getElementById('options');

            const btnSiguiente = document.createElement('button');
            btnSiguiente.className = 'btn btn-info btn-lg mt-3 w-100';
            btnSiguiente.textContent = 'Siguiente Pregunta';
            btnSiguiente.onclick = cargarPregunta;
            contenedorOpciones.appendChild(btnSiguiente);


        }

        function deshabilitarBotones(){

            const botones = document.querySelectorAll('#options button');
            botones.forEach(btn => {
                if (!btn.classList.contains('btn-info')){
                    btn.disabled = true;
                }
            });
        }


        //FUNCIONES DE LOCAL STORAGE

        function desplegarContadores(){
            const guardado = localStorage.getItem('triviaContadores');
            if (guardado){
                contadores = JSON.parse(guardado);
            }
            actualizarUIContadores();

        }

        function guardarContadores(){
            localStorage.setItem('triviaContadores', JSON.stringify(contadores));
        }

        function actualizarUIContadores(){
            document.getElementById('correctas').textContent = contadores.correctas;
            document.getElementById('incorrectas').textContent = contadores.incorrectas;
        }



        window.onload = () => {
            console.log("Página cargada y función inicial ejecutada.");
            desplegarContadores();
            cargarPregunta();    
        };

generaPregunta();