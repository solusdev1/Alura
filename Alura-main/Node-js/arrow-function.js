const estudanteReprovou = (notafinal,faltas) => { 
  if (notafinal < 7 && faltas > 4) { //faz um if para verificar se a nota final é menor que 7 e as faltas são maiores que 4
    return true
  } else { //se não
    return false
  }
}

const exibeNome = (nome) => nome //arrow function que retorna o nome, pode de ser usada quando há apenas um parametro e uma única linha de código
console.log(estudanteReprovou(6,5)) // true
console.log(estudanteReprovou(8,3)) // false
console.log(exibeNome("Maria")) // Maria

// Função de calculadora simples
const calculadoraSimples = (a, b, operacao) => {    
    if (operacao === 'soma') {
        resultado = a + b;
    } else if (operacao === 'subtracao') {
        resultado = a - b;
    } else if (operacao === 'multiplicacao') {
        resultado = a * b;
    } else if (operacao === 'divisao') {
        resultado = a / b;
    } else {
        resultado = 'Operação não reconhecida';
    }
  };
const calculadoraSimples = (a, b, operacao) => {
    if (operacao === 'soma') {
        return a + b;
    } else if (operacao === 'subtracao') {
        return a - b;
    } else if (operacao === 'multiplicacao') {
        return a * b;
    } else if (operacao === 'divisao') {
        return a / b;
    } else {
        return 'Operação não reconhecida';
    }
};
