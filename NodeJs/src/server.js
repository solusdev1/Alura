import http  from "node:http"




const server = http.createServer((request, response) => {
    const { method, url } = request
    console.log(method, url)
    return response.end("Olá Mundo")
})

server.listen(3335, () => {
  console.log(`🚀 Servidor rodando na porta "3335")`)
  // 👇 ISSO EVITA O ERRO AO SALVAR
  
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Servidor encerrado corretamente")
    process.exit(0)
  })
})
})
