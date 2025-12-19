// Passo 1: Importar o módulo HTTP do Node.js
// Este módulo nos permite criar um servidor web que pode receber pedidos da internet
// "import" traz código de outro arquivo, "from" especifica de onde
import http from "node:http"

// Passo 2: Criar o servidor
// "const" declara uma variável que não pode ser mudada depois
// "http.createServer" é uma função que cria o servidor
// O parâmetro é uma função anônima (arrow function) que será chamada para cada pedido
const users = []
const server = http.createServer((request, response) => {
    // Passo 3: Pegar informações do pedido
    // "const" novamente declara variável constante
    // "{ method, url }" é desestruturação: pega essas propriedades do objeto request
    const { method, url } = request
    console.log(request.headers)
    if (method === "GET" && url === "/users") {
  return response.setHeader("Content-Type", "application/json")
  .end(JSON.stringify(users, null, 2))

}

if (method === "POST" && url === "/users") {
  users.push({
    id: 1,
    name: "João",
    email: "j@j.com",
  })
  
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end("Criar um usuário")
  return
}

    // Passo 4: Mostrar no console o que recebemos (para testar)
    // "console.log" imprime no terminal
    // `${method} ${url}` é template literal: permite inserir variáveis com ${}
    console.log(`Recebi um pedido: ${method} ${url}`)

    // Passo 5: Responder ao usuário
    // "response.end" envia a resposta e fecha a conexão
    response.end("Olá Mundo! Bem-vindo ao meu servidor!")
})

// Passo 6: Escolher uma porta para o servidor
// Porta é como um "canal" onde o servidor vai ficar esperando pedidos
// "const" declara a porta como constante (não muda)



const PORT = 3333

// Passo 7: Ligar o servidor na porta escolhida
// "server.listen" é um método (função) do objeto server
// Recebe a porta e uma função callback que roda quando estiver pronto
server.listen(3333, "127.0.0.1", () => {
  console.log("SERVIDOR ATIVO NA 3333")
})

// evita o processo morrer
setInterval(() => {}, 1000)

process.on("SIGINT", () => {
  console.log("Processo morreu")
  process.exit()
})
