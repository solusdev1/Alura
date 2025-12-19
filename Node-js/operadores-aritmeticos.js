/*const notaPrimeiroBimestre = 10
const notaSegundoBimestre = 8
const notaTerceiroBimestre = 5
const notaQuartoBimestre = 6.1

let media = (notaPrimeiroBimestre + notaSegundoBimestre + notaTerceiroBimestre + notaQuartoBimestre) / 4

if(media >= 7){ //se a media for maior ou igual a 7
    media += media * 0.1 //a media recebe a media mais a media vezes 0.1
}
console.log(`A média é: ${media.toFixed(2)}`) //imprime a media com 2 casas decimais


const salarioMensal = 3500; 
const despesasFixas = 1200; 
const despesasVariaveis = 500; 
const economiasMensais = 800;
const bonusAnual = 3000;

const resultado = (salarioMensal - despesasFixas - despesasVariaveis) * 12 + (economiasMensais * 12) + bonusAnual; //o resultado é a soma do salario mensal menos as despesas fixas menos as despesas variaveis vezes 12 mais as economias mensais vezes 12 mais o bonus anual
console.log(`O resultado é: ${resultado.toFixed(2)}`) //imprime o resultado com 2 casas decimais

let resultado1;
resultado1 = 10 + 5 * 2 / 3 - 7 + 15 * 3 / 5 + 20 - 4 * 2;// se
let resultado2;
resultado2 = 10 + ((5 * 2) / 3) - 7 + ((15 * 3) / 5) + 20 - (4 * 2); //sempre que usar parenteses, a expressão dentro dos parenteses é calculada primeiro e depois o resultado é calculado segundo a ordem de precedencia 
console.log("O resultado da expressão é:", resultado2);
console.log("O resultado da expressão é:", resultado1);


let contadorVisitas = 0;
contadorVisitas = contadorVisitas + 1;
contadorVisitas += 1; //incrementa o contador de visitas em 1 usando o operador de atribuição
contadorVisitas++; //incrementa o contador de visitas em 1 usando o operador de incremento
console.log(contadorVisitas); //imprime o contador de visitas
*/


let estoqueProdutoA = 50; // estoque inicial do produto A

function realizarVenda(quantidade) { //função para realizar a venda do produto A
    if (quantidade <= estoqueProdutoA) {
        estoqueProdutoA -= quantidade; // subtrai a quantidade do estoque do produto A

        console.log("✅ Venda realizada com sucesso!"); // imprime a mensagem de venda realizada com sucesso
        console.log(`📦 Estoque atual do produto A: ${estoqueProdutoA}`); // imprime o estoque atual do produto A
    } else {
        console.log("❌ Estoque insuficiente para realizar a venda."); // imprime a mensagem de estoque insuficiente para realizar a venda
    }
}

// Exemplo de venda
realizarVenda(60);
