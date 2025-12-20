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


/*let estoqueProdutoA = 50; // estoque inicial do produto A

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
realizarVenda(30);
*/

const readline = require("readline");    

let estoqueProdutoA = 50; // estoque inicial do produto A

function realizarVenda(quantidade) { // função para realizar a venda do produto A
    if (quantidade <= estoqueProdutoA) { // se a quantidade for menor ou igual ao estoque do produto A
        estoqueProdutoA -= quantidade; // subtrai a quantidade do estoque do produto A

        console.log("\n✅ Venda realizada com sucesso!"); // imprime a mensagem de venda realizada com sucesso
        console.log(`📦 Estoque atual do produto A: ${estoqueProdutoA}`); // imprime o estoque atual do produto A
        return true; // venda realizada
    } else {
        console.log("\n❌ Estoque insuficiente para realizar a venda."); // imprime a mensagem de estoque insuficiente para realizar a venda
        console.log(`📦 Estoque disponível: ${estoqueProdutoA}`); // imprime o estoque disponível
        return false; // venda não realizada
    }
}

const rl = readline.createInterface({ // cria uma interface para leitura de dados
    input: process.stdin, // entrada de dados
    output: process.stdout // saida de dados
});

function perguntarVenda() { // função para perguntar a quantidade de produtos a serem vendidos
    if (estoqueProdutoA <= 0) { // se o estoque do produto A for menor ou igual a 0
        console.log("\n🚫 Estoque zerado. Encerrando vendas."); // imprime a mensagem de estoque zerado e encerrando vendas 
        rl.close(); // fecha a interface de leitura de dados
        return;
    }

    rl.question("\nDigite a quantidade a vender (ou 0 para sair): ", (resposta) => {
        const quantidade = Number(resposta); // converte a resposta para numero

        if (quantidade === 0) { // se a quantidade for igual a 0
            console.log("\n👋 Vendas encerradas pelo usuário."); // imprime a mensagem de vendas encerradas pelo usuário
            rl.close(); // fecha a interface de leitura de dados
            return;
        }

        if (isNaN(quantidade) || quantidade < 0) { // se a quantidade for um numero invalido ou menor que 0
            console.log("❌ Valor inválido. Digite um número maior que zero."); // imprime a mensagem de valor inválido e digite um número maior que zero
            perguntarVenda(); // continua perguntando a quantidade de produtos a serem vendidos         
            return;
        }

        const vendaOk = realizarVenda(quantidade); // realiza a venda do produto A          

        // Continua perguntando somente se ainda houver estoque suficiente para realizar a venda            
        if (vendaOk && estoqueProdutoA > 0) {
            perguntarVenda(); // continua perguntando a quantidade de produtos a serem vendidos
        } else {
            console.log("\n🚫 Não é possível continuar vendendo."); // imprime a mensagem de não é possível continuar vendendo
            rl.close(); // fecha a interface de leitura de dados
        }
    });
}

// Início
console.log(`📦 Estoque inicial do produto A: ${estoqueProdutoA}`); // imprime o estoque inicial do produto A
perguntarVenda(); // inicia a pergunta de quantidade de produtos a serem vendidos   



