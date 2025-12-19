/*let nomeEstudante;
console.log(nomeEstudante); //imprime undefined porque a variavel nomeEstudante nao foi definida
console.log(typeof nomeEstudante); //imprime undefined porque a variavel nomeEstudante nao foi definida

let telefoneEstudante = null; //null é um valor que representa nenhum valor
console.log(telefoneEstudante); //imprime null porque a variavel telefoneEstudante foi definida como null
console.log(telefoneEstudante + 3) //imprime null porque a variavel telefoneEstudante foi definida como null
console.log(nomeEstudante + 3) //imprime undefined porque a variavel nomeEstudante nao foi definida
console.log(typeof nomeEstudante) //imprime undefined porque a variavel nomeEstudante nao foi definida
console.log(typeof telefoneEstudante) //imprime null porque a variavel telefoneEstudante foi definida como null


// Criando um símbolo
const meuSimbolo = Symbol(); //meuSimbolo é um simbolo

// Símbolos podem receber uma descrição (opcional)
const simboloComDescricao = Symbol('descricao_do_simbolo'); //simboloComDescricao é um simbolo com uma descricao

// Símbolos são únicos
const outroSimbolo = Symbol(); //outroSimbolo é um simbolo
console.log(meuSimbolo === outroSimbolo); // Saída: false porque os simbolos sao unicos

// Símbolos podem ser usados como chaves de propriedades de objetos
const obj = {
  [meuSimbolo]: 'valor_do_simbolo' //valor_do_simbolo é o valor da propriedade do simbolo
};

// Acessando a propriedade usando o símbolo como chave
console.log(obj[meuSimbolo]); // Saída: 'valor_do_simbolo' *

Number("1"); // retorna o número 1 
Number("Alura"); // retorna NaN
Number(undefined); // retorna NaN
Number(null); // retorna 0
console.log(Number("1")); //imprime o numero 1
console.log(Number("Alura")); //imprime NaN
console.log(Number(undefined)); //imprime NaN
console.log(Number(null)); //imprime 0
parseInt('4'); // retorna o número 4
parseInt('4.5'); // retorna o número 4

parseFloat('4'); // retorna o número 4
parseFloat('4.5'); // retorna o número 4.5
parseFloat('4.5abc'); // retorna o número 4.5 porque o javascript converte a string '4.5abc' para numero 4.5 e depois para NaN porque tem uma letra na string
console.log(parseInt('4')); //imprime o numero 4
console.log(parseInt('4.5')); //imprime o numero 4
console.log(parseFloat('4')); //imprime o numero 4
console.log(parseFloat('4.5')); //imprime o numero 4.5
console.log(parseFloat('4.5abc')); //imprime o numero 4.5 porque o javascript converte a string '4.5abc' para numero 4.5 e depois para NaN porque tem uma letra na string

+'45' // retorna o número 45
+true // retorna o número 1

console.log(typeof +'45'); // retorna ‘number’
console.log(typeof +true); // retorna ‘number’ 

'estudando JavaScript'.includes('Java');  //retorna true porque a string 'estudando JavaScript' contém a string 'Java'
const texto = 'estudando JavaScript';
texto.includes('Java'); // retorna true
console.log(texto.includes('Java')); //imprime true porque a string 'estudando JavaScript' contém a string 'Java'

'POR FAVOR, NÃO GRITE'.toLowerCase(); // retorna 'por favor, não grite'
console.log('POR FAVOR, NÃO GRITE'.toLowerCase()); //imprime 'por favor, não grite' porque a string 'POR FAVOR, NÃO GRITE' foi convertida para minusculo */


let frase = 'Estou aprendendo JavaScript';
console.log(`${frase.length}     caracteres - ${frase.toLocaleUpperCase()}` ); //imprime 25 caracteres - ESTOU APRENDENDO JAVASCRIPT porque a string 'Estou aprendendo JavaScript' foi convertida para maiusculo

let numero1 = null;
let numero2 = undefined;
console.log(numero1 + numero2); //imprime NaN porque null e undefined nao sao numeros

let number  = 10
let string = '10'
let boolean = true
console.log({number, string, boolean}); //imprime {number: 10, string: '10', boolean: true} porque number, string e boolean sao objetos

let numberToString = 10
let stringToNumber = numberToString.toString()
console.log(stringToNumber); //imprime '10' porque stringToNumber e igual a numberToString

let stringToNumber1 = "12523"
let numberToNumber1 = parseInt(stringToNumber1)
console.log(numberToNumber1); //imprime 12523 porque numberToNumber1 e igual a stringToNumber1
