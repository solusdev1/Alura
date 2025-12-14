

// Hoisting (levantar ou içar) se refere ao compartamento do interpretador de mover as declarações de variaveis e funções para o topo do escopo em que foram definidas antes msmo da execução do codigo
// //console.log(user)
//var user = "David"

//
//var user
//console.log(user)

//escopo global
var email = "jose@email.com"
{
    //escopo de bloco
    console.log(email)
}

{
    var age = 18
}
console.log(age)


{
    let address = "Rua X"
    console.log(address)
 
}