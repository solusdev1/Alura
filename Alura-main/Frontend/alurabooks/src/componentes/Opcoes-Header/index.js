import styled from 'styled-components';


const textoOpcoes = ['Categorias', 'Minha Estante', 'Favoritos'];



const Opcoes = styled.ul`
  display: flex;
  align-items: center;
  list-style: none;
  gap: 50px;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
`;
const Opcao = styled.li`
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
function OpcoesHeader() {
  return (
    <Opcoes>
    {textoOpcoes.map((texto) => (
      <Opcao>
        <p>{texto}</p>
      </Opcao>
    ))}
    </Opcoes>
  )
}
export default OpcoesHeader;