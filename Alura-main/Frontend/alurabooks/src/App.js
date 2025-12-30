
import Logo from './componentes/Logo';
import OpcoesHeader from './componentes/Opcoes-Header';
import IconesHeader from './componentes/Icones-Header';
import styled from 'styled-components';
import Pesquisa from './componentes/Pesquisa';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Destaques from './Paginas/Destaques/destaques';
import Novidades from './Paginas/Novidades/novidades';
import MaisVendidos from './Paginas/MaisVendidos/maisvendidos';
import MinhaEstante from './Paginas/MinhaEstante/minhaestante';
import Favoritos from './Paginas/Favoritos/favoritos';
import Livros from './Paginas/Livros/index';
import Cursos from './Paginas/Cursos/index';


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

const AppContainer = styled.div`
  
  width: 100vw;
  height: 100vh;
  background-image: linear-gradient(90deg, #002F52 35%, #326589);
`;



function App() {
  return (
    <BrowserRouter>
      <Header>
        <Logo />
        <OpcoesHeader /> 
        <IconesHeader />
      </Header>
      <Routes>
        <Route path="/" element={
          <AppContainer>
            <Pesquisa />
          </AppContainer>
        } />
        <Route path="/livros" element={<Livros />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/destaques" element={<Destaques />} />
        <Route path="/novidades" element={<Novidades />} />
        <Route path="/mais-vendidos" element={<MaisVendidos />} />
        <Route path="/minha-estante" element={<MinhaEstante />} />
        <Route path="/favoritos" element={<Favoritos />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;