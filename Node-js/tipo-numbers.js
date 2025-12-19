/*const notaPrimeiroBi = 8 //numero inteiro
const notaSegundoBi = 6.5 //numero decimal
const notaTerceiroBi = 7.5 //numero decimal
//const notaQuartoBi = '8.5' //string
const notaQuartoBi = Number.parseInt('8.5') //converte a string para numero inteiro

const total = notaPrimeiroBi + notaSegundoBi + notaTerceiroBi + notaQuartoBi; //soma dos numeros

const media = total / 4; //media dos numeros
if(media >= 7){
    console.log(`A média é ${media} você foi Aprovado`); //imprime a media e se foi aprovado
}else{
    console.log(`A média é ${media} você foi Reprovado`); //imprime a media e se foi reprovado
}

console.log(`A média é ${media} você foi ${media >= 7 ? 'Aprovado' : 'Reprovado'}`); //imprime a media e se foi aprovado ou reprovado fazendo uma condição ternaria dentro de um template string
console.log(5 * '5'); //imprime 25 porque o javascript converte o '5' para numero inteiro e multiplica por 5
console.log(5 * 'a'); // NaN porque o javascript nao consegue converter a string 'a' para numero e multiplica por 5*/
const numero = 10; //numero inteiro
const nome = 'Ana'; //string

console.log(Number.isNaN(numero)); // false porque o numero é um numero inteiro
console.log(Number.isNaN(nome)); // false porque o nome é uma string
console.log(Number.isNaN(NaN)); // true porque NaN é um numero nao definido
isNaN(10) // false
console.log(isNaN(nome)); // true porque o nome é uma string
isNaN(NaN) // true
