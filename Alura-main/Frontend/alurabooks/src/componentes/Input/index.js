import styled from "styled-components"

const Input = styled.input`
        border: 1px solid #000;
        background: transparent;
        border: 1px solid #000000;
        padding: 20px 140px;
        border-radius: 50px;
        width: 200px;
        color: #000;
        font-size: 10px;
        margin-bottom: 10px;

        &::placeholder {
                color: #000;
                font-size: 16px;
        }
`

export default Input