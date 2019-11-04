import { BigNumber } from '0x.js';
import React from 'react';
import { connect } from 'react-redux';
import { getWeb3Wrapper } from '../../../services/web3_wrapper';
import { getOrderbookAndUserOrders } from '../../../store/actions';
import { submitFillOrder } from '../../../store/relayer/actions_fillorder';
import { getEstimatedTxTimeMs, getQuoteToken, getStepsModalCurrentStep } from '../../../store/selectors';
import { addMarketBuySellNotification } from '../../../store/ui/actions';
import { tokenAmountInUnits, tokenSymbolToDisplayString } from '../../../util/tokens';
import { OrderSide, StepFillOrder, StoreState, Token, UIOrder } from '../../../util/types';
import { BaseStepModal } from './base_step_modal';
import { StepItem } from './steps_progress';



interface OwnProps {
    buildStepsProgress: (currentStepItem: StepItem) => StepItem[];
}
interface StateProps {
    estimatedTxTimeMs: number;
    step: StepFillOrder;
    quoteToken: Token;
}

interface DispatchProps {
    onSubmitFillOrder: (amount: BigNumber, targetOrder:UIOrder) => Promise<{ txHash: string; amountInReturn: BigNumber }>;
    refreshOrders: () => any;
    notifyBuySellMarket: (id: string, amount: BigNumber, token: Token, side: OrderSide, tx: Promise<any>) => any;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
    amountInReturn: BigNumber | null;
}

class FillOrderTokenStep extends React.Component<Props, State> {
    public state = {
        amountInReturn: null,
    };

    public render = () => {
        const { buildStepsProgress, estimatedTxTimeMs, step } = this.props;
        const { token, targetOrder } = step;
        const tokenSymbol = tokenSymbolToDisplayString(token.symbol);
        const side:OrderSide = targetOrder.side == OrderSide.Buy?OrderSide.Sell:OrderSide.Buy;
        const isBuy = side === OrderSide.Buy;
        const amountOfTokenString = `${tokenAmountInUnits(
            step.amount,
            step.token.decimals,
            step.token.displayDecimals,
        ).toString()} ${tokenSymbol}`;

        const title = 'Fill Order';

        const confirmCaption = `Confirm on Metamask to ${isBuy ? 'buy' : 'sell'} ${amountOfTokenString}.`;
        const loadingCaption = `Processing ${isBuy ? 'buy' : 'sale'} of ${amountOfTokenString}.`;
        const doneCaption = `${isBuy ? 'Buy' : 'Sell'} Order Complete!`;
        const errorCaption = `${isBuy ? 'buying' : 'selling'} ${amountOfTokenString}.`;
        const loadingFooterCaption = `Waiting for confirmation....`;
        const doneFooterCaption = `${isBuy ? amountOfTokenString : this._getAmountOfQuoteTokenString()} received`;

        return (
            <BaseStepModal
                step={step}
                title={title}
                confirmCaption={confirmCaption}
                loadingCaption={loadingCaption}
                doneCaption={doneCaption}
                errorCaption={errorCaption}
                loadingFooterCaption={loadingFooterCaption}
                doneFooterCaption={doneFooterCaption}
                buildStepsProgress={buildStepsProgress}
                estimatedTxTimeMs={estimatedTxTimeMs}
                runAction={this._confirmOnMetamaskBuyOrSell}
                showPartialProgress={true}
            />
        );
    };

    private readonly _confirmOnMetamaskBuyOrSell = async ({ onLoading, onDone, onError }: any) => {
        const { step, onSubmitFillOrder } = this.props;
        const { amount,  token } = step;
        try {
            const side:OrderSide = step.targetOrder.side == OrderSide.Buy?OrderSide.Sell:OrderSide.Buy;
            const web3Wrapper = await getWeb3Wrapper();
            const { txHash, amountInReturn } = await onSubmitFillOrder(amount, step.targetOrder);
            this.setState({ amountInReturn });
            onLoading();

            await web3Wrapper.awaitTransactionSuccessAsync(txHash);

            onDone();
            this.props.notifyBuySellMarket(txHash, amount, token, side, Promise.resolve());
            this.props.refreshOrders();
        } catch (err) {
            onError(err);
        }
    };

    private readonly _getAmountOfQuoteTokenString = (): string => {
        const { quoteToken } = this.props;
        const quoteTokenSymbol = tokenSymbolToDisplayString(quoteToken.symbol);
        const { amountInReturn } = this.state;
        return `${tokenAmountInUnits(
            amountInReturn || new BigNumber(0),
            quoteToken.decimals,
            quoteToken.displayDecimals,
        ).toString()} ${quoteTokenSymbol}`;
    };
}

const mapStateToProps = (state: StoreState): StateProps => {
    return {
        estimatedTxTimeMs: getEstimatedTxTimeMs(state),
        step: getStepsModalCurrentStep(state) as StepFillOrder,
        quoteToken: getQuoteToken(state) as Token,
    };
};

const FillOrderTokenStepContainer = connect(
    mapStateToProps,
    (dispatch: any) => {
        return {
            onSubmitFillOrder: (amount: BigNumber,  targetOrder: UIOrder) => dispatch(submitFillOrder(amount, targetOrder)),
            notifyBuySellMarket: (id: string, amount: BigNumber, token: Token, side: OrderSide, tx: Promise<any>) =>
                dispatch(addMarketBuySellNotification(id, amount, token, side, tx)),
            refreshOrders: () => dispatch(getOrderbookAndUserOrders()),
        };
    },
)(FillOrderTokenStep);

export { FillOrderTokenStep, FillOrderTokenStepContainer };

