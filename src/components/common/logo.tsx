import React, { MouseEvent } from 'react';
import styled from 'styled-components';

import { themeBreakPoints } from '../../themes/commons';
import logo1 from "../../assets/logo.png"

interface Props {
    image: React.ReactNode;
    text: string;
    textColor?: string;
    onClick: (event: MouseEvent) => void;
}

const LogoLink = styled.a<any>`
    align-items: center;
    cursor: pointer;
    display: flex;
    height: 33px;
    font-family: 'Inter var', sans-serif;
    text-decoration: none;
`;

const LogoText = styled.h1<{ textColor?: string }>`
    color: ${props => props.textColor};
    display: none;
    font-size: 18px;
    font-weight: 500;
    margin-left: 10px;
    text-decoration: none;

    @media (min-width: ${themeBreakPoints.xxl}) {
        display: block;
    }
`;
const LogoBox = styled.div`
    width:40px;
    height:40px;
    overflow:hidden;
`;
const LogoImg = styled.img`
    width:175px;
    height:40px;
`;
LogoText.defaultProps = {
    textColor: '#000',
};

export const Logo: React.FC<Props> = props => {
    const { image, text, textColor, onClick, ...restProps } = props;
    return (
        <LogoLink onClick={onClick} {...restProps}>
            {/* {image} */}
            {/* <img src={logo1} alt="logo"/> */}
            <LogoBox>
                <LogoImg src={logo1} alt="logo"></LogoImg>
            </LogoBox>
            <LogoText textColor={textColor}>{text}</LogoText>
        </LogoLink>
    );
};
