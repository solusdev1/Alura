import logo from '../../imagens/logo.svg';
import { Link } from 'react-router-dom';
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
      <Link to="/">
      <LogoImg src={logo} alt="logo" />
      </Link>
     
      <p><strong>Solus Books</strong></p>
   
    </LogoHeader>
  )
}

export default Logo;