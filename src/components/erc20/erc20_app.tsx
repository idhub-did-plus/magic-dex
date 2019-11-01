import React from 'react';
import { Route, Switch } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { StoreState } from '../../util/types';
import { ERC20_APP_BASE_PATH } from '../../common/constants';
import { AdBlockDetector } from '../../components/common/adblock_detector';
import { GeneralLayout } from '../../components/general_layout';
import { getThemeByName } from '../../themes/theme_meta_data_utils';

import { getTheme } from '../../store/selectors';
import { connect } from 'react-redux';
import { ToolbarContentContainer } from './common/toolbar_content';
import { Marketplace } from './pages/marketplace';
import { MyWallet } from './pages/my_wallet';
import { Theme } from '../../themes/commons';
import { string } from 'prop-types';

const toolbar = <ToolbarContentContainer />;

 const MyErc20App = (props:Props) => {
   // const themeColor = getThemeByMarketplace(MARKETPLACES.ERC20);

    return (
        <ThemeProvider theme={props.theme}>
            <GeneralLayout toolbar={toolbar}>
                <AdBlockDetector />
                <Switch>
                    <Route exact={true} path={`${ERC20_APP_BASE_PATH}/`} component={Marketplace} />
                    <Route exact={true} path={`${ERC20_APP_BASE_PATH}/my-wallet`} component={MyWallet} />
                </Switch>
            </GeneralLayout>
        </ThemeProvider>
    );
};

interface StateProps {
    theme: Theme;
}
type Props = StateProps;

const mapStateToProps = (state: StoreState): StateProps => {
    let t: string = getTheme(state);
    let theme:Theme = getThemeByName(t);

    return {
        theme: theme
    };
};
export const Erc20App = connect(
    mapStateToProps,
    null,
)(MyErc20App);
