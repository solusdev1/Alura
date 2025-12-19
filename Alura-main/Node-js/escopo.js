/*let estudante; //declaração de variavel
if(1>0) //condição
{
     estudante = 'Carolina'; //atribuição de valor
    console.log(estudante); //impressão de valor
}

console.log(estudante); //impressão de valor

/*const nome = 'Alice'; //declaração de variavel
console.log(`Olá, meu nome é ${nome}.`); //impressão de valor

if (1 > 0) { //condição
    var nome1 = 'David'; //atribuição de valor
    let nome = 'Ana'; //atribuição de valor
    //console.log(nome); 
  }// uma let dentro de um if, nao é acessível fora do if ao contrario de uma var que é acessível fora do if
  console.log(`Olá, meu nome é ${nome1} e ${nome}`); //impressão de valor
  // */
  
  /*const nome = 'Camila'; // variável global

function cumprimentar() {
  console.log(`Olá, ${nome}!`); // Acessa a var global
}

cumprimentar(); // ‘Olá, Camila!”
/*
if (1 > 0) {
    let nome = ‘Ana’;
    console.log(nome); // ‘Ana’
  }
  
  // variável `nome` não está acessível
  console.log(nome); // Error: nome is not defined 

  if (1 > 0) {
  var nome = 'Ana';
  console.log(nome); // ‘Ana’
}
*/

function cumprimentar() {
    const nome = 'Camila'; // variável local
    const cumprimento = 'Olá'; // variável local
    console.log(`${cumprimento}, ${nome}!`); // imprime "Olá, Camila!"
  }
  
  // as variáveis não podem ser acessada de fora da função
  //console.log(`${cumprimento}, ${nome}!`); // Dará erro de "not defined" no console
  cumprimentar();