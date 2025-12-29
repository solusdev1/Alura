
import Logo from './componentes/Logo';
import OpcoesHeader from './componentes/Opcoes-Header';
import IconesHeader from './componentes/Icones-Header';
import styled from 'styled-components';
import Pesquisa from './componentes/Pesquisa';
const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-image: linear-gradient(90deg, #002F52 35%, #326589);
`;

const Header = styled.header`
  background-color: #FFF;
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: fixed;
  top: 0;
  width: 100vw;
  height: 80;


`;

  


function App() {
  return (
          <AppContainer>
          <Header>
          <Logo />
          <OpcoesHeader />
          <IconesHeader />
        </Header>
        <Pesquisa />
      </AppContainer>
  );
}

export default App;
