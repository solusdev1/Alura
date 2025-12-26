/*const pessoa = {
  nome: 'Carlos',
  idade: 30,
  profissao: 'developer'
}
const outraPessoas = {
  ...pessoa,
  nome: 'Ana',
  idade: 25
}
console.log(outraPessoas) 

const habilidades = ['JavaScript', 'React', 'Node.js']
const maisHabilidades = ['TypeScript', 'GraphQL']
const todasHabilidades = [...habilidades, ...maisHabilidades]
console.log(todasHabilidades)
pessoa.habilidades = [...todasHabilidades]
console.log(pessoa)*/

const frutas = ['Banana', 'Maçã', 'Laranja'] // Array
const maisFrutas = ['Abacaxi', 'Manga']
const clone = {...frutas}
const todasFrutas = [...frutas, ...maisFrutas] // Spread operator é usado para "espalhar" os elementos de um array ou objeto
frutas.push('Uva')
console.log(frutas)
console.log(maisFrutas)
console.log(clone)
console.log(todasFrutas)

const{primeira,seunda,...restante} = todasFrutas // Rest operator é usado para agrupar o restante dos elementos em um array ou objeto
console.log(primeira)
console.log(seunda)
console.log(restante)