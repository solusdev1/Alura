// Estrutura de repetição For
for ( let contador = 0 ; contador <= 10 ; contador++ ) {
  console.log("Numero Atual " + contador);
}
// o for é usado para repetir um bloco de código um número específico de vezes. Ele é composto por três partes principais: inicialização (let contador = 0), condição (contador <= 10) e incremento (contador++). Enquanto a condição for verdadeira, o bloco de código dentro do for será executado, incrementando o contador a cada iteração até que a condição se torne falsa.
for (let numero = 0; numero <= 20; numero++ ){
  if ( numero % 2 === 0 ) {
    console.log("Número par: " + numero);
  }
}
// Neste exemplo, o loop for itera de 0 a 20 e usa uma estrutura condicional if para verificar se o número é par (usando o operador módulo %). Se o número for par, ele é impresso no console.
  for (let numero = 0; numero <= 20; numero++ ){
  if ( numero % 2 > 0 ) {
    console.log("Número ímpar: " + numero);
 
}
  }
// Neste exemplo, o loop for itera de 0 a 20 e usa uma estrutura condicional if para verificar se o número é par (usando o operador módulo %). Se o número for par, ele é impresso no console.
const palavra = "calopsita"
for( let cont = 0; cont < palavra.length; cont++ ) {
  console.log(palavra[cont])
}
// Neste exemplo, o loop for itera sobre cada caractere da string "calopsita" usando a propriedade length para determinar o número de iterações. A cada iteração, o caractere atual é acessado usando a notação de colchetes (palavra[cont]) e impresso no console.