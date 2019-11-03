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
    side: OrderSide,
    targetOrder: UIOrder
) => {
    return async (dispatch, getState, { getContractWrappers, getWeb3Wrapper }) => {
        const state = getState();
        const ethAccount = getEthAccount(state);
        const gasPrice = getGasPriceInWei(state);

        const isBuy = side === OrderSide.Buy;
        const allOrders = isBuy ? getOpenSellOrders(state) : getOpenBuyOrders(state);
        const { orders, amounts, canBeFilled } = buildMarketOrders(
            {
                amount,
                orders: allOrders,
            },
            side,
        );

        if (canBeFilled) {
            const baseToken = getBaseToken(state) as Token;
            const quoteToken = getQuoteToken(state) as Token;
            const contractWrappers = await getContractWrappers();

            // Check if the order is fillable using the forwarder
            const ethBalance = getEthBalance(state) as BigNumber;
            const ethAmountRequired = amounts.reduce((total: BigNumber, currentValue: BigNumber) => {
                return total.plus(currentValue);
            }, new BigNumber(0));
            const isEthBalanceEnough = ethBalance.isGreaterThan(ethAmountRequired);
            const isMarketBuyForwarder = isBuy && isWeth(quoteToken.symbol) && isEthBalanceEnough;

            let txHash;
            if (isMarketBuyForwarder) {
                txHash = await contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
                    orders,
                    amount,
                    ethAccount,
                    ethAmountRequired,
                    [],
                    AFFILIATE_FEE_PERCENTAGE,
                    FEE_RECIPIENT,
                    getTransactionOptions(gasPrice),
                );
            } else {
                if (isBuy) {
                    txHash = await contractWrappers.exchange.marketBuyOrdersAsync(
                        orders,
                        amount,
                        ethAccount,
                        getTransactionOptions(gasPrice),
                    );
                } else {
                    txHash = await contractWrappers.exchange.marketSellOrdersAsync(
                        orders,
                        amount,
                        ethAccount,
                        getTransactionOptions(gasPrice),
                    );
                }
            }

            const web3Wrapper = await getWeb3Wrapper();
            const tx = web3Wrapper.awaitTransactionSuccessAsync(txHash);

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

            const amountInReturn = sumTakerAssetFillableOrders(side, orders, amounts);

            return { txHash, amountInReturn };
        } else {
            window.alert(INSUFFICIENT_ORDERS_TO_FILL_AMOUNT_ERR);
            throw new InsufficientOrdersAmountException();
        }
    };
};

