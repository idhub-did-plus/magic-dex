import React, { HTMLAttributes } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { themeDimensions } from '../../themes/commons';
import { CurrencyPair, Filter, Market, StoreState, Token } from '../../util/types';
import { CardBase } from '../common/card_base';
import { Dropdown } from '../common/dropdown';
import { ChevronDownIcon } from '../common/icons/chevron_down_icon';
import { DropdownTextItem } from '../common/dropdown_text_item';
import { CustomTDFirst, CustomTDLast, Table, TBody, THead, THFirst, THLast, TR } from '../common/table';
import { getRelayer } from '../../store/selectors';
import { setRelayer } from '../../store/relayer/actions';

interface PropsDivElement extends HTMLAttributes<HTMLDivElement> {}

interface DispatchProps {
    changeRelayer: (relayer: string) => any;
   
}

interface PropsToken {
    relayer: string;
   
}

type Props = PropsDivElement & PropsToken & DispatchProps;

interface State {
    selectedFilter: Filter;
    search: string;
    isUserOnDropdown: boolean;
}

interface MarketRowProps {
    active: boolean;
}


const SettingDropdownWrapper = styled(Dropdown)``;

const SettingDropdownHeader = styled.div`
    align-items: center;
    display: flex;
`;

const SettingDropdownHeaderText = styled.span`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 18px;
    // font-weight: 600;
    line-height: 26px;
    margin-right: 10px;
`;

const SettingDropdownBody = styled(CardBase)`
    box-shadow: ${props => props.theme.componentsTheme.boxShadow};
    max-height: 100%;
    max-width: 100%;
    width: 401px;
`;


const TableWrapper = styled.div`
    max-height: 420px;
    overflow: auto;
    position: relative;
`;

const verticalCellPadding = `
    padding-bottom: 10px;
    padding-top: 10px;
`;

const tableHeaderFontWeight = `
    // font-weight: 700;
`;

const TRStyled = styled(TR)<MarketRowProps>`
    background-color: ${props => (props.active ? props.theme.componentsTheme.rowActive : 'transparent')};
    cursor: ${props => (props.active ? 'default' : 'pointer')};

    &:hover {
        background-color: ${props => props.theme.componentsTheme.rowActive};
    }

    &:last-child > td {
        border-bottom-left-radius: ${themeDimensions.borderRadius};
        border-bottom-right-radius: ${themeDimensions.borderRadius};
        border-bottom: none;
    }
`;

// Has a special left-padding: needs a specific selector to override the theme
const THFirstStyled = styled(THFirst)`
    ${verticalCellPadding}
    ${tableHeaderFontWeight}

    &, &:last-child {
        padding-left: 21.6px;
    }
`;

const THLastStyled = styled(THLast)`
    ${verticalCellPadding};
    ${tableHeaderFontWeight}
`;

const CustomTDFirstStyled = styled(CustomTDFirst)`
    ${verticalCellPadding};
`;


const TokenIconAndLabel = styled.div`
    align-items: center;
    display: flex;
    justify-content: flex-start;
`;

const TokenLabel = styled.div`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-size: 14px;
    // font-weight: 700;
    line-height: 1.2;
    margin: 0 0 0 12px;
`;
const keyof = (target: any, value: any)=>{
    let rst:any = null;
    Object.keys(target).map((key:any)=>{
        let v: any = target[key];
        if(value == v)
            rst = key;

    })
    return rst;

}

class SettingDropdown extends React.Component<Props, State> {

    private relayers:any = {radar:'https://api.kovan.radarrelay.com/0x/v2', local:'http://localhost:3000/0x/v2'};
    private readonly _dropdown = React.createRef<Dropdown>();

    public render = () => {
        const { relayer, ...restProps } = this.props;

        const header = (
            <SettingDropdownHeader>
                <SettingDropdownHeaderText>
                   
                    {keyof(this.relayers, relayer)}
                </SettingDropdownHeaderText>
                <ChevronDownIcon />
            </SettingDropdownHeader>
        );

        const body = (
            <SettingDropdownBody>
               
                <TableWrapper>{this._getSetting(relayer)}</TableWrapper>
            </SettingDropdownBody>
        );
        return (
            <SettingDropdownWrapper
                body={body}
                header={header}
                ref={this._dropdown}
                shouldCloseDropdownOnClickOutside={true}
                {...restProps}
            />
        );
    };


   
    private readonly _getSetting = (relayer:string) => {
       
        return (
            <Table>
                <THead>
                    <TR>
                        <THFirstStyled styles={{ textAlign: 'left' }}>relayer url</THFirstStyled>
                      
                    </TR>
                </THead>
                <TBody>
                    {
                        
                        Object.keys(this.relayers).map((key:any) => {
                            let relay = this.relayers[key];
                        const isActive = relay == relayer;
                        const selectedRelayer = () => this.setSelectedRelayer(relay);
                        return (
                            <TRStyled active={isActive} key={key} onClick={selectedRelayer}>
                                <CustomTDFirstStyled styles={{ textAlign: 'left', borderBottom: true }}>
                                    <TokenIconAndLabel>
                                    <TokenLabel>
                                            {key}
                                        </TokenLabel>
                                        <TokenLabel>
                                            {relay}
                                        </TokenLabel>
                                    </TokenIconAndLabel>
                                </CustomTDFirstStyled>
                               
                            </TRStyled>
                        );
                    })}
                </TBody>
            </Table>
        );
    };

    private readonly setSelectedRelayer: any = (relay: string) => {
        this.props.changeRelayer(relay);
       
        if (this._dropdown.current) {
            this._dropdown.current.closeDropdown();
        }
    };

}

const mapStateToProps = (state: StoreState): PropsToken => {
    return {
        relayer: getRelayer(state),
       
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        changeRelayer: (relay: string) => dispatch(setRelayer(relay)),
       
    };
};

const SettingDropdownContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SettingDropdown);

export { SettingDropdown, SettingDropdownContainer };
