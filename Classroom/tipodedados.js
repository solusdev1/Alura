/* tipos de dados 
No Javascript, uma linguagem dinâmica com tipos dinâmicos, o tipo da variável é definido pelo valor atribuído.
 Diferentemente de outras linguagens, no Javascript não é necessário declarar o tipo da variável. 
Exploramos os tipos primitivos, como String, Number, Boolean, Null e Undefined,
 ressaltando a flexibilidade em atribuir diferentes tipos a uma mesma variável. Esses conceitos são fundamentais para manipular dados de forma eficiente.
 */

 /* tipos Primitivos
 String = Rodrigo
 Number = 123456
 Boolean = True
 Null = nulo( vazio)
 Undefined = o proprio javascript atribui a uma variavel que nao armazena nada
 */

// String - Armazenar Texto

let username = "David"
console.log(username)
console.log(typeof username)

console.log("Uma String com Aspas")
console.log('Uma String com apóstrofo (aspas simples)')
// Quando utilizar uma ou outra
console.log('Uma string com " aspas duplas" dentro de simples')
console.log("Uma string com 'aspas simples' dentro da dupla")

//
console.log(`uma string com acento GRAVE permite
    escrever multiplas linhas.
    `)
    //

//Template literals (template strings, interpolação de strings)
let name  = "david"
let email = "david@mgial.com"
// passar no console log mais de um parametro
console.log(name,email,"teste")

// Concatenar Texto
let message = " Ola," + name + ". Voce conectou com o e-mail" + email
console.log(message)


// template literals
console.log(`Ola,${name}. Voce conectou com o e-mail
    ${email}.`)  
    
    // Number
    console.log(typeof 5)

//Inteiro Positivo
console.log( 5 )

// Inteiro Negativo
console.log(-5)

//NUmeros reais ou Float
console.log(125.70)

// Nan - Not a Number.
console.log(12.5 / "David")

//Boolean
console.log(true)
console.log(false)

let isLoading = true
console.log(typeof isLoading)

//Undifined (indefinido) - Null

let emptiness 
console.log("o valor é",emptiness)

let empty = null
console.log("O valor é:", empty)

/*A conversão de tipos envolve transformar um valor de um tipo para outro de forma consciente, utilizando o typecasting. Já a coerção de tipos ocorre de forma automática,
 quando o JavaScript tenta converter valores para um tipo compatível antes de realizar uma operação.
Exemplos práticos foram mostrados, como a conversão de números para strings e vice-versa, e a coerção de tipos em operações matemáticas. 
É importante entender a diferença entre esses dois conceitos ao programar em JavaScript. */
// Conversão de Tipo
let value = "9"
console.log(typeof value)
console.log(typeof Number(value))

let age = 18
console.log(typeof age.toString())
console.log(typeof String(age))

let option = 1
console.log(Boolean(option))
console.log(typeof Boolean(option))

// Coerção de tipos:

console.log(typeof("10" +  5))




