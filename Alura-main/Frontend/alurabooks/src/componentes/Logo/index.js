import logo from '../../imagens/logo.svg';

import styled from 'styled-components';

const LogoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;
const LogoImg = styled.img`
margin-right: 10px;
 cursor: pointer`;
 

function Logo() {
  return (
    <LogoHeader>
      <LogoImg src={logo} alt="logo" />
      <p><strong>Solus Books</strong></p>
    </LogoHeader>
  )
}

export default Logo;