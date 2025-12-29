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
function Novidades() {
    return (
        <Container>
            <h1>Novidades</h1>
        </Container>
    )
}
export default Novidades;