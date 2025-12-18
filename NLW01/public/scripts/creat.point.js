// Este arquivo contém JavaScript para carregar estados (UFs) e cidades do Brasil usando a API do IBGE.
// É usado na página de criação de ponto de coleta.

// Função para preencher o select de estados (UFs)
function populateUFs() {
  // Seleciona o elemento select que tem o atributo name="uf"
  const ufSelect = document.querySelector("select[name=uf]");

  // Faz uma requisição para a API do IBGE que retorna todos os estados
  fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
    .then((res) => {
      return res.json();
    }) // Converte a resposta para JSON
    .then((states) => {
      // Recebe a lista de estados
      // Para cada estado na lista, adiciona uma opção no select
      states.sort((a, b) => a.nome.localeCompare(b.nome));
      for (const state of states) {
        ufSelect.innerHTML += `<option value="${state.id}">${state.nome}</option>`;
      }
    });
}

// Chama a função para preencher os estados assim que o script carrega
populateUFs();

// Função chamada quando o usuário muda a seleção do estado
function getCities(event) {
  // Seleciona o select de cidades
  const citySelect = document.querySelector("select[name=city]");
  // Seleciona o input hidden para armazenar o nome do estado
  const stateInput = document.querySelector("input[name=state]");

  // Pega o valor do estado selecionado (ID do estado)
  const ufValue = event.target.value;
  // Pega o índice da opção de estado selecionada
  const indexOfSelectedState = event.target.selectedIndex;
  // Define o valor do input hidden como o texto da opção selecionada (nome do estado)
  stateInput.value = event.target.options[indexOfSelectedState].text;

  // Monta a URL para buscar as cidades do estado selecionado
  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufValue}/municipios`;
  // Faz a requisição para a API
  fetch(url)
    .then((res) => {
      return res.json();
    }) // Converte para JSON
    .then((cities) => {
      // Recebe a lista de cidades
      // Para cada cidade, adiciona uma opção no select de cidades
      for (const city of cities) {
        citySelect.innerHTML += `<option value="${city.id}">${city.nome}</option>`;
      }

      // Habilita o select de cidades (remove o disabled)
      citySelect.disabled = false;

      // Habilita o botão de submit (remove o disabled)
      document.querySelector("button[type=submit]").disabled = false;
    });
}

// Adiciona um ouvinte de evento para quando o select de UF muda
document.querySelector("select[name=uf]").addEventListener("change", getCities);

//itens de coleta
// pegar todos os li'
const itemsToCollect = document.querySelectorAll(" .items-grid li");
// para cada li, adicionar um ouvinte de evento de click
for (const item of itemsToCollect) {
  item.addEventListener("click", handleSelectedItem);
  
}
const collectItemsInput = document.querySelector("input[name=items]");
let selectedItems = [];
function handleSelectedItem(event) {
  const itemLi = event.currentTarget;
  itemLi.classList.toggle("selected");
  console.log(event.currentTarget);
  const itemId = itemLi.dataset.id;
  
  const alreadySelected = selectedItems.findIndex( item => {
   const itemFound = item === itemId;
   return itemFound;
  });
 

if (alreadySelected >= 0) {
    const filteredItems = selectedItems.filter(function(item){
      return item !== itemId;
    });
    selectedItems = filteredItems;
  } else {
    selectedItems.push(itemId);
  }
  console.log(selectedItems);

  collectItemsInput.value = selectedItems;



}

