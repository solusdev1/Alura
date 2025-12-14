// Funções - Bloco de Codigo que realiza uma tarefa especifica ou calcula um valor, ela é definida e pode ser chamada varias vezes

/*function message () {

console.log("Olá. É bom ter você aqui")

}
message()
*/
/* Parametros: é a variavel (escopo da função) que ira receber um valor em uma função
-Argumentos : é o valor qie é passado para a função */

// a ordem dos parametros importa

function message(username) {
console.log("Olá", username)

}
message("Rodrigo")
message("Ola Ana")

function joinText(text1,text2 = "",text3 = ""){
    console.log(text1,text2,text3)
    
} // a ordem dos parametros importa

joinText("David", "oliveira", "silva")
joinText("Oliveira ", "David")

function sum(a , b){
    let result = a + b
    
    return result
}
let response = sum ( 7,7)
console.log(response);

console.log(sum(5,6));

// Função em hoisting

showMessage("Ola DAvid")

function showMessage(message1){
    console.log(message1);
    endline()
    
    function endline(){
        console.log("-------------------");
        
    }
}
showMessage ("Tudo bem")

console.log("-------------------");

/*
Comentario de documentação em javascript( sintaxe de JSDoc).
o JSDoc é um padrao para incorporar documentação no codigo-fonte apartir desses comentario */


/**
 * Authenticated the user 
 * @param {String} email user email 
 * @param {String} password  more than 6 characters
 * @returns {Number} user id
 */
function signIn(email, password){
// Fluxo de Autenticação do Usuario.

return 7

}

signIn("david@gmail.com", "12345678")

// Função Anonima (função que nao possui nome)

const showMessage1 = function(){
    return "Ola David"
}
console.log(showMessage1());

const showMessage2 = function(message3 , name1){
    return message3 + name1
}
console.log(showMessage2("Ola " , "david"));

//Arrow Function (funcao de seta)

const smessage = () =>{
    console.log("Ola");
}
console.log(smessage);
smessage()

const smessage2 = (name2, email) => {
    //console.log("Ola, ", name2, "Seu Email " , email);
    console.log(`Olá ${name2}. Seu email é:  ${email}.`)// `acento grave para interpolação
    

}
smessage2 ("Joao", "teste@gmail")


//
// CALLBACK FUNCTION: é uma função passada para outra função como um argumento

function execute (taskName, callback){
    console.log("Executando a tarefa:", taskName);
    callback() }

    function callback(){
        console.log("Tarefa Finalizada");
        
    }
    
//Passando para a função
execute ("Downlod do Arquivo...", callback)

//Criando a função no proprio parametro (função anonima)
execute("upload do Arquivo", function(){
    console.log("Função de Callback com uma Função anonima");
   
})

//utilizando Arrow Function
execute("Excluindo um Arquivo", () => {
    console.log("Arquivo Exlcuido");
    
})
// se for apenas uma linha nao precisa de chaves
execute ("Salvando Arquivo...", () => console.log("Arquivo salvo!"))


