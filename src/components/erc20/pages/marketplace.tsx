import React, { Attributes } from 'react';

import { CheckMetamaskStateModalContainer } from '../../common/check_metamask_state_modal_container';
import { ColumnNarrow } from '../../common/column_narrow';
import { ColumnWide } from '../../common/column_wide';
import { Content } from '../common/content_wrapper';
import { BuySellContainer } from '../marketplace/buy_sell';
import { OrderBookTableContainer } from '../marketplace/order_book_otc';
import { OrderHistoryContainer } from '../marketplace/order_history';
import { FillOrderContainer } from '../marketplace/fill_order';
import { WalletBalanceContainer } from '../marketplace/wallet_balance';

interface State {
    LiquidationDisplay: string;
    PendingOrderDisplay: string;
}

interface ownProps {
    transfer:Attributes;
}

type Props = ownProps;

class Marketplace extends React.PureComponent<Props> {
    public state: State = {
        LiquidationDisplay: "none",
        PendingOrderDisplay: "block"
    };
    public render = () => {
        return (
            <Content>
                <ColumnNarrow>
                    <WalletBalanceContainer />
                    <div style={{display:this.state.PendingOrderDisplay}}>
                        <BuySellContainer/>
                    </div>
                    <div style={{display:this.state.LiquidationDisplay}}>
                        <FillOrderContainer/>
                    </div>
                </ColumnNarrow>
                <ColumnWide>
                    <OrderBookTableContainer />
                    <OrderHistoryContainer />
                </ColumnWide>
                <CheckMetamaskStateModalContainer />
            </Content>
        );
    };
    //更改父组件状态的方法
    public showLiquidation = (): void => {
        this.setState({
            LiquidationDisplay: 'block',
            PendingOrderDisplay: 'none'
        })
    }
    public PendingOrder = (): void => {
        this.setState({
            LiquidationDisplay: 'none',
            PendingOrderDisplay: 'block'
        })
    }
    
}

export { Marketplace };
