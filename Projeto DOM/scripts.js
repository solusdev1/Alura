// visualizar o conteudo do document
//console.log(document)
//obter o title da pagina
/*console.log(document.title);
// acessar o elemento pelo ID (Seletor ID)
const guest = document.getElementById("guest-2")
console.log(guest);

// Mostra as propriedades do Objeto.
console.dir(guest)

//Acessar o Elemento com Class(Seletor Class)
const guestsbyClass = document.getElementsByClassName("guest")
console.log(guestsbyClass);
//exibir o primeiro elemento da lista
console.log(guestsbyClass.item (0))
console.log(guestsbyClass[1])

//Selecionar uma lista de elementos por tag
const guestsByTag = document.getElementsByTagName("li")
console.log(guestsByTag);

//
const guest1 = document.querySelector("#guest-1")
console.log(guest1);

//const guest2 = document.querySelector(".guest") // pra retornar os elementos na DOM
const guest2 = document.querySelectorAll(".guest") // o Selector com o All retorna todos que ele encontra
console.log(guest2);
//

// como manipular os elementos na DOM

const guest3 = document.querySelector("#guest-1 ")
console.log(guest3.textContent)// retorna o conteudo como Texto
//guest3.textContent = "Joao" muda o nome entro do ID

console.log(guest3.textContent)//Retornar o conteudo visivel e oculto
console.log(guest3.innerText)//Retornar como texto sem Formatação (apenas o conteudo visivel)
console.log(guest3.innerHTML)//Retorna o html como texto


//Adciona a classe com JS no 
const input = document.querySelector("#name")
input.classList.add("input-error")

// Remove  a Classe
//input.classList.remove("input-error")
// se nao tiver a classe adiciona, se tiver remove
//input.classList.toggle("input-error")

const button = document.querySelector("button")
// Modificar as Propriedades CSS do Elemento
button.style.backgroundColor = "red"
*/

// Selecionar o input do telefone
const phoneInput = document.querySelector("#phone")
const phoneError = document.querySelector("#phone-error")
const button = document.querySelector("button")

// Regex para validar formato de telefone brasileiro (ex: (11) 99999-9999 ou 11 99999-9999)
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

// Adicionar um event listener para validar o input do telefone
phoneInput.addEventListener("input", function() {
    const phoneValue = phoneInput.value.trim();

    // Verificar se o valor corresponde ao formato esperado
    if (phoneRegex.test(phoneValue)) {
        console.log('Telefone válido.');
        phoneInput.classList.remove("input-error");
        phoneError.textContent = "";
        button.disabled = false; // Habilitar botão
    } else {
        console.log('Telefone inválido.');
        phoneInput.classList.add("input-error");
        phoneError.textContent = "Telefone inválido. Use o formato: (XX) XXXXX-XXXX";
        button.disabled = true; // Desabilitar botão
    }
});

const guests = document.querySelector("ul")
const newGuest = document.createElement("li") 
newGuest.classList.add("guest")
//newGuest.("guest-3")
const guestname = document.createElement("span")
const guestSurName = document.createElement("span")
guestSurName.textContent = " Silva"
guestname.textContent = "David "
newGuest.id = "guest-3"
//append adciona após o ultimo filho
//newGuest.append(guestname)
//Prepend adciona antes do primeiro filho
//newGuest.prepend(guestSurName)
// é mais simples e aceita apenas um argumento
newGuest.append(guestname,guestSurName)
guests.append(newGuest)


/* let phone   = 0; // Exemplo: atribua um valor numérico aqui

// Comparação para verificar se 'number' é um número válido
if (typeof phone === 'number' && !isNaN(phone) && isFinite(phone)) {
    console.log('A variável number contém um número válido.');
} else {
    console.log('A variável number não contém um número válido.');
}
*/