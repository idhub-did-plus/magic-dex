import React from 'react';
import { connect } from 'react-redux';
import ReactSVG from 'react-svg';
import styled, { withTheme } from 'styled-components';

import { ReactComponent as LogoSvg } from '../../../assets/icons/erc20_logo.svg';
import { Config } from '../../../common/config';
import { UI_GENERAL_TITLE } from '../../../common/constants';
import { Logo } from '../../../components/common/logo';
import { separatorTopbar, ToolbarContainer } from '../../../components/common/toolbar';
import { NotificationsDropdownContainer } from '../../../components/notifications/notifications_dropdown';
import { goToHome, goToWallet } from '../../../store/actions';
import { Theme, themeBreakPoints } from '../../../themes/commons';
import { WalletConnectionContentContainer } from '../account/wallet_connection_content';
import { ThemeSelectionContentContainer } from '../../theme/theme_selection_content';
import { selectTheme } from '../../../store/ui/actions';

import { SettingDropdownContainer } from '../../setting/setting_dropdown';
import { MarketsDropdownContainer } from './markets_dropdown';
import imgURL from "../../../assets/sun@2x.png"
import imgURL1 from "../../../assets/moon@2x.png"

interface DispatchProps {
    onGoToHome: () => any;
    onGoToWallet: () => any;
    onThemeSelected: (theme: string) => any;
}


interface OwnProps {
    theme: Theme;
}

type Props = DispatchProps & OwnProps;

const MyWalletLink = styled.a`
    align-items: center;
    color:rgba(148,154,161,1);
    display: flex;
    font-size: 14px;
    text-decoration: none;
    margin-left: 17px;
    ${separatorTopbar}
`;

const LogoHeader = styled(Logo)`
    &:after {
        background-color: ${props => props.theme.componentsTheme.cardBorderColor};
        content: '';
        height: 80px;
        margin-left: 174px;
        width: 1px;
    }
`;

const LogoSVGStyled = styled(LogoSvg)`
    path {
        fill: ${props => props.theme.componentsTheme.logoERC20Color};
    }
`;

const MarketsDropdownHeader = styled<any>(MarketsDropdownContainer)`
    align-items: center;
    display: flex;
    width: 300px;
`;

// const ThemeDropdown = styled(ThemeSelectionContentContainer)`
//     display: none;

//     @media (min-width: ${themeBreakPoints.sm}) {
//         align-items: center;
//         display: flex;

//         ${separatorTopbar}
//     }
// `;
const ThemeDropdown = styled.div`
    width:24px;
    height:24px;
    margin-left:17px;
    margin-right:17px
`;
const WalletDropdown = styled(WalletConnectionContentContainer)`
    display: none;

    @media (min-width: ${themeBreakPoints.sm}) {
        align-items: center;
        display: flex;

        ${separatorTopbar}
    }
`;
const SecondToolbarContainer = styled.div`
    height: 40px;
    width: 100%;
    display: flex;
    justify-content: flex-start; 
    align-items: center;
    padding: 0 17px;
    background: ${props => props.theme.componentsTheme.background};
`;
const LineLeft = styled.div`
    display: inline-block;
    border-left: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    width: 5px;
    height: 80px;
`
const LineRight = styled.div`
    border-right: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    width: 5px;
    height: 80px;
`


const ToolbarContent = (props: Props) => {
    const handleLogoClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        props.onGoToHome();
    };
    const generalConfig = Config.getConfig().general;
    const logo = generalConfig && generalConfig.icon ? <ReactSVG src={generalConfig.icon} /> : <LogoSVGStyled />;

    const handleLightClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        window.document.getElementsByTagName("img")[1].style.display = "none";
        window.document.getElementsByTagName("img")[2].style.display = "block";
        props.onThemeSelected('LIGHT_THEME')
    };
    const handleDarkClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        window.document.getElementsByTagName("img")[1].style.display = "block";
        window.document.getElementsByTagName("img")[2].style.display = "none";
        props.onThemeSelected('DARK_THEME')
    };
    const startContent = (
        <>
            <LogoHeader
                image={logo}
                onClick={handleLogoClick}
                text={(generalConfig && generalConfig.title) || UI_GENERAL_TITLE}
                textColor={props.theme.componentsTheme.logoERC20TextColor}
            />
          
            <ThemeDropdown>
                <img style={{width:'100%',height:'100%',cursor:'pointer'}} src={imgURL} alt="加载失败" onClick={handleLightClick}/>
                <img style={{width:'100%',height:'100%',cursor:'pointer',display:'none'}} src={imgURL1} alt="加载失败" onClick={handleDarkClick}/>
            </ThemeDropdown>
            <LineLeft />
        </>
    );
   

    const handleMyWalletClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        props.onGoToWallet();
    };
    const endContent = (
        <>
            <LineRight />
            <MyWalletLink href="/my-wallet" onClick={handleMyWalletClick}>
                My Wallet
            </MyWalletLink>
            <WalletDropdown></WalletDropdown>
            <NotificationsDropdownContainer />
        </>
    );

    return (
        <div className="toolBarBox">
            <ToolbarContainer startContent={startContent} endContent={endContent} /> 
            <SecondToolbarContainer>
                <MarketsDropdownHeader shouldCloseDropdownBodyOnClick={false}/>
                <LineRight style={{height:'40px',marginLeft:"29px",marginRight:"20px"}}/>
                <SettingDropdownContainer/>
            </SecondToolbarContainer>
            
        </div>
       
    );
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onGoToHome: () => dispatch(goToHome()),
        onGoToWallet: () => dispatch(goToWallet()),
        onThemeSelected: (theme: string) => dispatch(selectTheme(theme)),
    };
};

const ToolbarContentContainer = withTheme(
    connect(
        null,
        mapDispatchToProps,
    )(ToolbarContent),
);

export { ToolbarContent, ToolbarContentContainer };
