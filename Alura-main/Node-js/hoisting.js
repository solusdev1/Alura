//Hoisting - içamento o javascript "iça" as declarações de variáveis e funções para o topo do escopo antes da execução do código.
console.log(idade);
var idade = 34;
console.log(idade);
//No caso do var, a declaração é içada, mas a atribuição não. Por isso, a primeira vez que tentamos acessar a variável idade, ela é undefined. Depois da atribuição, ela tem o valor 34.

//Com let e const, o comportamento é diferente. Elas não são içadas da mesma forma que o var. Tentar acessar uma variável declarada com let ou const antes de sua declaração resulta em um erro de referência.
console.log(altura)
let altura = 1.75;

