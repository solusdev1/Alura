import styled from 'styled-components';
import React from 'react';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color:rgb(245, 24, 24);
    `;

function Destaques() {
    return (
        <Container>
            <h1>Destaques da Semana</h1>
        </Container>
    )
}
export default Destaques;