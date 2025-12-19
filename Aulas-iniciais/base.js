// Este arquivo demonstra os conceitos básicos de JavaScript para pessoas que estão começando a aprender programação.
// Comentários são textos que o computador ignora. Eles ajudam a explicar o que o código faz.

// Comentário de uma linha

/* Comentário de várias linhas */

// Variáveis são lugares para armazenar dados. Usamos 'const' para valores que não mudam e 'let' para valores que podem mudar.
const minhaVar = "Olá Mundo!"//const é usado para declarar variaveis que não mudam
let novaVar = 10 //let é usado para declarar variaveis que podem mudar
string = "Isso é uma string" //string é um texto
number = 20 //number é um numero
boolean = true //boolean é verdadeiro ou falso

// console.log imprime mensagens no console (terminal), útil para ver o que está acontecendo no código
console.log(minhaVar)
console.log(novaVar)
console.log(string)
console.log(number)
console.log(boolean)
console.log(minhaVar)
////////////////////////////////////////////////////////
// Operadores aritméticos: usados para fazer cálculos matemáticos
// Atribuição de Valores   
"Ola Mundo" + "!" //Concatenação de strings (juntar textos)
10 + 5 //Adição
10 - 5 //Subtração  
10 * 5 //Multiplicação
10 / 5 //Divisão
10 % 5 //Resto da Divisão
10 ** 5 //Exponenciacao

// Operadores de Comparação: comparam valores e retornam verdadeiro ou falso
10 == "10" //Igualdade de valor
10 === "10" //Igualdade de valor e tipo
10 != "10" //Diferente de valor
10 !== "10" //Diferente de valor e tipo
let  x = 10
x == 5 //Maior que
x <= 5 //Menor ou igual a
x >= 5 //Maior ou igual a
x != 5 //Diferente de

////////////////////
// Operadores Lógicos: combinam condições verdadeiras ou falsas
1 == 1 && 1 == 1 //E
1 == 1 || 1 == 1 //OU
!(1 == 1) //Nao

//////////////////////////
// && //E
// || //OU 
// ! //Nao - Negação tona o valor lógico contrário
/////////////////////////////
//
// Função: um bloco de código reutilizável que executa uma tarefa específica. Pode receber parâmetros (entradas) e retornar um valor (saída).
// Exemplo de função que recebe um nome e retorna uma saudação
function saudap (nome) {
    return "Ola" + nome + "!"
}

// Objeto: uma coleção de propriedades relacionadas, onde cada propriedade tem um nome (chave) e um valor.
// É como uma ficha com informações sobre algo.
// Exemplo de um objeto representando uma pessoa
const pessoa = {
    nome: "João",
    idade: 20,
    altura: 1.80
}

// Array: uma lista ordenada de valores, acessados por índices (posições, começando do 0).
// Exemplo de um array de frutas
const frutas = ["maçã", "banana", "laranja"]

// Controle de Fluxo: estruturas que permitem tomar decisões ou repetir ações baseado em condições.

// If-else: verifica uma condição. Se for verdadeira, executa o primeiro bloco; senão, o segundo.
if (pessoa.idade >= 18) {
    console.log("Maior de idade")
} else {
    console.log("Menor de idade")
}

// For loop: repete um bloco de código um número específico de vezes.
// Aqui, imprime cada fruta do array
for (let i = 0; i < frutas.length; i++) {
    console.log(frutas[i])
}

// While loop: repete um bloco de código enquanto a condição for verdadeira.
// Aqui, aumenta a idade até 25 e imprime uma mensagem
while (pessoa.idade < 25) {
    console.log("Ainda jovem")
    pessoa.idade++
}   

// Break: palavra-chave que sai imediatamente do loop, parando a repetição.
// Exemplo: imprime números de 0 a 4, pois para quando i é 5
for (let i = 0; i < 10; i++) {
    if (i === 5) {
        break
    }
    console.log(i)
}
// toda as palavras reservadas do javascript podem ser vistas na documentação oficial
// https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Lexical_grammar#keywords   
/////////////////////////////
// Manipulação de Strings
let texto = "  Olá Mundo!  "
console.log(texto.length) //tamanho da string
console.log(texto.toUpperCase()) //transforma tudo em maiusculo
console.log(texto.toLowerCase()) //transforma tudo em minusculo
console.log(texto.trim()) //remove espacos em branco no inicio e fim da string

