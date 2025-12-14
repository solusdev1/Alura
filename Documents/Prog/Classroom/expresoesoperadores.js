/* operadores sao simobolos que realizam operações em operando (valores ou variaveis)*/

// Operadores Aritmeticos
console.log("SOMA :", 14 + 2)

console.log("Concatenação", "12" + "8")

console.log("SUBTRAÇÂO", 12 - 8)

console.log("MULTIPLICAÇÂO", 3 * 5.5)

console.log("DIVISAO", 20 / 5)

console.log("RESTO DA DIVISÃO", 13 % 2)

console.log("EXPONENCIAL", 3 ** 3 )


//Operadores de Incremento

let number = 10

//number = number + 1
number++ // tambem e possivel assim

console.log(number++)//incrementa após
console.log(number)

//incrementa antes 
console.log(++number)

//Decremento
console.log("Decremente após", number--)
console.log(number--)
console.log("Decrementeo antes", --number)

number += 10 //adciiona mais a quantidade apos o igual
console.log(number)

number-= 2 //retira a quantidad apos o igual
console.log(number)

// Ordem de Precedencia - é a definição do que deve ser calcudado primeiro
//Grouping Operator (ordem de Precedencia)

let total1 = 2 + 3 * 4
console.log(total1)

let total2 = ( 2 + 3) * 4
console.log(total2)

let average = 9.5 + 7 + 5 / 3 // divisão tem prioridade 
console.log(average)

let average2 = (9.5 + 7 + 5) / 3
console.log(average2)

// Operadores Logicos

let one = 1
let two = 2
 
// == igual a
console.log("IGUAL A ") 
console.log(one == two)
console.log(one == 1)
console.log(one == "1")// olha para o conteudo nao para o tipo, comparação de um numero com o string

// != Diferente de 
console.log("DIFERENTE DE ")
console.log(one != two)
console.log( one != 1)
console.log( one != "1")

//

let tree = 3
let four = 4

// Estritamente igual a (tipo e para o valor)

console.log(tree === 3)
console.log(tree === "3")

// Estritamente Diferente de 

console.log(tree !== 3)
console.log(tree !== "3")
console.log(four !== 4)
console.log(four !== "4")
//utilizar sempre o estritamente igual e  o estritamente diferente

// operadores de maior> menor< ou igual =

let balance = 500
let payment = 120

console.log(balance > payment)
console.log(balance < payment)
console.log(balance >= payment)
console.log(balance <= payment)

// Operadores de atribuição é o =

let value
//
value = 1
console.log(value)
//Incremento
value += 3
console.log(value)

//Multiplicador
value *= 3
console.log(value)

//Divisão
value /= 3
console.log(value)

// Resto de %

//value %= 4
console.log(value)

// exponencial **

value **= 3
console.log(value)

// operadores logicos

let email =true
let password = true
let isAdmin = true

// AND (E) && - retornar verdadeiro se todas as informações forem verdadeiras
console.log(email && password )

// OR (OU) se umas das condições foerem verdadeiras 
console.log( email  || password || isAdmin)

// NOT (negação) - inverte a apresentação da variavel mais nao altera seu valor
console.log(!password)