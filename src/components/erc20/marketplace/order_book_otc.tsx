import { BigNumber } from '0x.js';
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
    grid-template-columns: 0.5fr 1fr 1fr 1fr 1fr 1fr 1fr;
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
        const remain = tokenAmountInUnits(order.remainingTakerAssetFillAmount, baseToken.decimals, UI_DECIMALS_DISPLAYED_ORDER_SIZE);
        const price = order.price.toString();
        let filled = new BigNumber(0);
        const filledF = tokenAmountInUnits(filled, baseToken.decimals, UI_DECIMALS_DISPLAYED_ORDER_SIZE);
        const mfa = tokenAmountInUnits(order.makerFillableAmountInTakerAsset, baseToken.decimals, UI_DECIMALS_DISPLAYED_ORDER_SIZE);

        if (order.filled != null)
            filled = order.filled;
        const color = order.side == OrderSide.Sell ? "#ff80b3" : "#4dff88"
        return (
            <GridRowInner
                key={index}
                onMouseEnter={this.hoverOn}
                onMouseLeave={this.hoverOff}
                // tslint:disable-next-line jsx-no-lambda
                onClick={() => {
                    this._setOrderSelected(order)
                }
                }
            >
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'center', color: color }}>
                    {order.side}
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right' }}>
                    <ShowNumberWithColors isHover={this.state.isHover} num={new BigNumber(size)} />
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right', color: color }}>
                    {parseFloat(price).toFixed(UI_DECIMALS_DISPLAYED_PRICE_ETH)}
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right' }}>
                    <ShowNumberWithColors isHover={this.state.isHover} num={new BigNumber(filledF)} />
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right' }}>
                    <ShowNumberWithColors isHover={this.state.isHover} num={new BigNumber(remain)} />
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'right' }}>
                    <ShowNumberWithColors isHover={this.state.isHover} num={new BigNumber(mfa)} />
                </CustomTD>
                <CustomTD as="div" styles={{ tabular: true, textAlign: 'center' }}>
                    {order.status}
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

        const getColor = (order: UIOrder): string => {
            return order.side === OrderSide.Buy ? theme.componentsTheme.green : theme.componentsTheme.red;
        };

        let content: React.ReactNode;

        if (web3State !== Web3State.Error && (!baseToken || !quoteToken)) {
            content = <CenteredLoading />;
        } else if ((!orders.length || !baseToken || !quoteToken)) {
            content = <EmptyContent alignAbsoluteCenter={true} text="There are no orders to show" />;
        } else {
            const mySizeHeader =
                web3State !== Web3State.Locked && web3State !== Web3State.NotInstalled ? (
                    <THLast as="div" styles={{ textAlign: 'right', borderBottom: true }}>
                        My Size
                    </THLast>
                ) : null;


            content = (
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
                            Filled
                        </TH>
                        <TH as="div" styles={{ textAlign: 'right', borderBottom: true }}>Remained</TH>
                        <TH as="div" styles={{ textAlign: 'right', borderBottom: true }}>Maker Fillable</TH>
                        <TH as="div" styles={{ textAlign: 'center', borderBottom: true }}>Status</TH>

                    </GridRowTop>



                    {orders.map((order, index) => (
                        <OrderToRowContainer
                            key={index}
                            order={order}
                            index={index}
                            count={orders.length}
                            baseToken={baseToken}
                            priceColor={getColor(order)}

                            web3State={web3State}
                        />
                    ))}




                </>
            );
        }

        return <OrderbookCard title="Orderbook">{content}</OrderbookCard>;
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
