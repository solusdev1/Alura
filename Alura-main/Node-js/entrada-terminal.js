//readline é um módulo nativo do Node.js que permite ler dados de uma stream de forma interativa, como a entrada padrão (teclado).
const readline = require('readline'); // Importa o módulo readline
const leitor = readline.createInterface({ // Cria uma interface de leitura
  input: process.stdin,
  output: process.stdout
}); // Define a entrada e saída padrão
leitor.question('Qual o seu nome? ', (nome) => { // Faz uma pergunta ao usuário
  console.log(`Olá, ${nome}!`); // Responde com uma saudação
  leitor.question('Qual a sua idade? ', (idade) => { // Faz outra pergunta
   if (idade < 18) {
      console.log('Você é menor de idade.');
    } else {
      console.log('Você é maior de idade.');
    }
  leitor.close(); // Fecha a interface de leitura
});
}
);