import { BigNumber } from '0x.js';
import { AFFILIATE_FEE_PERCENTAGE, FEE_RECIPIENT } from '../../common/constants';
import { INSUFFICIENT_ORDERS_TO_FILL_AMOUNT_ERR } from '../../exceptions/common';
import { InsufficientOrdersAmountException } from '../../exceptions/insufficient_orders_amount_exception';
import { isWeth } from '../../util/known_tokens';
import { getLogger } from '../../util/logger';
import { buildMarketOrders, sumTakerAssetFillableOrders } from '../../util/orders';
import { getTransactionOptions } from '../../util/transactions';
import { NotificationKind, OrderSide, ThunkCreator, Token, UIOrder } from '../../util/types';
import { updateTokenBalances } from '../blockchain/actions';
import { getBaseToken, getEthAccount, getEthBalance, getGasPriceInWei, getOpenBuyOrders, getOpenSellOrders, getQuoteToken } from '../selectors';
import { addNotifications } from '../ui/actions';
import { getOrderbookAndUserOrders } from './actions';

export const submitFillOrder: ThunkCreator<Promise<{ txHash: string; amountInReturn: BigNumber }>> = (
    amount: BigNumber,
    targetOrder: UIOrder
) => {
    return async (dispatch, getState, { getContractWrappers, getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const gasPrice = getGasPriceInWei(state);

        const baseToken = getBaseToken(state) as Token;
        const quoteToken = getQuoteToken(state) as Token;
        const contractWrappers = await getContractWrappers();
        let ma = targetOrder.side == OrderSide.Sell ? amount.multipliedBy(targetOrder.price.toFixed(10)) : amount;
        console.log(ma.toString())

        let txHash = await contractWrappers.exchange.fillOrderAsync(
            targetOrder.rawOrder,
            ma,
            ethAccount,
            getTransactionOptions(gasPrice),
        );



        const web3Wrapper = await getWeb3Wrapper();
        const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);
        const side: OrderSide = targetOrder.side == OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy;
        // tslint:disable-next-line:no-floating-promises
        dispatch(getOrderbookAndUserOrders());
        // tslint:disable-next-line:no-floating-promises
        dispatch(updateTokenBalances());
        dispatch(
            addNotifications([
                {
                    id: txHash,
                    kind: NotificationKind.Market,
                    amount,
                    token: baseToken,
                    side,
                    tx,
                    timestamp: new Date(),
                },
            ]),
        );


        return { txHash, amountInReturn: amount };

    };
};

