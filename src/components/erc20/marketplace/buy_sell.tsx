import { BigNumber } from '0x.js';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { UI_DECIMALS_DISPLAYED_PRICE_ETH } from '../../../common/constants';
import { startFillOrderSteps } from '../../../store/ui/actions_fillorder';
import { initWallet, startBuySellLimitSteps, startBuySellMarketSteps } from '../../../store/actions';
import { fetchTakerAndMakerFee } from '../../../store/relayer/actions';
import { getCurrencyPair, getOrderPriceSelected, getWeb3State,getOrderSelected } from '../../../store/selectors';
import { themeDimensions } from '../../../themes/commons';
import { getKnownTokens } from '../../../util/known_tokens';
import { tokenSymbolToDisplayString } from '../../../util/tokens';
import {
    ButtonIcons,
    ButtonVariant,
    CurrencyPair,
    OrderSide,
    OrderType,
    StoreState,
    Web3State,
    UIOrder
} from '../../../util/types';
import { BigNumberInput } from '../../common/big_number_input';
import { Button } from '../../common/button';
import { CardBase } from '../../common/card_base';
import { CardTabSelector } from '../../common/card_tab_selector';
import { ErrorCard, ErrorIcons, FontSize } from '../../common/error_card';

import { OrderDetailsContainer } from './order_details';
import img from "../../../assets/Triangle 2@2x.png"

interface StateProps {
    web3State: Web3State;
    currencyPair: CurrencyPair;
    orderPriceSelected: BigNumber | null;
    orderSelected: UIOrder | null;
}

interface DispatchProps {
    //市价订单
    onSubmitFillOrder: (amount: BigNumber, targetOrder: UIOrder) => Promise<any>;
    //限价订单
    onSubmitLimitOrder: (amount: BigNumber, price: BigNumber, side: OrderSide, makerFee: BigNumber) => Promise<any>;
    onSubmitMarketOrder: (amount: BigNumber, side: OrderSide, takerFee: BigNumber) => Promise<any>;
    onConnectWallet: () => any;
    onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) => Promise<any>;
}

type Props = StateProps & DispatchProps;

interface State {
    OptionDisplay: string;
    checked: string;
    makerAmount: BigNumber | null;
    liquidationMakerAmount: BigNumber;
    orderType: OrderType;
    price: BigNumber | null;
    tab: OrderSide;
    error: {
        btnMsg: string | null;
        cardMsg: string | null;
    };
}

const BuySellWrapper = styled(CardBase)`
    margin-bottom: ${themeDimensions.verticalSeparationSm};
    border: 0;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px ${themeDimensions.horizontalPadding};
`;

const TabsContainer = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 20px ${themeDimensions.horizontalPadding};
    padding-bottom: 0;
`;

const TabButton = styled.div<{ isSelected: boolean; side: OrderSide }>`
    font-size:14px;
    align-items: center;
    background-color: ${props =>
        props.isSelected ? props.theme.componentsTheme.buttonBuyBackgroundColor : 'transparent'};
    border-top: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    border-bottom: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    border-color: ${props => props.theme.componentsTheme.cardBorderColor};
    color: ${props =>
        props.isSelected
            ? props.side === OrderSide.Buy
                ? props.theme.componentsTheme.buttonTextColor
                : props.theme.componentsTheme.buttonTextColor
            : props.theme.componentsTheme.textLight};
    cursor: ${props => (props.isSelected ? 'default' : 'pointer')};
    display: flex;
    height: 41px;
    justify-content: center;
    width: 50%;
`;

const LabelContainer = styled.div`
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
`;

const Label = styled.label<{ color?: string }>`
    color: #949AA1;
    font-size: 12px;
    font-weight: 400;
    line-height: normal;
    margin: 0;
`;

const InnerTabs = styled(CardTabSelector)`
    font-size: 12px;
`;

const FieldContainer = styled.div`
    height: ${themeDimensions.fieldHeight};
    margin-bottom: 15px;
    position: relative;
    background-color: ${props => props.theme.componentsTheme.dropdownBackgroundColor}
    border: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    border-radius: 4px;
`;

const BigInputNumberStyled = styled<any>(BigNumberInput)`
    background-color: ${props => props.theme.componentsTheme.dropdownBackgroundColor};
    border: 0;
    border-radius: 4px;
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-feature-settings: 'tnum' 1;
    font-size: 12px;
    height: 100%;
    padding: 0;
    padding-left: 14px;
    padding-right: 60px;
    position: absolute;
    width: 100%;
    z-index: 1;
`;

const TokenContainer = styled.div`
    display: flex;
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 12;
`;

const TokenText = styled.span`
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-size: 12px;
    font-weight: normal;
    line-height: 21px;
    text-align: right;
`;

const Select = styled.div`
    display: inline-block;
    width:85%;
    height:100%;
    border-right: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 12px;
    font-weight: normal;
    text-align: left;
    padding-left: 14px;
    padding-top: 14px;
`;
const Icon = styled.div`
    display: inline-block;
    margin-left: 19px;
    position: absolute;
    top: 13px;
    width: 9px;
    height: 6px;
    cursor: pointer;
`;
const Option = styled.ul`
    width: 101%;
    height:80px;
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-size: 12px;
    font-weight: normal;
    padding: 0;
    border: 1px solid ${props => props.theme.componentsTheme.cardBorderColor};
    border-radius: 4px;
    background-color: ${props => props.theme.componentsTheme.dropdownBackgroundColor};
    position: relative;
    z-index: 19;
    top: -5px;
`;

const Li = styled.li`
    width: 100%;
    height: 40px;
    line-height: 40px;
    list-style: none;
    padding: 0 20px;
    border-radius: 4px;

    &:hover {
        background-color: ${props => props.theme.componentsTheme.liBackground};
    }
`;

const BigNumberOutput = styled.input`
    background-color: ${props => props.theme.componentsTheme.dropdownBackgroundColor};
    border-radius: 4px;
    border: 0;
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-feature-settings: 'tnum' 1;
    font-size: 12px;
    height: 100%;
    padding-left: 14px;
    padding-right: 60px;
    position: absolute;
    width: 100%;
    z-index: 1;
`;

const BigInputNumberTokenLabel = (props: { tokenSymbol: string }) => (
    <TokenContainer>
        <TokenText>{tokenSymbolToDisplayString(props.tokenSymbol)}</TokenText>
    </TokenContainer>
);

const TIMEOUT_BTN_ERROR = 2000;
const TIMEOUT_CARD_ERROR = 4000;

class BuySell extends React.Component<Props, State> {
    public state: State = {
        OptionDisplay: "none",
        checked: "Pending Order",
        makerAmount: null,
        liquidationMakerAmount: this.getLiquidationMakerAmount(this.props.orderSelected),
        price: null,
        orderType: OrderType.Limit,
        tab: OrderSide.Buy,
        error: {
            btnMsg: null,
            cardMsg: null,
        },
    };
    //市价订单数量的两个方法
    private setLiquidationMakerAmount(order: UIOrder | null) {
        let ma = this.getLiquidationMakerAmount(order);
        
        if(this.state.liquidationMakerAmount != ma)
            this.setState({
                liquidationMakerAmount: ma
            })
    }
    private getLiquidationMakerAmount(order: UIOrder | null): BigNumber {
        let ma = new BigNumber(0);
        if (order !== null) {

            if (order.side == OrderSide.Buy)
                ma = order.remainingTakerAssetFillAmount;
            else
                ma = order.remainingTakerAssetFillAmount.div(order.price);

        }
       return ma;
    }

    public componentDidUpdate = async (prevProps: Readonly<Props>) => {
        const newProps = this.props;
        //限价订单价格
        if (newProps.orderPriceSelected !== prevProps.orderPriceSelected && this.state.orderType === OrderType.Limit) {
            this.setState({
                price: newProps.orderPriceSelected,
            });
        }
        //市价订单数量选择
        if (newProps.orderSelected !== prevProps.orderSelected) {
            this.setLiquidationMakerAmount(newProps.orderSelected)
        }
    };

    public render = () => {
        const { currencyPair, web3State } = this.props;
        const { makerAmount, price, tab, orderType, error } = this.state;
        //关于市价订单
        let liquidationPrice: BigNumber = new BigNumber(0);
        let liquidationBtnText = null;
        const btnPrefix = tab === OrderSide.Buy ? 'Buy ' : 'Sell ';

        if (this.props.orderSelected == null) {
            liquidationBtnText = 'choose order';
        }
        else {
            liquidationPrice = this.props.orderSelected.price;
            liquidationBtnText = error && error.btnMsg ? 'Error' : btnPrefix + tokenSymbolToDisplayString(currencyPair.base);
        }

        // const buySellInnerTabs = [
        //     {
        //         active: orderType === OrderType.Market,
        //         onClick: this._switchToMarket,
        //         text: 'Market',
        //     },
        //     {
        //         active: orderType === OrderType.Limit,
        //         onClick: this._switchToLimit,
        //         text: 'Limit',
        //     },
        // ];

        //关于限价订单
        const isMakerAmountEmpty = makerAmount === null || makerAmount.isZero();
        const isPriceEmpty = price === null || price.isZero();

        const orderTypeLimitIsEmpty = orderType === OrderType.Limit && (isMakerAmountEmpty || isPriceEmpty);
        const orderTypeMarketIsEmpty = orderType === OrderType.Market && isMakerAmountEmpty;

        // const btnPrefix = tab === OrderSide.Buy ? 'Buy ' : 'Sell ';
        const btnText = error && error.btnMsg ? 'Error' : btnPrefix + tokenSymbolToDisplayString(currencyPair.base);

        const decimals = getKnownTokens().getTokenBySymbol(currencyPair.base).decimals;

        return (
            <>
                <BuySellWrapper>
                    <TabsContainer>
                        <TabButton
                            isSelected={tab === OrderSide.Buy}
                            onClick={this.changeTab(OrderSide.Buy)}
                            side={OrderSide.Buy}
                            style={{borderRadius:'4px 0 0 4px',borderLeftWidth:'1px',borderLeftStyle:'solid'}}
                        >
                            Buy
                        </TabButton>
                        <TabButton
                            isSelected={tab === OrderSide.Sell}
                            onClick={this.changeTab(OrderSide.Sell)}
                            side={OrderSide.Sell}
                            style={{borderRadius:'0 4px 4px 0',borderRightWidth:'1px',borderRightStyle:'solid'}}
                        >
                            Sell
                        </TabButton>
                    </TabsContainer>
                    <Content>
                        <LabelContainer>
                            <Label>Order Type</Label>
                        </LabelContainer>
                        <FieldContainer>
                            <Select>{this.state.checked}</Select>
                            <Icon>
                                <img onClick={this.select} src={img} alt="" style={{width:'100%',height:'100%'}}/>
                            </Icon>
                            <Option style={{display:this.state.OptionDisplay}}>
                                <Li onClick={this._switchToLimit.bind(this,"Pending Order")}>Pending Order</Li>
                                <Li onClick={this._switchToMarket.bind(this,"Liquidation")}>Liquidation</Li>
                            </Option>
                        </FieldContainer>
                        
                        {orderType === OrderType.Limit ? (
                            //限价订单dom
                            <>
                                <LabelContainer>
                                    <Label>Amount</Label>
                                </LabelContainer>
                                <FieldContainer>
                                    <BigInputNumberStyled
                                        decimals={decimals}
                                        min={new BigNumber(0)}
                                        onChange={this.updateMakerAmount}
                                        value={makerAmount}
                                        placeholder={'0.00'}
                                    />
                                    <BigInputNumberTokenLabel tokenSymbol={currencyPair.base} />
                                </FieldContainer>
                                <LabelContainer>
                                    <Label>Price per token</Label>
                                </LabelContainer>
                                <FieldContainer>
                                    <BigInputNumberStyled
                                        decimals={0}
                                        min={new BigNumber(0)}
                                        onChange={this.updatePrice}
                                        value={price}
                                        placeholder={'0.00'}
                                    />
                                    <BigInputNumberTokenLabel tokenSymbol={currencyPair.quote} />
                                </FieldContainer>
                                <OrderDetailsContainer
                                    orderType={orderType}
                                    orderSide={tab}
                                    tokenAmount={makerAmount || new BigNumber(0)}
                                    tokenPrice={price || new BigNumber(0)}
                                    currencyPair={currencyPair}
                                />
                                <Button
                                    disabled={web3State !== Web3State.Done || orderTypeLimitIsEmpty || orderTypeMarketIsEmpty}
                                    icon={error && error.btnMsg ? ButtonIcons.Warning : undefined}
                                    onClick={this.LimitSubmit}
                                    variant={
                                        error && error.btnMsg
                                            ? ButtonVariant.Error
                                            : tab === OrderSide.Buy
                                            ? ButtonVariant.Buy
                                            : ButtonVariant.Sell
                                    }
                                >
                                    {btnText}
                                </Button>
                            </>
                        ) : (
                            //市价订单dom
                            <>
                                <LabelContainer>
                                    <Label>Amount</Label>
                                </LabelContainer>
                                <FieldContainer>
                                    <BigInputNumberStyled
                                        decimals={decimals}
                                        min={new BigNumber(0)}
                                        onChange={this.updateLiquidationMakerAmount}
                                        value={this.state.liquidationMakerAmount}
                                        placeholder={'0.00'}
                                    />
                                    <BigInputNumberTokenLabel tokenSymbol={currencyPair.base} />
                                </FieldContainer>
                                <LabelContainer>
                                    <Label>Price per token</Label>
                                </LabelContainer>
                                <FieldContainer>
                                    <BigNumberOutput
                                        disabled={true}
                                        value={parseFloat(liquidationPrice.toString()).toFixed(UI_DECIMALS_DISPLAYED_PRICE_ETH)}
                                        placeholder={'0.00'}
                                    />
                                    <BigInputNumberTokenLabel tokenSymbol={currencyPair.quote} />
                                </FieldContainer>
                                <OrderDetailsContainer
                                    orderType={OrderType.Fill}
                                    orderSide={tab}
                                    tokenAmount={this.state.makerAmount || new BigNumber(0)}
                                    tokenPrice={price || new BigNumber(0)}
                                    currencyPair={currencyPair}
                                />
                                <Button
                                    disabled={web3State !== Web3State.Done}
                                    icon={error && error.btnMsg ? ButtonIcons.Warning : undefined}
                                    onClick={this.LiquidationSubmit}
                                    variant={
                                        error && error.btnMsg
                                            ? ButtonVariant.Error
                                            : this.props.orderSelected == null ? ButtonVariant.Buy : this.props.orderSelected.side === OrderSide.Buy
                                                ? ButtonVariant.Sell
                                                : ButtonVariant.Buy
                                    }
                                >
                                    {liquidationBtnText}
                                </Button>
                            </>
                        )}
                        
                    </Content>
                </BuySellWrapper>
                {error && error.cardMsg ? (
                    <ErrorCard fontSize={FontSize.Large} text={error.cardMsg} icon={ErrorIcons.Sad} />
                ) : null}
            </>
        );
    };


    public select = () => {
        this.setState({
            OptionDisplay: this.state.OptionDisplay == "none"? "block":"none"
        })
    }

    public changeTab = (tab: OrderSide) => () => this.setState({ tab });

    //限价订单
    public updateMakerAmount = (newValue: BigNumber) => {
        this.setState({
            makerAmount: newValue,
        });
    };

    public updatePrice = (price: BigNumber) => {
        this.setState({ price });
    };

    //市价订单
    public updateLiquidationMakerAmount = (newValue: BigNumber) => {

        this.setState({liquidationMakerAmount : newValue})

    };
    //限价订单
    public LimitSubmit = async () => {
        const orderSide = this.state.tab;
        const makerAmount = this.state.makerAmount || new BigNumber(0);
        const price = this.state.price || new BigNumber(0);

        const { makerFee, takerFee } = await this.props.onFetchTakerAndMakerFee(makerAmount, price, this.state.tab);
        if (this.state.orderType === OrderType.Limit) {
            await this.props.onSubmitLimitOrder(makerAmount, price, orderSide, makerFee);
        } else {
            try {
                await this.props.onSubmitMarketOrder(makerAmount, orderSide, takerFee);
            } catch (error) {
                this.setState(
                    {
                        error: {
                            btnMsg: 'Error',
                            cardMsg: error.message,
                        },
                    },
                    () => {
                        // After a timeout both error message and button gets cleared
                        setTimeout(() => {
                            this.setState({
                                error: {
                                    ...this.state.error,
                                    btnMsg: null,
                                },
                            });
                        }, TIMEOUT_BTN_ERROR);
                        setTimeout(() => {
                            this.setState({
                                error: {
                                    ...this.state.error,
                                    cardMsg: null,
                                },
                            });
                        }, TIMEOUT_CARD_ERROR);
                    },
                );
            }
        }
        this._reset();
    };

    //市价订单
    public LiquidationSubmit = async () => {
        if (this.props.orderSelected == null)
            return;
        const order: UIOrder = this.props.orderSelected as UIOrder;
        const makerAmount = this.state.makerAmount || new BigNumber(0);
        try {
            await this.props.onSubmitFillOrder(makerAmount, order);
        } catch (error) {
            this.setState(
                {
                    error: {
                        btnMsg: 'Error',
                        cardMsg: error.message,
                    },
                },
                () => {
                    // After a timeout both error message and button gets cleared
                    setTimeout(() => {
                        this.setState({
                            error: {
                                ...this.state.error,
                                btnMsg: null,
                            },
                        });
                    }, TIMEOUT_BTN_ERROR);
                    setTimeout(() => {
                        this.setState({
                            error: {
                                ...this.state.error,
                                cardMsg: null,
                            },
                        });
                    }, TIMEOUT_CARD_ERROR);
                },
            );
        }

        this._reset();
    };

    private readonly _reset = () => {
        this.setState({
            makerAmount: null,
            price: null,
        });
    };

    private readonly _switchToMarket = (str:string) => {
        this.setState({
            orderType: OrderType.Market,
            checked: str,
            OptionDisplay: "none",

        });
    };

    private readonly _switchToLimit = (str:string) => {
        this.setState({
            orderType: OrderType.Limit,
            checked: str,
            OptionDisplay: "none",
        });
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        web3State: getWeb3State(state),
        currencyPair: getCurrencyPair(state),
        orderPriceSelected: getOrderPriceSelected(state),
        //市价
        orderSelected: getOrderSelected(state)
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onSubmitLimitOrder: (amount: BigNumber, price: BigNumber, side: OrderSide, makerFee: BigNumber) =>
            dispatch(startBuySellLimitSteps(amount, price, side, makerFee)),
        onSubmitMarketOrder: (amount: BigNumber, side: OrderSide, takerFee: BigNumber) =>
            dispatch(startBuySellMarketSteps(amount, side, takerFee)),
        onConnectWallet: () => dispatch(initWallet()),
        onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) =>
            dispatch(fetchTakerAndMakerFee(amount, price, side)),
        //市价
        onSubmitFillOrder: (amount: BigNumber, targetOrder: UIOrder) =>
            dispatch(startFillOrderSteps(amount, targetOrder)),
    };
};

const BuySellContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(BuySell);

export { BuySell, BuySellContainer };
