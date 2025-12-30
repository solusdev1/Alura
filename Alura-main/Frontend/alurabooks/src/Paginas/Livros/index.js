import styled from "styled-components";
import React from "react";
import { livros } from "../../componentes/Pesquisa/dadospesquisa";

const Container = styled.div`
  background-image: linear-gradient(to bottom, #002F52 35%, #326589);
  font-size: 16px;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
  max-width: auto;
  margin auto;
  margin-top: 100px;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 100px;
 
 
`;

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
`;

const listaLivros = livros;

function LivrosContainer() {
  return (
    <Container>
      {listaLivros.map((livro) => (
        <LivroCard key={livro.id}>
          <img src={livro.src} alt={livro.titulo} />
          <h2>{livro.titulo}</h2>
          <p>{livro.autor}</p>
          <p>
            <strong>{livro.preco}</strong>
          </p>
        </LivroCard>
      ))}
    </Container>
  );
}

export default LivrosContainer;
