/* // entre 9 e 10 - quadro de honra
// entre 7 e 8.9 - aprovado
// entre 5 e 6.9 - recuperação
// abaixo de 5 - reprovado
const notaDoAluno = 6; 
switch(notaDoAluno) {
  case 10:
  case 9:
    console.log("Quadro de Honra");
    break;
  case 8:
  case 7:
    console.log("Aprovado");
    break;
  case 6:
  case 5:
    console.log("Recuperação");
    break;
  default:
    console.log("Reprovado");  
    
  }
  // estrutura switch case semelhante a uma série de if else porem mais simplificada ele faz uma verificação estrita do valor da variável e compara com os valores definidos em cada case. Quando encontra uma correspondência, executa o bloco de código associado a esse case. Se nenhum case corresponder, o bloco default é executado.
  */

  console.log('Início');

setTimeout(() => {
  console.log('Tarefa assíncrona concluída');
}, 10);

console.log('Fim');