import Input from '../Input';
import styled from 'styled-components';
import { useState } from 'react'; //
import { livros } from './dadospesquisa';

const PesquisaContainer = styled.div`
        background-image: linear-gradient(90deg, #002F52 35%, #326589);
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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
     
     background-color: #fff;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  img {
    width: 100%;
    max-width: 200px; /* Mantém as capas dos livros com tamanho padrão */
    height: 200px;
    object-fit: cover;
    border-radius: 5px;
  }

  h2 {
    font-size: 18px;
    margin: 10px 0;
    color: #333;
  }

  p {
    font-size: 14px;
    color: #666;
  }
`
function Link(props) { // Função para criar um link para o livro
  return (
    <a href={props.to} className="link-livro"> 
      {props.children} 
    </a> // children é o conteúdo do link que será exibido
  )
}
function Pesquisa() { // a função Pesquisa é responsável por criar o componente de pesquisa e o que será exibido no componente de pesquisa é o titulo, o subtitulo, o input e o resultado da pesquisa 
  
  const[livrosPesquisados, setLivrosPesquisados] = useState([]); //Estado para armazenar os livros pesquisados - usestate é uma função que cria um estado e retorna um array com o estado e a função para atualizar o estado
  const[nenhumLivroEncontrado, setNenhumLivroEncontrado] = useState(false); //Estado para armazenar se nenhum livro foi encontrado e se não foi encontrado, exibe a mensagem de nenhum livro encontrado, esse estado é atualizado quando 
  // o usuário digita um texto no input e o texto digitado é comparado com o array de livros pesquisados e se não for encontrado nenhum livro, o estado é atualizado para true e exibe a mensagem de nenhum livro encontrado

  return(

   <PesquisaContainer>
    <Titulo>Já sabe por onde começar ?</Titulo>
    <Subtitulo>Encontre em nossa estante </Subtitulo>
    <Input placeholder="Escolha seu próximo livro"
     onBlur={(evento) => { 
      const textoDigitado = evento.target.value 
      if (!textoDigitado) { 
        setLivrosPesquisados([]); //Limpa o array de livros pesquisados
        setNenhumLivroEncontrado(false); //Limpa o estado de nenhum livro encontrado
        return; 
      }
      const resultadoPesquisa = livros.filter( livro => livro.titulo.toLowerCase().includes(textoDigitado.toLowerCase()) ) 
      setLivrosPesquisados(resultadoPesquisa) //Armazena os livros pesquisados no estado
      setNenhumLivroEncontrado(resultadoPesquisa.length === 0) //Armazena se nenhum livro foi encontrado no estado
  }}/>

  

  {/* Se o array de livros pesquisados tiver mais de 0 livros, exibe os livros pesquisados */}
  {livrosPesquisados.length > 0 && (
    <ResultadoContainer>
      
      {livrosPesquisados.map(livro => ( // Map é um método que percorre o array de livros e cria um link para cada livro
        <Link to={`/livros/${livro.id}`} key={livro.id} className="link-livro"> 
        <LivroCard key={livro.id || livro.titulo}>
          <img src={livro.src} alt={livro.titulo} />
          <p><strong>{livro.titulo}</strong></p>
          <p><strong>{livro.autor}</strong></p>
          <p><strong>{livro.preco}</strong></p>
        </LivroCard> 
        </Link> 
        //Esse bloco de código é responsável por criar o link para o livro e o card do livro e exibir os dados do livro que estão no array de livros pesquisados sendo assim cada livro será exibido em um card diferente
      ))} 

    </ResultadoContainer> 
  )}
    {nenhumLivroEncontrado && ( //Se nenhum livro foi encontrado, exibe a mensagem de nenhum livro encontrado
      <p style={{color: 'red',marginTop: '16px', textAlign: 'center'}}>
      Lamentamos, mas não encontramos nenhum livro com o nome digitado.</p>
    )} 
    
 
  </PesquisaContainer>
  ) 
} 
export default Pesquisa;
