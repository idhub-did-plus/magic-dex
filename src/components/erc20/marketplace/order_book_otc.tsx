import { BigNumber, OrderStatus } from '0x.js';
import React from 'react';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components';

import {
    UI_DECIMALS_DISPLAYED_ORDER_SIZE,
    UI_DECIMALS_DISPLAYED_PRICE_ETH,
    UI_DECIMALS_DISPLAYED_SPREAD_PERCENT,
} from '../../../common/constants';
import {
    getBaseToken,
    getQuoteToken,

    getUserOrders,
    getWeb3State,
    getOrders,
} from '../../../store/selectors';
import { setOrderSelected } from '../../../store/ui/actions';
import { Theme, themeBreakPoints } from '../../../themes/commons';
import { tokenAmountInUnits } from '../../../util/tokens';
import { OrderSide, StoreState, Token, UIOrder, Web3State } from '../../../util/types';
import { Card } from '../../common/card';
import { EmptyContent } from '../../common/empty_content';
import { LoadingWrapper } from '../../common/loading';
import { ShowNumberWithColors } from '../../common/show_number_with_colors';
import { CustomTD, CustomTDLast, CustomTDTitle, TH, THLast } from '../../common/table';


interface StateProps {
    orders: UIOrder[];
    baseToken: Token | null;
    quoteToken: Token | null;
    userOrders: UIOrder[];
    web3State?: Web3State;

}

interface OwnProps {
    theme: Theme;
}

type Props = OwnProps & StateProps;

const OrderbookCard = styled(Card)`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    max-height: 100%;

    > div:first-child {
        flex-grow: 0;
        flex-shrink: 0;
    }

    > div:nth-child(2) {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
        padding-bottom: 0;
        padding-left: 0;
        padding-right: 0;
    }
`;

const GridRow = styled.div`
    display: grid;
    grid-template-columns: 0.5fr 1fr 1fr 1fr  1fr;
`;

const GridRowInner = styled(GridRow)`
    background-color: 'transparent';
    cursor: pointer;
    &:hover {
        background-color: ${props => props.theme.componentsTheme.rowOrderActive};
    }
`;

const GridRowTop = styled(GridRow)`
    flex-grow: 0;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
`;

const CenteredLoading = styled(LoadingWrapper)`
    height: 100%;
`;

const Spread = styled.div`
    width: 100%;
    height: 30px;
    line-height: 30px;
    background-color: ${props => props.theme.componentsTheme.spreadBackground};
`
const Span = styled.span`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    padding-left: 27px;
`

const BuySellBox = styled.div`
    height: 45%
    width: 100%;
    position: relative;
`

const BuySellEmptyContent = styled(EmptyContent)`
    height: 47%;
    top: -12px;
`

interface OrderToRowPropsOwn {
    order: UIOrder;
    index: number;
    count: number;
    baseToken: Token;
    priceColor: string;

    web3State?: Web3State;
}

interface OrderToRowDispatchProps {
    onSetOrderSelected: (orderSelected: UIOrder) => Promise<any>;
}

type OrderToRowProps = OrderToRowPropsOwn & OrderToRowDispatchProps;

interface State {
    isHover: boolean;
}
const  string_of_enum = (enumn: any, value: any)=>
{
  for (var k in enumn) 
    if (enumn[k] == value)
        return k;
  return null;
}
class OrderToRow extends React.Component<OrderToRowProps> {
    public state: State = {
        isHover: false,
    };

    public hoverOn = () => {
        this.setState({ isHover: true });
    };

    public hoverOff = () => {
        this.setState({ isHover: false });
    };


    public render = () => {
        const { order, index, baseToken, priceColor = [], web3State } = this.props;
        const size = tokenAmountInUnits(order.size, baseToken.decimals, UI_DECIMALS_DISPLAYED_ORDER_SIZE);
        let ma = new BigNumber(0);
        if(order !== null){
           
            if(order.side == OrderSide.Buy)
                ma = order.remainingTakerAssetFillAmount;
            else
                ma = order.remainingTakerAssetFillAmount.div(order.price);
              
        }
        const remained = tokenAmountInUnits(ma, baseToken.decimals, UI_DECIMALS_DISPLAYED_ORDER_SIZE);
        const price = order.price.toString();
        let filled = new BigNumber(0);
       
        if (order.filled != null)
            filled = order.filled;
        const filledF = tokenAmountInUnits(filled, baseToken.decimals, UI_DECIMALS_DISPLAYED_ORDER_SIZE);
    
        const color = order.side == OrderSide.Sell ? "#FFDD5A55" : "#FF32B7AE"
        return (
            <GridRowInner
                key={index}
                onMouseEnter={this.hoverOn}
                onMouseLeave={this.hoverOff}
                // tslint:disable-next-line jsx-no-lambda
                onClick={() => {
                    this._setOrderSelected(order)
                }}
            >
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'center', color: color }}>
                    {string_of_enum(OrderSide, order.side)}
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right' }}>
                    <ShowNumberWithColors isHover={this.state.isHover} num={new BigNumber(size)} />
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right', color: color }}>
                    {parseFloat(price).toFixed(UI_DECIMALS_DISPLAYED_PRICE_ETH)}
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right' }}>
                    <ShowNumberWithColors isHover={this.state.isHover} num={new BigNumber(remained)} />
                </CustomTD>
  
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'center' }}>
                    {string_of_enum(OrderStatus, order.status)}
                </CustomTD>


            </GridRowInner>
        );
    };

    private readonly _setOrderSelected = async (size: UIOrder) => {
        await this.props.onSetOrderSelected(size);
    };
}

const mapOrderToRowDispatchToProps = (dispatch: any): OrderToRowDispatchProps => {
    return {
        onSetOrderSelected: (orderSelected: UIOrder) => dispatch(setOrderSelected(orderSelected)),
    };
};

const OrderToRowContainer = connect(
    null,
    mapOrderToRowDispatchToProps,
)(OrderToRow);

class OrderBookTable extends React.Component<Props> {

    private readonly _itemsScroll: React.RefObject<HTMLDivElement>;


    constructor(props: Props) {
        super(props);

        this._itemsScroll = React.createRef();
    }

    public render = () => {
        const { orders, baseToken, quoteToken, web3State, theme } = this.props;
        
        //从全部订单orders中，分别过滤出类型为Sell和Buy的订单列表
        const ordersToShowSell = orders.filter(order => order.side === OrderSide.Sell);
        const ordersToShowBuy = orders.filter(order => order.side === OrderSide.Buy);

        const getColor = (order: UIOrder): string => {
            return order.side === OrderSide.Buy ? theme.componentsTheme.buyOrderColor : theme.componentsTheme.sellOrderColor;
        };

        let contentSell: React.ReactNode;
        let contentBuy: React.ReactNode;

        //渲染Sell类型的订单
        if (web3State !== Web3State.Error && (!baseToken || !quoteToken)) {
            contentSell = <CenteredLoading />;
        } else if ((!ordersToShowSell.length || !baseToken || !quoteToken)) {
            contentSell = <BuySellEmptyContent alignAbsoluteCenter={true} text="There are no Sell orders to show" />;
        } else {
            const mySizeHeader =
                web3State !== Web3State.Locked && web3State !== Web3State.NotInstalled ? (
                    <THLast as="div" styles={{ textAlign: 'right', borderBottom: true }}>
                        My Size
                    </THLast>
                ) : null;


            contentSell = (
                <>
                    <GridRowTop as="div">
                        <TH as="div" styles={{ textAlign: 'center', borderBottom: true }}>
                            Side
                        </TH>
                        <TH as="div" styles={{ textAlign: 'right', borderBottom: true }}>
                            Trade size
                        </TH>
                        <TH as="div" styles={{ textAlign: 'right', borderBottom: true }}>
                            Price ({quoteToken.symbol})
                        </TH>
                        <TH as="div" styles={{ textAlign: 'right', borderBottom: true }}>
                            Remaining
                        </TH>

                        <TH as="div" styles={{ textAlign: 'center', borderBottom: true }}>Status</TH>

                    </GridRowTop>



                    {ordersToShowSell.map((order, index) => (
                        <OrderToRowContainer
                            key={index}
                            order={order}
                            index={index}
                            count={ordersToShowSell.length}
                            baseToken={baseToken}
                            priceColor={getColor(order)}

                            web3State={web3State}
                        />
                    ))}

                </>
            );
        }

        //渲染Buy类型的订单
        if (web3State !== Web3State.Error && (!baseToken || !quoteToken)) {
            contentBuy = <CenteredLoading />;
        } else if((!ordersToShowBuy.length || !baseToken || !quoteToken)){
            contentBuy = <BuySellEmptyContent alignAbsoluteCenter={true} text="There are no Buy orders to show" />;
        } else {
            const mySizeHeader =
                web3State !== Web3State.Locked && web3State !== Web3State.NotInstalled ? (
                    <THLast as="div" styles={{ textAlign: 'right', borderBottom: true }}>
                        My Size
                    </THLast>
                ) : null;

            contentBuy = (
                <>
                    
                    {ordersToShowBuy.map((order, index) => (
                        <OrderToRowContainer
                            key={index}
                            order={order}
                            index={index}
                            count={ordersToShowBuy.length}
                            baseToken={baseToken}
                            priceColor={getColor(order)}
                            web3State={web3State}
                        />
                    ))}

                </>
            );
        }

        return  <OrderbookCard title="Orderbook" >
                    <BuySellBox>{contentSell}</BuySellBox>
                    <Spread>
                        <Span>spread</Span>
                        <Span style={{marginLeft: '400px'}}>--</Span>
                    </Spread>
                    <BuySellBox style={{marginTop: '12px'}}>{contentBuy}</BuySellBox>
                </OrderbookCard>
    };



}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        orders: getOrders(state),
        baseToken: getBaseToken(state),
        userOrders: getUserOrders(state),
        quoteToken: getQuoteToken(state),
        web3State: getWeb3State(state),

    };
};

const OrderBookTableContainer = withTheme(connect(mapStateToProps)(OrderBookTable));
const OrderBookTableWithTheme = withTheme(OrderBookTable);

export { OrderBookTable, OrderBookTableWithTheme, OrderBookTableContainer };
