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
import img from "../../../assets/Triangle 2@2x.png"

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
    LiquidationDisplay: string;
    OptionDisplay: string;
    checked: string;
    makerAmount: BigNumber;
    tab: OrderSide;
    error: {
        btnMsg: string | null;
        cardMsg: string | null;
    };
}

const FillOrderWrapper = styled(CardBase)`
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
    padding: 20px;
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


const HeadLabel = styled.label<{ color?: string }>`
    color: ${props => props.color || props.theme.componentsTheme.textColorCommon};
    font-size: 12px;
    // font-weight: 500;
    line-height: normal;
    align:center
    padding-left: 16px;
    padding-top: 10px;
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
    border-radius: 4px;
    border: 0;
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
        background-color: rgba(48,48,48,1);
    }
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
        LiquidationDisplay: "block",
        OptionDisplay: "none",
        checked: "Liquidation",
        makerAmount  : this.getMakerAmount(this.props.orderSelected),
        tab: OrderSide.Buy,
        error: {
            btnMsg: null,
            cardMsg: null,
        },
    };
    private setMakerAmount(order: UIOrder | null) {
        let ma = this.getMakerAmount(order);
        
        if(this.state.makerAmount != ma)
            this.setState({
                makerAmount: ma
            })
    }
    private getMakerAmount(order: UIOrder | null): BigNumber {
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
        if (newProps.orderSelected !== prevProps.orderSelected) {
            this.setMakerAmount(newProps.orderSelected)
        }

    };

    public render = () => {
        const { currencyPair, web3State } = this.props;
        const { error,tab } = this.state;

        let price: BigNumber = new BigNumber(0);

        let btnText = null;
        let side = OrderSide.Buy;
        if (this.props.orderSelected == null) {
            btnText = 'choose order';

        }
        else {
            side = this.props.orderSelected.side == OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy
            price = this.props.orderSelected.price;
            const btnPrefix = side == OrderSide.Buy ? 'Buy ' : 'Sell';
            btnText = error && error.btnMsg ? 'Error' : btnPrefix + tokenSymbolToDisplayString(currencyPair.base);

        }

        const decimals = getKnownTokens().getTokenBySymbol(currencyPair.base).decimals;

        return (
            <>
                <FillOrderWrapper style={{display:this.state.LiquidationDisplay}}>
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
                                <Li onClick={this.checked1.bind(this,"Pending Order")}>Pending Order</Li>
                                <Li onClick={this.checked2.bind(this,"Liquidation")}>Liquidation</Li>
                            </Option>
                        </FieldContainer>
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

    public select = () => {
        this.setState({
            OptionDisplay: this.state.OptionDisplay == "none"? "block":"none"
        })
    }
    
    public checked1 = (str: string) => {
        this.setState({
            checked: str,
            OptionDisplay: "none",
            LiquidationDisplay: "none"
        })
    }

    public checked2 = (str: string) => {
        this.setState({
            checked: str,
            OptionDisplay: "none",
            LiquidationDisplay: "block"
        })
    }

    public changeTab = (tab: OrderSide) => () => this.setState({ tab });

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

