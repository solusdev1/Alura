const idade = 20
idade >= 18 ? console.log("Maior de idade") : console.log("Menor de idade"); // operador ternário 

const notaDoALuno = 7;
notaDoALuno >= 9 ? console.log("Quadro de Honra"):
  notaDoALuno >= 7 ? console.log("Aprovado") :
  notaDoALuno >= 5 ? console.log("Recuperação") :
  console.log("Reprovado");
  // operador ternário encadeado
// condição ? true : false
const notaDoAluno2 = 4;
if (notaDoAluno2 >= 9) {
  console.log("Quadro de Honra");
} else if (notaDoAluno2 >= 7) {
  console.log("Aprovado");
} else if (notaDoAluno2 >= 5) {
  console.log("Recuperação");
} else {
  console.log("Reprovado");
}
// estrutura if else tradicional