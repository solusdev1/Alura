import Input from '../Input';
import styled from 'styled-components';
import { useState } from 'react'; //
import { livros } from './dadospesquisa';

const PesquisaContainer = styled.section`
        marging-top: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: none;
        padding: 80px 0;
        width: 100%;
        min-height: calc(100vh - 80px);
`

const Titulo = styled.h2`
        color: #FFF;
        font-size: 36px;
        text-align: center;
        width: 100%;
        margin-bottom: 20px;
`

const Subtitulo = styled.h3`
        color: #FFF;
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 40px;
`

const ResultadoContainer = styled.div`
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
        margin-top: 40px;
        width: 100%;
        max-width: 1200px;
        padding: 0 20px;
        
`

const LivroCard = styled.div`
     
       display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    cursor: pointer;
    p {
        width: 200px;
    }
    img {
        width: 100px;
    }
    &:hover {
        border: 1px solid white;
    }
        
`

function Pesquisa() {
  
  const[livrosPesquisados, setLivrosPesquisados] = useState([]); //Estado para armazenar os livros pesquisados
 
  return(
   <PesquisaContainer>
    <Titulo>Já sabe por onde começar ?</Titulo>
    <Subtitulo>Encontre em nossa estante </Subtitulo>
    <Input placeholder="Escreva sua próxima leitura" 
     onBlur={evento => {
      const textoDigitado = evento.target.value
      const resultadoPesquisa = livros.filter( livro => livro.titulo.toLowerCase().includes(textoDigitado.toLowerCase()) )
      setLivrosPesquisados(resultadoPesquisa)
  }}/>
  {livrosPesquisados.length > 0 && (
    <ResultadoContainer>
      {livrosPesquisados.map(livro => (
        <LivroCard key={livro.id || livro.titulo}>
          <p><strong>{livro.titulo}</strong></p>
          <p><strong>{livro.autor}</strong></p>
          <p><strong>{livro.preco}</strong></p>
          <img src={livro.src} alt={livro.titulo} />
        </LivroCard>
      ))}
    </ResultadoContainer>
  )}
    </PesquisaContainer>
  );
}
export default Pesquisa;
