// Aqui estamos importando o módulo 'http' do Node.js. Esse módulo permite criar servidores web que podem receber e responder a requisições da internet.
import http from "node:http"
import { jsonBodyHandler } from "./middlewares/jsonBodyHandler.js"
import { json } from "node:stream/consumers"
import { routeHeandler } from "./middlewares/routeHeandler.js"
// Agora, criamos um servidor HTTP. Pense nele como um atendente que fica esperando pedidos (requisições) dos usuários e responde a eles.
const server = http.createServer(async(request, response) => {
  

  // Usamos o middleware para tratar o corpo da requisição como JSON
  await jsonBodyHandler(request, response)
  routeHeandler(request, response)
  // Se nenhuma das opções acima for verdadeira, significa que a URL não existe, então respondemos com erro 404 (não encontrado).
  // É importante sempre responder algo, senão o usuário fica esperando para sempre.
  
  
})

// Definimos em qual porta o servidor vai "escutar" as requisições. Porta 3333 é como um canal de comunicação.
const PORT = 3333

// Finalmente, ligamos o servidor na porta escolhida. Quando estiver pronto, mostramos uma mensagem no console.
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})
