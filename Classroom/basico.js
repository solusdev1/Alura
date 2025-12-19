//comentario de 1 linha usa barra e não pega  linha seguinte
/* comentario de varias linhas
com o asteris e barra o comentario pode ser usado em varias linhas sem problemas */
console.log("Hello World") //tambem pode ser do lado de um codigo ou na linha.
console.log("Essa Mensagem é do JS conctado com o HTML")//sintaxe correta, ; é opcional no javascript

// variaveis são espaços na memoria que utiliza para guardar alguma informação, varios tipo de informações, variaveis podem variar, pode ser alteradas e modificadas
// Declara uma varia sem valor.
var user 

console.log(user)

// Declara uma VAriavel com valor.
var email = "david@teste.com"
console.log(email)

//Substitui o valor da Variavel
email = "joao@teste.com"
console.log(email)



/* Case Sensitive - 
Quando uma linguagem de programação pe
case-sensitive significa que ela é sensivel
a letras maiusculas e minusculas */

var product = "Teclado Mecanico"
var Product = "Mouse Gamer"

console.log(Product)
console.log(product)
//

// Outra forma de declarar variaveis sem valor

let username1 //nao deixa criar outra variavel no mesmo nome - let é uma palavra reservada para a criação de variaveis

console.log("David")

// Declare uma variavel com valor

let email1 = "david@gmail.com"
console.log(email1)

email1 = "teste@123.com"
console.log(email1)

//
//uma constante cria uma  variavel com valor fixo (não pode ser Alterado)
const number = 42
console.log(number)

/* Escopos:
Global - variaveis declaradas fora de qualquer função ou bloco de codigo (var)
Bloco - acessiveis apenas dentro do bloco de codigo onde foram declaradas(let e const)
local - (ou escopo de funçao) variaveis declaradas dentro de uma função.
*/
// nome de variaveis - case sensitive
let username = "David"
let userName = "Silva"
console.log(username)
console.log(userName)
// Podemos utilizar caracter especial para criação de nome de variaveis
let $email = "12gmail.com"
let _email = "13@gmail.com"
let user_email = "14@gmail.com"
console.log($email)
console.log(_email)
console.log(user_email)

// é possivel utilizar caracter especias - nao recomendado
let Ação = "cadastro"
console.log(Ação)

// nao podemos começar uma variavel com numero
//let 1user = "ana"

// RECOMENDAÇÃO camelCase - ESCREVA EM INGLES

let register =" Cadastrar"
console.log(register)

// Dar um nome que faça sentido para a variavel
let productName  = " Teclado" // primeira palavra em minusculo, a segunda parte da palavra deve ser com a 1° letra MAISUCULA
let firstname = "David"
let lastname = "Silva"

//Recomendação snake_case (rastejar)

let product_name = "Mouse"
let first_name = "David"
let last_name = "Silva"



