import http  from "node:http"




const server = http.createServer((request, response) => {
    return response.end("Olá Mundo")
})

server.listen(3334, () => {
  console.log(`🚀 Servidor rodando na porta 3333`)
})
