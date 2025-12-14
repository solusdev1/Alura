// Estrutura de Condição  - permite executar diferentes ações baseada em (verdadeiro ou falso)
// Operador Condicional ternario (3 Etapas,a  verificação logica - se for verdadeiro  apos o interrogação vem a mensagem e se nao for verdadeiro vem a mensagem do : )

let age = 18

console.log(age >= 18 //1 -  condição ou teste
     ? "Voce Pode Dirigir" // 2 - se verdadeiro
      : "Voce nao pode dirigir" //3 -  se falso
    )

    console.log(age < 18 ? 
        "Voce não pode Dirigir"
        : "Voce pode Dirigir"
    )
    //
// falsy  quando o valor é considerado false e TRUTHY quando é considerado verdadeiro em contexdo onde um boolean é obrigatorio ( condicionais e loops)

console.log ("####Exemplos de FALSE###")
console.log(false ? "Verdadeiro" : "falso")
console.log("" ? "Verdadeiro" : "falso")
console.log(0 ? "Verdadeiro" : "falso")
console.log(-0 ? "Verdadeiro" : "falso")
console.log(null ? "Verdadeiro" : "falso")
console.log(false ? "Verdadeiro" : "falso")
console.log(undefined ? "Verdadeiro" : "falso")
console.log(NaN ? "Verdadeiro" : "falso")


console.log ("###Exemplos de Verdadeiro###")
console.log(true ? "Verdadeiro" : "falso")
console.log({} ? "Verdadeiro" : "falso")
console.log([] ? "Verdadeiro" : "falso")
console.log(1 ? "Verdadeiro" : "falso")
console.log(3.23 ? "Verdadeiro" : "falso")
console.log("DAvid" ? "Verdadeiro" : "falso")
console.log( " " ?"Verdadeiro" : "falso")
console.log("0" ? "Verdadeiro" : "falso")
console.log("false" ? "Verdadeiro" : "falso")
console.log("-1" ? "Verdadeiro" : "falso")
console.log(Infinity ? "Verdadeiro" : "falso")
console.log(-Infinity ? "Verdadeiro" : "falso")

//

// Estrutura de condição IF (SE)

let hour = 11
if (hour <= 12 ){
console.log("Bom dia!")
}
if (hour <= 12)
    console.log("Bom dia")
    console.log("Seja bem vindo")
//

//  ELSE  ( SE NÂO)

let age1 = 22

if (age1 < 18){
    console.log("Voce não pode Dirigir ")
}
else{
    console.log(" Voce pode Dirigir")
}
// IF ELSE IF

let hour1 = 13
/*
if (hour1 <= 12){
    console.log("Bom dia")
}
else if (hour1 > 18){
    console.log("Boa  Noite")
}
else if (hour1 > 12) {
    console.log("Boa tarde")
}*/
if (hour1 <= 12){
    console.log("Bom dia")
}
else if(hour1 >12 && hour <=18) {
    console.log("Boa tarde")

}
else{
    console.log("Boa NOite")
}

// Switch Case

let option = 6
switch (option){
    case 1:
        console.log("Consultar Pedido")
        break
    case 2:
        console.log("Falar com Atendente")        
        break
        default:
            console.log("Opção Invalida")
    }
//

// Tratamento de Excecões - uma exceção e uma condição ou evento imprevisto, algo que ocorre e que interrompe o fluxo normal das operações
// tentativa de abrir um arquivo que ano existe,conectar um banco de dados nao disponivel...


/* try {
    console.log(result)
    //tenta executar algo
 } catch (error){
    console.log(error)
//Captura o erro para tratar
//console.log("Não foi possivel executar o seu pedido, tenta mais tarde novamente")
 } finally{
    console.log("FIM")
    
}*/

let result = 0

try{
    if(result ===0){
        throw new Error (" o valor é igual a 0")
            }
        }
    catch (error){
        console.log(error)
    }
    finally{
        console.log("Fim")
    }





