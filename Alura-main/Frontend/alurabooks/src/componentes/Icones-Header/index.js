import perfil from '../../imagens/perfil.svg';
import sacola from '../../imagens/sacola.svg';
import styled from 'styled-components';


const Icone = styled.li`
  cursor: pointer;
  list-style: none;
`;
const Icones = styled.ul`
  display: flex;
  align-items: center;
  list-style: none;
  gap: 30px;
`;
const icones = [perfil, sacola];

function IconesHeader() {
  return (
    <Icones>
      {icones.map((icone) => (
        <Icone> 
          <img src={icone} alt="ícone" />
        </Icone>
      ))}
    </Icones>
  )
}
export default IconesHeader;