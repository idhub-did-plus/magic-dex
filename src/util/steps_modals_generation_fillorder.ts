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
    ethBalance: BigNumber,
    amount: BigNumber,
 
    takerFee: BigNumber,
    targetOrder: UIOrder
): Step[] => {
    const buySellMarketFlow: Step[] = [];
    const side:OrderSide = targetOrder.side == OrderSide.Buy?OrderSide.Sell:OrderSide.Buy;
    const isBuy = side === OrderSide.Buy;
    const tokenToUnlock = isBuy ? quoteToken : baseToken;

    const unlockTokenStep = getUnlockTokenStepIfNeeded(tokenToUnlock, tokenBalances, wethTokenBalance);
    // Unlock token step should be added if it:
    // 1) it's a sell, or
    const isSell = unlockTokenStep && side === OrderSide.Sell;
    // 2) is a buy and
    // base token is not weth and is locked, or
    // base token is weth, is locked and there is not enouth plain ETH to fill the order
    const isBuyWithWethConditions =
        isBuy &&
        unlockTokenStep &&
        (!isWeth(tokenToUnlock.symbol) ||
            (isWeth(tokenToUnlock.symbol) && ethBalance.isLessThan(amount.multipliedBy(targetOrder.price))));
    if (isSell || isBuyWithWethConditions) {
        buySellMarketFlow.push(unlockTokenStep as Step);
    }

    // unlock zrx (for fees) if the taker fee is positive
    if (!isZrx(tokenToUnlock.symbol) && takerFee.isGreaterThan(0)) {
        const unlockZrxStep = getUnlockZrxStepIfNeeded(tokenBalances);
        if (unlockZrxStep) {
            buySellMarketFlow.push(unlockZrxStep);
        }
    }

    // wrap the necessary ether if necessary
    if (isWeth(quoteToken.symbol)) {
        const wrapEthStep = getWrapEthStepIfNeeded(amount, targetOrder.price, side, wethTokenBalance, ethBalance);
        if (wrapEthStep) {
            buySellMarketFlow.push(wrapEthStep);
        }
    }

    buySellMarketFlow.push({
        kind: StepKind.FillOrder,
        amount,
        side,
        token: baseToken,
        targetOrder
    });
    return buySellMarketFlow;
};
