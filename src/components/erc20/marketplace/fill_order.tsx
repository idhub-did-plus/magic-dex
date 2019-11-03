import { BigNumber } from '0x.js';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { initWallet, startBuySellLimitSteps, startBuySellMarketSteps } from '../../../store/actions';
import { fetchTakerAndMakerFee } from '../../../store/relayer/actions';
import { getCurrencyPair, getOrderPriceSelected, getWeb3State, getOrderSelected } from '../../../store/selectors';
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
    UIOrder,
} from '../../../util/types';
import { BigNumberInput } from '../../common/big_number_input';
import { Button } from '../../common/button';
import { CardBase } from '../../common/card_base';
import { CardTabSelector } from '../../common/card_tab_selector';
import { ErrorCard, ErrorIcons, FontSize } from '../../common/error_card';

import { OrderDetailsContainer } from './order_details';
import { startFillOrderSteps } from '../../../store/ui/actions_fillorder';
import { UI_DECIMALS_DISPLAYED_PRICE_ETH } from '../../../common/constants';

interface StateProps {
    web3State: Web3State;
    currencyPair: CurrencyPair;
    orderSelected: UIOrder | null;
}

interface DispatchProps {
    onSubmitFillOrder: (amount: BigNumber, side: OrderSide, takerFee: BigNumber, targetOrder: UIOrder) => Promise<any>;
    onConnectWallet: () => any;
    onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) => Promise<any>;
}

type Props = StateProps & DispatchProps;

interface State {
    makerAmount: BigNumber | null;
    orderSelected: UIOrder | null;
    tab: OrderSide;
    error: {
        btnMsg: string | null;
        cardMsg: string | null;
    };
}

const FillOrderWrapper = styled(CardBase)`
    margin-bottom: ${themeDimensions.verticalSeparationSm};
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
`;


const LabelContainer = styled.div`
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
`;

const Label = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    margin: 0;
`;


const FieldContainer = styled.div`
    height: ${themeDimensions.fieldHeight};
    margin-bottom: 25px;
    position: relative;
`;

const BigInputNumberStyled = styled<any>(BigNumberInput)`
    background-color: ${props => props.theme.componentsTheme.textInputBackgroundColor};
    border-radius: ${themeDimensions.borderRadius};
    border: 1px solid ${props => props.theme.componentsTheme.textInputBorderColor};
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-feature-settings: 'tnum' 1;
    font-size: 16px;
    height: 100%;
    padding-left: 14px;
    padding-right: 60px;
    position: absolute;
    width: 100%;
    z-index: 1;
`;
const BigNumberOutput = styled.input`
    background-color: ${props => props.theme.componentsTheme.textInputBackgroundColor};
    border-radius: ${themeDimensions.borderRadius};
    border: 1px solid ${props => props.theme.componentsTheme.textInputBorderColor};
    color: ${props => props.theme.componentsTheme.textInputTextColor};
    font-feature-settings: 'tnum' 1;
    font-size: 16px;
    height: 100%;
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
    font-size: 14px;
    font-weight: normal;
    line-height: 21px;
    text-align: right;
`;

const BigInputNumberTokenLabel = (props: { tokenSymbol: string }) => (
    <TokenContainer>
        <TokenText>{tokenSymbolToDisplayString(props.tokenSymbol)}</TokenText>
    </TokenContainer>
);

const TIMEOUT_BTN_ERROR = 2000;
const TIMEOUT_CARD_ERROR = 4000;

class FillOrder extends React.Component<Props, State> {
    public state: State = {
        makerAmount: null,
        orderSelected: null,

        tab: OrderSide.Buy,
        error: {
            btnMsg: null,
            cardMsg: null,
        },
    };

    public componentDidUpdate = async (prevProps: Readonly<Props>) => {
        const newProps = this.props;
        if (newProps.orderSelected !== prevProps.orderSelected) {
            this.setState({
                orderSelected: newProps.orderSelected,
                makerAmount: newProps.orderSelected == null ? new BigNumber(0) : newProps.orderSelected.remainingTakerAssetFillAmount
            });
        }

    };

    public render = () => {
        const { currencyPair, web3State } = this.props;
        const { makerAmount, orderSelected, tab, error } = this.state;

        let price: BigNumber = new BigNumber(0);
        if (orderSelected != null) {
            price = orderSelected.price;

        }


        const btnPrefix = (orderSelected == null) ? 'choose order' : (orderSelected.side == OrderSide.Buy ? 'Sell ' : 'Buy ');
        const btnText = error && error.btnMsg ? 'Error' : btnPrefix + tokenSymbolToDisplayString(currencyPair.base);

        const decimals = getKnownTokens().getTokenBySymbol(currencyPair.base).decimals;

        return (
            <>
                <FillOrderWrapper>
                    <TabsContainer>
                        <div>{btnPrefix}</div>
                    </TabsContainer>
                    <Content>
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

                        <>
                            <LabelContainer>
                                <Label>Price per token</Label>
                            </LabelContainer>
                            <FieldContainer>
                                <BigNumberOutput
                                    disabled={true}
                                     value={ parseFloat(price.toString()).toFixed(UI_DECIMALS_DISPLAYED_PRICE_ETH)}
                                     placeholder={'0.00'}
                                />
                                <BigInputNumberTokenLabel tokenSymbol={currencyPair.quote} />
                            </FieldContainer>
                        </>
                        )
                        <OrderDetailsContainer
                            orderType={OrderType.Fill}
                            orderSide={tab}
                            tokenAmount={makerAmount || new BigNumber(0)}
                            tokenPrice={price || new BigNumber(0)}
                            currencyPair={currencyPair}
                        />
                        <Button
                            disabled={web3State !== Web3State.Done}
                            icon={error && error.btnMsg ? ButtonIcons.Warning : undefined}
                            onClick={this.submit}
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
                    </Content>
                </FillOrderWrapper>
                {error && error.cardMsg ? (
                    <ErrorCard fontSize={FontSize.Large} text={error.cardMsg} icon={ErrorIcons.Sad} />
                ) : null}
            </>
        );
    };

    public changeTab = (tab: OrderSide) => () => this.setState({ tab });
    public updatePrice = (price: BigNumber) => {
       
    };
    public updateMakerAmount = (newValue: BigNumber) => {
        this.setState({
            makerAmount: newValue,
        });
    };


    public submit = async () => {
        if (this.props.orderSelected == null)
            return;
        const order: UIOrder = this.state.orderSelected as UIOrder;
        const orderSide = order.side;
        const makerAmount = this.state.makerAmount || new BigNumber(0);
        const price = order.price;

        const { makerFee, takerFee } = await this.props.onFetchTakerAndMakerFee(makerAmount, new BigNumber(price), this.state.tab);


        try {
            await this.props.onSubmitFillOrder(makerAmount, orderSide, takerFee, order);
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
            orderSelected: null,
        });
    };
}


const myOrderPriceSelected = (state: StoreState): BigNumber => {
    let o: UIOrder | null = getOrderSelected(state);
    if (o == null)
        return new BigNumber(0);
    return o.remainingTakerAssetFillAmount;
}
const mapStateToProps = (state: StoreState): StateProps => {
    return {
        web3State: getWeb3State(state),
        currencyPair: getCurrencyPair(state),
        orderSelected: getOrderSelected(state),
        //  makerAmount: myOrderPriceSelected(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {

        onSubmitFillOrder: (amount: BigNumber, side: OrderSide, takerFee: BigNumber, targetOrder: UIOrder) =>
            dispatch(startFillOrderSteps(amount, side, takerFee, targetOrder)),
        onConnectWallet: () => dispatch(initWallet()),
        onFetchTakerAndMakerFee: (amount: BigNumber, price: BigNumber, side: OrderSide) =>
            dispatch(fetchTakerAndMakerFee(amount, price, side)),
    };
};

const FillOrderContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FillOrder);

export { FillOrder, FillOrderContainer };
