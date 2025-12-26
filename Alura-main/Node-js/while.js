const { e } = require("nunjucks/src/filters");

/*let contador = 1
while ( contador <= 10 ) {
  console.log("Número Atual: " + contador);
  contador++
} // o while verifica a condição antes de executar o bloco de código. Enquanto a condição for verdadeira (contador <= 10), o código dentro do while será executado, incrementando o contador a cada iteração até que a condição se torne falsa.

let numero = 0
do {
  console.log("Número Atual: " + numero);
  numero++
} while (numero <= 10)  // o do while executa o bloco de código pelo menos uma vez antes de verificar a condição no final. Isso garante que o código dentro do loop seja executado pelo menos uma vez, mesmo que a condição inicial seja falsa.

  while ( let numero = 0 ; contador <= 10 ; contador++ ) {
  console.log("Numero Atual " + contador);
}
let numero = 0
do{
   console.log("Número atual: " + numero);
numero++
} while ( numero <= 20 )
// Neste exemplo, o loop do...while itera de 0 a 20, imprimindo cada número no console. A condição (numero <= 20) é verificada após a execução do bloco de código, garantindo que o código seja executado pelo menos uma vez.


let numero = 1
do {
  if ( numero % 2 === 0 ) { 
    console.log("Número par: " + numero);
  }
  numero++
} while ( numero <= 20 )  
// Neste exemplo, o loop do...while itera de 0 a 20 e usa uma estrutura condicional if para verificar se o número é par (usando o operador módulo %). Se o número for par, ele é impresso no console.

let par = 0
let impar = 0
do {
  if ( par % 2 === 0 ) {
    console.log("Número par: " + par);
  }
  par++
} while ( par <= 100 )


let par = 0
let impar = 0
do {
  if ( impar % 2 > 0 ) {
    console.log("Número ímpar: " + impar);
  }
  impar++

  if (par % 2 === 0 ) {
    console.log("Número par: " + par);
    
} par++
}
 while ( impar,par <= 100 )
// Neste exemplo, o loop do...while itera de 0 a 20 e usa uma estrutura condicional if para verificar se o número é par (usando o operador módulo %). Se o número for par, ele é impresso no console.

 */
for (let i = 0, j = 10; i < j; i++, j--) { 

console.log(`i: ${i}, j: ${j}`); 

} 

// Resultado: 

// i: 0, j: 10 

// i: 1, j: 9 

// i: 2, j: 8 

// i: 3, j: 7 

// i: 4, j: 6 