// parametros/argumentos
//retornos
/*
function exibeInfosEstudante (nome,nota) { // nome é o parametro
  return (`O nome do estudante é ${nome} e a nota é ${nota}`);
}
console.log(exibeInfosEstudante("João Silva",10)); // "João Silva" é o argumento
console.log(exibeInfosEstudante("David Silva",8)); //"David Silva" é o argumento

// declaração da função
function somarDoisNumeros(numA, numB) {
 return numA + numB;
}

// execução (ou chamada) da função
somarDoisNumeros(2, 2);

// atribuindo o retorno de uma função a uma variável
const resultado1 = somarDoisNumeros(2, 2);
console.log(resultado1);

function dividir(dividendo, divisor) { // declaração da função
 return dividendo / divisor;
}

const resultado = dividir(10, 2);
console.log(`o resultado é ${resultado}`); // o resultado é 5

*/

function saudacao(nome) { //nome é o parametro da função
  return `Olá, ${nome}! Seja bem-vindo(a).`;
}
console.log(saudacao("Maria")); // Olá, Maria! Seja bem-vindo(a).

function calcularDobro(numero) {
  return numero * 2;
}
console.log(calcularDobro(5)); // 10