/*function saudacao(){
  console.log("E ai beleza?")
}
setTimeout(saudacao, 2000) // Executa a função após 2 segundos
*/

// Nesse caso, o clearInterval não funcionará corretamente, pois 'contador' é um número e não o ID do intervalo.
// Para usar o clearInterval corretamente, precisamos armazenar o ID retornado por setInterval

let contador = 0
let intervalo = setInterval(() => { // Set interval é usado para executar uma função repetidamente em um intervalo de tempo definido
  contador++
  console.log("Executando a cada 2 segundos: " + contador)
}, 1000)

// Para parar a execução após 10 segundos
setTimeout(() => { // Set timeout é usado para executar uma função uma única vez após um determinado tempo
  clearInterval(intervalo) // Para parar o intervalo
  console.log("Intervalo parado")
}, 10000)

