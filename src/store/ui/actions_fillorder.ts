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
import { checkPropTypes } from 'prop-types';



export const startFillOrderSteps: ThunkCreator = (amount: BigNumber, targetOrder: UIOrder) => {
    return async (dispatch, getState) => {
        const side:OrderSide = targetOrder.side == OrderSide.Buy?OrderSide.Sell:OrderSide.Buy;
        const state = getState();
        const baseToken = selectors.getBaseToken(state) as Token;
        const quoteToken = selectors.getQuoteToken(state) as Token;
        const tokenBalances = selectors.getTokenBalances(state) as TokenBalance[];
        const wethTokenBalance = selectors.getWethTokenBalance(state) as TokenBalance;
        const totalEthBalance = selectors.getTotalEthBalance(state);
        const quoteTokenBalance = selectors.getQuoteTokenBalance(state);
        const baseTokenBalance = selectors.getBaseTokenBalance(state);
 

        check(side, baseTokenBalance, amount, baseToken, quoteToken, totalEthBalance, targetOrder, quoteTokenBalance);
   
        const fillorderFlow: Step[] = createFillOrderSteps(
            baseToken,
            quoteToken,
            tokenBalances,
            wethTokenBalance,
            amount,
            targetOrder
        );

        dispatch(setStepsModalCurrentStep(fillorderFlow[0]));
        dispatch(setStepsModalPendingSteps(fillorderFlow.slice(1)));
        dispatch(setStepsModalDoneSteps([]));
    };
};
function check(side: OrderSide, baseTokenBalance: TokenBalance | null, amount: BigNumber, baseToken: Token, quoteToken: Token, totalEthBalance: BigNumber, targetOrder: UIOrder, quoteTokenBalance: TokenBalance | null) {
    if (side === OrderSide.Sell) {
        // When selling, user should have enough BASE Token
        if (baseTokenBalance && baseTokenBalance.balance.isLessThan(amount)) {
            throw new InsufficientTokenBalanceException(baseToken.symbol);
        }
    }
    else {
        // When buying and
        // if quote token is weth, should have enough ETH + WETH balance, or
        // if quote token is not weth, should have enough quote token balance
        const ifEthAndWethNotEnoughBalance = isWeth(quoteToken.symbol) && totalEthBalance.isLessThan(amount.multipliedBy(targetOrder.price));
        const ifOtherQuoteTokenAndNotEnoughBalance = !isWeth(quoteToken.symbol) &&
            quoteTokenBalance &&
            quoteTokenBalance.balance.isLessThan(amount);
        if (ifEthAndWethNotEnoughBalance || ifOtherQuoteTokenAndNotEnoughBalance) {
            throw new InsufficientTokenBalanceException(quoteToken.symbol);
        }
    }
}

