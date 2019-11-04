import { BigNumber } from '0x.js';
import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { UI_DECIMALS_DISPLAYED_PRICE_ETH } from '../../../common/constants';
import { initWallet } from '../../../store/actions';
import { fetchTakerAndMakerFee } from '../../../store/relayer/actions';
import { getCurrencyPair, getOrderSelected, getWeb3State } from '../../../store/selectors';
import { startFillOrderSteps } from '../../../store/ui/actions_fillorder';
import { themeDimensions } from '../../../themes/commons';
import { getKnownTokens } from '../../../util/known_tokens';
import { tokenSymbolToDisplayString } from '../../../util/tokens';
import { ButtonIcons, ButtonVariant, CurrencyPair, OrderSide, OrderType, StoreState, UIOrder, Web3State } from '../../../util/types';
import { BigNumberInput } from '../../common/big_number_input';
import { Button } from '../../common/button';
import { CardBase } from '../../common/card_base';
import { ErrorCard, ErrorIcons, FontSize } from '../../common/error_card';
import { OrderDetailsContainer } from './order_details';

interface StateProps {
    web3State: Web3State;
    currencyPair: CurrencyPair;
    orderSelected: UIOrder | null;
}

interface DispatchProps {
    onSubmitFillOrder: (amount: BigNumber, targetOrder: UIOrder) => Promise<any>;
    onConnectWallet: () => any;

}

type Props = StateProps & DispatchProps;

interface State {
    makerAmount: BigNumber;
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


const HeadLabel = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 18px;
    font-weight: 500;
    line-height: normal;
    align:center
    padding-left: 10px;
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
        makerAmount  : new BigNumber(0),
        error: {
            btnMsg: null,
            cardMsg: null,
        },
    };
    
    private setMakerAmount(order: UIOrder | null) {
        let ma = new BigNumber(0);
        if (order !== null) {

            if (order.side == OrderSide.Buy)
                ma = order.remainingTakerAssetFillAmount;
            else
                ma = order.remainingTakerAssetFillAmount.div(order.price);

        }
        if(this.state.makerAmount != ma)
            this.setState({
                makerAmount: ma
            }
            )
    }

    public componentDidUpdate = async (prevProps: Readonly<Props>) => {
        const newProps = this.props;
        if (newProps.orderSelected !== prevProps.orderSelected) {
            this.setMakerAmount(newProps.orderSelected)
        }

    };

    public render = () => {
        const { currencyPair, web3State } = this.props;
        const { error } = this.state;

        let price: BigNumber = new BigNumber(0);

        let btnText = null;
        let side = OrderSide.Buy;
        if (this.props.orderSelected == null) {
            btnText = 'choose order';

        }
        else {
            side = this.props.orderSelected.side == OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy
            price = this.props.orderSelected.price;
            const btnPrefix = side == OrderSide.Buy ? 'Sell ' : 'Buy ';
            btnText = error && error.btnMsg ? 'Error' : btnPrefix + tokenSymbolToDisplayString(currencyPair.base);

        }

        const decimals = getKnownTokens().getTokenBySymbol(currencyPair.base).decimals;

        return (
            <>
                <FillOrderWrapper>
                    <LabelContainer>
                        <HeadLabel>{'Fill Order'}</HeadLabel>
                    </LabelContainer>
                    <Content>
                        <LabelContainer>
                            <Label>Amount</Label>

                        </LabelContainer>
                        <FieldContainer>
                            <BigInputNumberStyled
                                decimals={decimals}
                                min={new BigNumber(0)}
                                onChange={this.updateMakerAmount}
                                value={this.state.makerAmount}
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
                                    value={parseFloat(price.toString()).toFixed(UI_DECIMALS_DISPLAYED_PRICE_ETH)}
                                    placeholder={'0.00'}
                                />
                                <BigInputNumberTokenLabel tokenSymbol={currencyPair.quote} />
                            </FieldContainer>
                        </>

                        <OrderDetailsContainer
                            orderType={OrderType.Fill}
                            orderSide={side}
                            tokenAmount={this.state.makerAmount || new BigNumber(0)}
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
                                    : this.props.orderSelected == null ? ButtonVariant.Buy : this.props.orderSelected.side === OrderSide.Buy
                                        ? ButtonVariant.Sell
                                        : ButtonVariant.Buy
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



    public updateMakerAmount = (newValue: BigNumber) => {

        this.setState({makerAmount : newValue})

    };


    public submit = async () => {
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

    };
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

        onSubmitFillOrder: (amount: BigNumber, targetOrder: UIOrder) =>
            dispatch(startFillOrderSteps(amount, targetOrder)),
        onConnectWallet: () => dispatch(initWallet()),

    };
};

const FillOrderContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FillOrder);

export { FillOrder, FillOrderContainer };

