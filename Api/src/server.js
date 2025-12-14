// Aqui estamos importando o módulo 'http' do Node.js. Esse módulo permite criar servidores web que podem receber e responder a requisições da internet.
import http from "node:http"
import { jsonBodyHandler } from "./middlewares/jsonBodyHandler.js"
import { json } from "node:stream/consumers"
// Agora, criamos um servidor HTTP. Pense nele como um atendente que fica esperando pedidos (requisições) dos usuários e responde a eles.
const server = http.createServer(async(request, response) => {
  // Pegamos duas informações importantes da requisição: o método (como GET ou POST) e a URL (o endereço que o usuário está acessando).
  const {method, url} = request
  // Usamos o middleware para tratar o corpo da requisição como JSON
  await jsonBodyHandler(request, response)

  // Verificamos se o usuário está fazendo uma requisição GET (para buscar dados) e se a URL é "/products" (produtos).
  if(method === "GET" && url ===  "/products") {
    // Se for isso, respondemos com uma mensagem simples listando produtos e encerramos a resposta.
    return response.end("lista de produtos")
  }


  // Agora, verificamos se é uma requisição POST (para enviar dados) para "/products".
  if(method === "POST" && url === "/products"){    
     
        // Respondemos com status 201 (que significa "criado com sucesso") e uma mensagem dizendo que o produto foi cadastrado.
    return response.writeHead(201).end(JSON.stringify(request.body))
  }
  // Se nenhuma das opções acima for verdadeira, significa que a URL não existe, então respondemos com erro 404 (não encontrado).
  // É importante sempre responder algo, senão o usuário fica esperando para sempre.
  return response.writeHead(404).end("URL Not Found : " + url)
})

// Definimos em qual porta o servidor vai "escutar" as requisições. Porta 3333 é como um canal de comunicação.
const PORT = 3333

// Finalmente, ligamos o servidor na porta escolhida. Quando estiver pronto, mostramos uma mensagem no console.
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})
