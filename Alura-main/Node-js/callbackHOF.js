//HOF -> High Order Function (Função de Alta Ordem)
//Função que recebe outra função como parâmetro ou retorna uma função como resultado
function calcular(numero1,numero2, operacao) {
  return operacao(numero1,numero2);
}
function somar(num1,num2) {
  return num1 + num2;
}
function divisao(num1,num2) {
  return num1 / num2;
}

const resultadoDaSoma = calcular(3, 8, somar) 
const resultadoDivisao = calcular(28, 4, divisao)
console.log("Resultado da Soma", resultadoDaSoma)
console.log("Resultado da Divisao: ", resultadoDivisao)

