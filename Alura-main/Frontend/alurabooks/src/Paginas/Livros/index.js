import styled from "styled-components";
import React from 'react';
import {livros} from '../../componentes/Pesquisa/dadospesquisa';



const Container = styled.section`
  display: grid;
  /* Cria uma grade responsiva: colunas de no mínimo 200px. 
     O auto-fill garante que eles fiquem um ao lado do outro. */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
`;

const LivroCard = styled.div `
  background-color: #FFF;
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
    max-width: 150px; /* Mantém as capas dos livros com tamanho padrão */
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
`;



const listaLivros = livros;



function LivrosContainer() {
  return (
    <Container>
      {listaLivros.map(livro => (
        <LivroCard key={livro.id}>
          <img src={livro.src} alt={livro.titulo} />
          <h2>{livro.titulo}</h2>
          <p>{livro.autor}</p>
          <p><strong>{livro.preco}</strong></p>
        </LivroCard>
      ))}
    </Container>
  );
}



export default LivrosContainer;
