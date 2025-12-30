import styled from 'styled-components';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const textoOpcoes = ["Home","Categorias","Destaques", "Novidades", "Mais Vendidos", "Minha Estante", "Favoritos"]; //Array para armazenar as opções do header
const dropdownOpcoes = { //Objeto para armazenar as opções do dropdown
  Home:[{label:"Home", icon:"🏠", path:"/"}],
  Categorias: [{label:"Livros", icon:"📚", path:"/livros"}],
  Destaques: [{label:"Destaques da Semana", icon:"🔥", path:"/destaques"}],
  Novidades: [{label:"Novidades da Semana", icon:"🆕", path:"/novidades"}],
  "Mais Vendidos": [{label:"Mais Vendidos da Semana", icon:"💰", path:"/mais-vendidos"}],
  "Minha Estante": [{label:"Minha Estante", icon:"🗂️", path:"/minha-estante"}],
  Favoritos: [{label:"Favoritos da Semana", icon:"🤍", path:"/favoritos"}],

};



const Opcoes = styled.ul` //Componente para estilizar o header
  display: flex;
  align-items: center;
  list-style: none;
  gap: 50px;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
`;
const Opcao = styled.li` //Componente para estilizar o header
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
  padding: 0 5px;
  cursor: pointer;
  list-style: none;
  gap: 50px;
`;
const Dropdown = styled.ul` //Componente para estilizar o dropdown
  position: absolute;
  top: 100%;
  margin-top: 8px;
  background: white;
  border: 1px solid #ccc;
  list-style: none;
  padding: 0;
  width: 160px;
`;

const ItemDropdown = styled.li` //Componente para estilizar o dropdown
  padding: 10px;
  text-align: center;

  &:hover {
    background-color:rgb(255, 255, 255);
  }
`;

function OpcoesHeader() { //Componente para exibir o header
  const [menuAberto, setMenuAberto] = useState(null); //Estado para armazenar o menu aberto

  function toggleMenu(texto) { //Função para alternar o menu aberto
    setMenuAberto(menuAberto === texto ? null : texto); //Se o menu estiver aberto, fecha o menu, se não, abre o menu
  }

  return ( //Componente para exibir o header
    <Opcoes> 
      {textoOpcoes.map((texto) => (
        <Opcao key={texto} onClick={() => toggleMenu(texto)}> 
          <p>{texto}</p>

          {menuAberto === texto && ( //Se o menu estiver aberto, exibe o dropdown
            <Dropdown>
              {dropdownOpcoes[texto].map((opcao) => ( //Se o menu estiver aberto, exibe o dropdown
                <ItemDropdown key={opcao.path}>
                  <Link to={opcao.path}>{opcao.label}</Link>

                </ItemDropdown> //Se o menu estiver aberto, exibe o dropdown
              ))}
              
            </Dropdown> //Se o menu estiver aberto, exibe o dropdown
          )}
        </Opcao>
      ))}
    </Opcoes>
  );
}

export default OpcoesHeader;