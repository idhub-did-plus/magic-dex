import { BigNumber, SignedOrder } from '0x.js';

import { isWeth, isZrx } from './known_tokens';
import {
    Collectible,
    OrderSide,
    Step,
    StepBuyCollectible,
    StepKind,
    StepToggleTokenLock,
    StepUnlockCollectibles,
    StepWrapEth,
    Token,
    TokenBalance,
    UIOrder,
} from './types';
import { getUnlockTokenStepIfNeeded, getUnlockZrxStepIfNeeded, getWrapEthStepIfNeeded } from './steps_modals_generation';

export const createFillOrderSteps = (
    baseToken: Token,
    quoteToken: Token,
    tokenBalances: TokenBalance[],
    wethTokenBalance: TokenBalance,
    amount: BigNumber,

    targetOrder: UIOrder
): Step[] => {
    const sprices = targetOrder.price.toFixed(15);
    const sprice = targetOrder.price.toFixed(5);

    const price: BigNumber = new BigNumber(sprice).plus(new BigNumber(0.00001));

    const side: OrderSide = targetOrder.side == OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy;
    const makerFee: BigNumber = targetOrder.rawOrder.takerFee;
    const fillOrderFlow: Step[] = [];
    let unlockBaseOrQuoteTokenStep;

    // unlock base and quote tokens if necessary

    unlockBaseOrQuoteTokenStep =
        side === OrderSide.Buy
            ? // If it's a buy -> the quote token has to be unlocked
            getUnlockTokenStepIfNeeded(quoteToken, tokenBalances, wethTokenBalance)
            : // If it's a sell -> the base token has to be unlocked
            getUnlockTokenStepIfNeeded(baseToken, tokenBalances, wethTokenBalance);

    if (unlockBaseOrQuoteTokenStep) {
        fillOrderFlow.push(unlockBaseOrQuoteTokenStep);
    }

    // unlock zrx (for fees) if it's not one of the traded tokens and if the maker fee is positive
    if (!isZrx(baseToken.symbol) && !isZrx(quoteToken.symbol) && makerFee.isGreaterThan(0)) {
        const unlockZrxStep = getUnlockZrxStepIfNeeded(tokenBalances);
        if (unlockZrxStep) {
            fillOrderFlow.push(unlockZrxStep);
        }
    }

    // wrap the necessary ether if it is one of the traded tokens
    if (isWeth(baseToken.symbol) || isWeth(quoteToken.symbol)) {
        const wrapEthStep = getWrapEthStepIfNeeded(amount, price, side, wethTokenBalance);
        if (wrapEthStep) {
            fillOrderFlow.push(wrapEthStep);
        }
    }
    fillOrderFlow.push({
        kind: StepKind.FillOrder,
        amount,
        token: baseToken,
        targetOrder
    });
    return fillOrderFlow;
};
