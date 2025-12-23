/*const pessoa = { // Objeto
  nome: 'Ana',
  idade: 5,
  temCNH: false
}
console.log(pessoa.nome)
pessoa.sobrenome = 'Silva'
console.log(pessoa.sobrenome)

const livro = {
  titulo: 'Harry Potter e a Pedra Filosofal',
  autor: 'J.K. Rowling',
  ano: 1997,
  editora: 'Rocco'
}
console.log(livro.autor)
livro.ano = 1998
console.log(livro.ano)
livro.idiomas  = ['Português', 'Inglês', 'Espanhol']
console.log(livro.idiomas)

livro.idiomas.push('Francês')
console.log(livro.idiomas)
console.log("Antes do delete:", livro.idiomas)
delete livro.idiomas[1]
console.log("Depois do delete:", livro.idiomas)
*/
const pessoa = {
  nome: 'Carlos',
  idade: 30,
  profissao: 'developer'
}



for(const chave in pessoa){
  console.log(chave, pessoa[chave])
  console.log(`${chave}: ${pessoa[chave]}`)
}

const chaves = Object.keys(pessoa)
const valores = Object.values(pessoa)
const entradas = Object.entries(pessoa)

console.log(entradas)

console.log(valores)
console.log(chaves)