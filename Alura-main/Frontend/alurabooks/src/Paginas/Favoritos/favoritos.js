import styled from 'styled-components';
import React from 'react';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color:#fff;
    `;
function Favoritos() {
    return (
        <Container>
            <h1>Favoritos</h1>
        </Container>
    )
}
export default Favoritos;