const express = require("express")  
const server = express() //criando o servidor
server.use(express.static("public")) //usando o express para servir arquivos estáticos
server.listen(3333, () => { //escutando a porta 3333
console.log("Servidor está iniciando...")
console.log(`🚀🔥 Servidor está rodando na porta ${3333}`)
})
//

server.get("/", (req, res) => { //rota para a pagina inicial
    return res.render("index.html", {title: "Um TItulo"})
})  //rota para a pagina inicial, req é a requisição e res é a resposta
server.get("/create-point", (req, res) => { //rota para a pagina de criação de ponto

    return res.render("creat-point.html")
})  //rota para a pagina de criação de ponto, req é a requisição e res é a resposta
// utilizando template Engine para renderizar o html
const nunjucks = require("nunjucks")
nunjucks.configure("src/views", {
    express: server,
    noCache: true,
})


