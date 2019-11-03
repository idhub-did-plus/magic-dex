import { BigNumber } from '0x.js';
import { InsufficientOrdersAmountException } from '../../exceptions/insufficient_orders_amount_exception';
import { InsufficientTokenBalanceException } from '../../exceptions/insufficient_token_balance_exception';
import { isWeth } from '../../util/known_tokens';
import { buildMarketOrders } from '../../util/orders';
import { createBuySellMarketSteps } from '../../util/steps_modals_generation';
import { OrderSide, Step, ThunkCreator, Token, TokenBalance, UIOrder } from '../../util/types';
import * as selectors from '../selectors';
import { setStepsModalCurrentStep, setStepsModalDoneSteps, setStepsModalPendingSteps } from './actions';
import { createFillOrderSteps } from '../../util/steps_modals_generation_fillorder';



export const startFillOrderSteps: ThunkCreator = (amount: BigNumber, side: OrderSide, takerFee: BigNumber, targetOrder: UIOrder) => {
    return async (dispatch, getState) => {
        const state = getState();
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        const ethBalance = selectors.getEthBalance(state);
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const quoteTokenBalance = selectors.getQuoteTokenBalance(state);
        const baseTokenBalance = selectors.getBaseTokenBalance(state);

        const orders = side === OrderSide.Buy ? selectors.getOpenSellOrders(state) : selectors.getOpenBuyOrders(state);
        const { amounts, canBeFilled } = buildMarketOrders(
            {
                amount,
                orders,
            },
            side,
        );
        if (!canBeFilled) {
            throw new InsufficientOrdersAmountException();
        }

        const totalFilledAmount = amounts.reduce((total: BigNumber, currentValue: BigNumber) => {
            return total.plus(currentValue);
        }, new BigNumber(0));

        const price = totalFilledAmount.div(amount);

        if (side === OrderSide.Sell) {
            // When selling, user should have enough BASE Token
            if (baseTokenBalance && baseTokenBalance.balance.isLessThan(totalFilledAmount)) {
                throw new InsufficientTokenBalanceException(baseToken.symbol);
            }
        } else {
            // When buying and
            // if quote token is weth, should have enough ETH + WETH balance, or
            // if quote token is not weth, should have enough quote token balance
            const ifEthAndWethNotEnoughBalance =
                isWeth(quoteToken.symbol) && totalEthBalance.isLessThan(totalFilledAmount);
            const ifOtherQuoteTokenAndNotEnoughBalance =
                !isWeth(quoteToken.symbol) &&
                quoteTokenBalance &&
                quoteTokenBalance.balance.isLessThan(totalFilledAmount);
            if (ifEthAndWethNotEnoughBalance || ifOtherQuoteTokenAndNotEnoughBalance) {
                throw new InsufficientTokenBalanceException(quoteToken.symbol);
            }
        }

        const fillorderFlow: Step[] = createFillOrderSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            ethBalance,
            amount,
            side,
            price,
            takerFee,
            targetOrder
        );

        dispatch(setStepsModalCurrentStep(fillorderFlow[0]));
        dispatch(setStepsModalPendingSteps(fillorderFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};
