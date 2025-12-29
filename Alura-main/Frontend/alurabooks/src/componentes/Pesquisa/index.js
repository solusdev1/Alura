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
         background-image: linear-gradient(90deg, #002F52 35%, #326589);
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
     
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
       gap: 10px;
       justify-content: center;
       align-items: center;
       margin-bottom: 20px;
       cursor: pointer;
       border: 1px solid transparent;
       border-radius: 10px;
       padding: 10px;
       box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
       transition: all 0.3s ease;
       &:hover {
        border: 1px solid white;
        transform: scale(1.05);
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2);
       }
       
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
    <Input placeholder="Escolha seu próximo livro"
     onBlur={evento => { 
      const textoDigitado = evento.target.value 
      if (!textoDigitado) {
        setLivrosPesquisados([]);
        return;
      }
      const resultadoPesquisa = livros.filter( livro => livro.titulo.toLowerCase().includes(textoDigitado.toLowerCase()) )
      setLivrosPesquisados(resultadoPesquisa) 
  }}/>
  {livrosPesquisados.length > 0 && (
    <ResultadoContainer>
      {livrosPesquisados.map(livro => (
        <LivroCard key={livro.id || livro.titulo}>
          <img src={livro.src} alt={livro.titulo} />
          <p><strong>{livro.titulo}</strong></p>
          <p><strong>{livro.autor}</strong></p>
          <p><strong>{livro.preco}</strong></p>
        </LivroCard>
      ))}
    </ResultadoContainer>
  )}
    </PesquisaContainer>
  );
}
export default Pesquisa;
