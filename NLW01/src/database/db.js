//importando o sqlite3
const sqlite3 = require("sqlite3").verbose()
//criando o banco de dados
const db = new sqlite3.Database("./src/database/database.db") 
  //criando a tabela
db.serialize(() => {
  //criando a tabela
  db.run(`
    CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT,
    name TEXT,
    address TEXT,
    address2 TEXT,
    state TEXT,
    city TEXT,
    items TEXT 
   );
   `)	
   
  
  //inserindo os dados na tabela
  //criando a query
  const query = `
  INSERT INTO places (
  image, 
  name,
   address,
    address2, 
    state, 
    city,
     items) VALUES (?, ?, ?, ?, ?, ?, ?);
  `

  const values = ["image", "Colectoria", "Guilher Gemballa, Jardim América", "Numero 260", "Santa Catarina", "Rio do Sul", "Residuos Organicos"]
  //função para inserir os dados na tabela
  function afterInsertData(error){
    //se houver erro, retorna o erro
    if (error) {
      return console.log(error)
    }
    //se não houver erro, retorna a mensagem de sucesso
    console.log("Cadastrado com sucesso")
    //retorna o this, que é o resultado da query    
    console.log(this) 
    

  }

  //executa a query
  //db.run(query,values,afterInsertData) //db.run é uma função que executa a query e retorna o resultado  
  //fecha o banco de dados
 //db.close é uma função que fecha o banco de dados
  db.run(query,values,afterInsertData) //db.run é uma função que executa a query e retorna o resultado
  //fecha o banco de dados
  db.close() //db.close é uma função que fecha o banco de dados 
})

