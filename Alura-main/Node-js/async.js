// Usando Promise
function fetchData() { // Simula uma operação assíncrona
  return new Promise((resolve, reject) => {// Simula um atraso de 1 segundo
    setTimeout(() => { // Simula sucesso na obtenção dos dados
      resolve('Dados obtidos'); // Para simular um erro, use: reject('Erro ao obter dados');
    }, 1000); // 1 segundo
  });
} // promise representa uma operação que será concluída no futuro, permitindo o tratamento de operações assíncronas de forma mais organizada.

fetchData() // Chamando a função que retorna a Promise
  .then(data => console.log(data)) // Manipula o sucesso
  .catch(error => console.error(error));// Manipula o erro

// Usando Async/Await
async function getData() { // Função assíncrona funciona como sintaxe açucarada para Promises
  try {   // Bloco try para capturar erros
    const data = await fetchData(); // Aguarda a resolução da Promise
    console.log(data); // Manipula o sucesso
  } catch (error) { // Captura erros
    console.error(error); // Manipula o erro
  }
} 

getData(); // Chamando a função assíncrona
 //funções assíncronas permitem que o código continue executando enquanto aguarda operações demoradas, como chamadas de rede ou leitura de arquivos, melhorando a eficiência e a responsividade do programa.

// Exemplo simples de setTimeout para demonstrar comportamento assíncrono
console.log('Início');

setTimeout(() => {
  console.log('Tarefa assíncrona concluída');
}, 1000); // Atraso de 1 segundo

console.log('Fim'); 
// A saída será:
// Início
// Fim
// Tarefa assíncrona concluída
// Isso mostra que o código continua executando enquanto a tarefa assíncrona está em andamento.